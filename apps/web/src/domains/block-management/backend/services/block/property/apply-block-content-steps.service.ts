/**
 * Block 콘텐츠 Step 적용 서비스 (ProseMirror steps)
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Node } from '@tiptap/pm/model';
import { Step } from '@tiptap/pm/transform';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { ApplyContentStepsCommand } from '../../../../shared/commands';
import type { ApplyBlockContentStepsRequest } from '../../../../shared/dtos/requests/block.requests';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import { BlockId } from '../../../../shared/value-objects/block-id.vo';
import {
  EMPTY_TIPTAP_DOC,
  extractPlainText,
} from '../../../../shared/utils/tiptap-markdown.utils';
import { pmSchema } from '../../../../shared/utils/prosemirror-schema';
import type { IBlockRepository } from '../../../repositories/interfaces/block.repository.interface';

/**
 * 블록 콘텐츠에 ProseMirror steps 적용
 *
 * 1. DB에서 block 로드 (content + content_version)
 * 2. baseVersion !== block.contentVersion → CONTENT_VERSION_MISMATCH
 * 3. 현재 content로 ProseMirror Doc 재구성
 * 4. steps 순서대로 적용
 * 5. 결과 doc → JSON, contentRaw는 서버에서 생성
 * 6. Block entity 업데이트 + version 증가
 * 7. Repository 저장 및 이벤트 처리
 */
export async function applyBlockContentSteps(
  safeDto: ApplyBlockContentStepsRequest,
  safeUserId: UserId,
  blockRepository: IBlockRepository
): Promise<
  Result<
    { newVersion: number; updatedAt: Date },
    BlockManagementError | Error
  >
> {
  try {
    const blockId = new BlockId(safeDto.blockId);

    const block = await blockRepository.findById(blockId);
    if (!block) {
      return Result.error(
        new BlockManagementError('BLOCK_NOT_FOUND', 'Block not found')
      );
    }

    if (safeDto.baseVersion !== block.contentVersion) {
      return Result.error(
        new BlockManagementError('CONTENT_VERSION_MISMATCH', 'Content version mismatch', {
          serverVersion: block.contentVersion,
          serverContent: block.content,
          clientVersion: safeDto.baseVersion,
        })
      );
    }

    const currentContent =
      (block.content as object) || EMPTY_TIPTAP_DOC;
    let doc = Node.fromJSON(pmSchema, currentContent);

    for (const stepJSON of safeDto.steps) {
      const step = Step.fromJSON(pmSchema, stepJSON as Record<string, unknown>);
      const result = step.apply(doc);
      if (result.failed) {
        return Result.error(
          new BlockManagementError(
            'PROPERTY_UPDATE_FAILED',
            `Step apply failed: ${result.failed}`
          )
        );
      }
      doc = result.doc!;
    }

    const newContent = doc.toJSON();
    const contentRaw = extractPlainText(
      newContent as Parameters<typeof extractPlainText>[0]
    );

    const aggregate = BlockAggregate.reconstitute(block);
    const command: ApplyContentStepsCommand = {
      content: newContent,
      contentRaw,
      userId: safeUserId,
      steps: safeDto.steps,
      baseVersion: safeDto.baseVersion,
      newVersion: block.contentVersion + 1,
    };
    aggregate.applyContentSteps(command);

    const updatedBlock = aggregate.getBlock();
    await blockRepository.update(updatedBlock);

    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));
    aggregate.markEventsAsCommitted();

    return Result.success({
      newVersion: updatedBlock.contentVersion,
      updatedAt: updatedBlock.updatedAt,
    });
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'PROPERTY_UPDATE_FAILED',
        `Failed to apply steps: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
