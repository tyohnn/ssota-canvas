/**
 * Block 콘텐츠 Step 적용 서비스 (ProseMirror steps)
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Node } from '@tiptap/pm/model';
import { Step } from '@tiptap/pm/transform';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { ApplyContentStepsCommand } from '../../../../shared/commands';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import type { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import {
  EMPTY_TIPTAP_DOC,
  extractPlainText,
} from '../../../../shared/utils/tiptap-markdown.utils';
import { pmSchema } from '../../../../shared/utils/prosemirror-schema';
import type { IBlockRepository } from '../../../repositories/interfaces/block.repository.interface';

export type ApplyBlockContentStepsParams = {
  steps: unknown[];
  baseVersion: number;
  safeWorkspaceId: WorkspaceId;
  safeBlockSlug: string;
  safeUserId: UserId;
  blockRepository: IBlockRepository;
};

/**
 * 블록 콘텐츠에 ProseMirror steps 적용
 *
 * ✅ 권한 검증은 액션에서 완료. 서비스는 context에서 전달된 safeWorkspaceId 사용.
 */
export async function applyBlockContentSteps(
  params: ApplyBlockContentStepsParams
): Promise<
  Result<
    { newVersion: number; updatedAt: Date },
    BlockManagementError | Error
  >
> {
  const {
    steps,
    baseVersion,
    safeWorkspaceId,
    safeBlockSlug,
    safeUserId,
    blockRepository,
  } = params;
  try {
    const block = await blockRepository.findByWorkspaceIdAndSlug(
      safeWorkspaceId,
      safeBlockSlug
    );
    if (!block) {
      return Result.error(
        new BlockManagementError('BLOCK_NOT_FOUND', 'Block not found')
      );
    }

    if (baseVersion !== block.contentVersion) {
      return Result.error(
        new BlockManagementError('CONTENT_VERSION_MISMATCH', 'Content version mismatch', {
          serverVersion: block.contentVersion,
          serverContent: block.content,
          clientVersion: baseVersion,
        })
      );
    }

    const currentContent =
      (block.content as object) || EMPTY_TIPTAP_DOC;
    let doc = Node.fromJSON(pmSchema, currentContent);

    for (const stepJSON of steps) {
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
      steps,
      baseVersion,
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
