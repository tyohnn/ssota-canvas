/**
 * Block 콘텐츠 업데이트 서비스 로직
 *
 * 항상 step 저장 경로만 사용: full doc을 ReplaceStep 하나로 변환 후 applyBlockContentSteps 호출.
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Node, Slice } from '@tiptap/pm/model';
import { ReplaceStep } from '@tiptap/pm/transform';
import { Result } from '@/utils/result';

import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import type { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { EMPTY_TIPTAP_DOC } from '../../../../shared/utils/tiptap-markdown.utils';
import { pmSchema } from '../../../../shared/utils/prosemirror-schema';
import type { IBlockRepository } from '../../../repositories/interfaces/block.repository.interface';
import { applyBlockContentSteps } from './apply-block-content-steps.service';

export type UpdateBlockContentParams = {
  content: unknown;
  contentRaw?: string;
  safeWorkspaceId: WorkspaceId;
  safeBlockSlug: string;
  safeUserId: UserId;
  blockRepository: IBlockRepository;
};

/**
 * 블록 콘텐츠 업데이트 (step 경로만 사용)
 *
 * full doc을 전체 교체용 ReplaceStep 하나로 변환한 뒤 applyBlockContentSteps 호출.
 * ✅ 권한 검증은 액션에서 완료. 서비스는 context에서 전달된 safeWorkspaceId 사용.
 */
export async function updateBlockContent(
  params: UpdateBlockContentParams
): Promise<Result<{ updatedAt: Date }, Error>> {
  const {
    content,
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

    const currentContent =
      (block.content as object) || EMPTY_TIPTAP_DOC;
    const currentDoc = Node.fromJSON(pmSchema, currentContent);
    const newDoc = Node.fromJSON(pmSchema, content as object);
    const slice = new Slice(newDoc.content, 0, 0);
    const step = new ReplaceStep(1, currentDoc.content.size, slice);
    const stepJSON = step.toJSON();

    const stepsResult = await applyBlockContentSteps({
      steps: [stepJSON],
      baseVersion: block.contentVersion,
      safeWorkspaceId,
      safeBlockSlug,
      safeUserId,
      blockRepository,
    });

    if (stepsResult.isError()) {
      return Result.error(stepsResult.error);
    }

    return Result.success({ updatedAt: stepsResult.value.updatedAt });
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'PROPERTY_UPDATE_FAILED',
        `Failed to update content: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
