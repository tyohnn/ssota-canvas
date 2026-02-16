/**
 * Block 제목 업데이트 서비스 로직
 */
import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { UpdateBlockTitleCommand } from '../../../../shared/commands';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import type { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import type { IBlockRepository } from '../../../repositories/interfaces/block.repository.interface';

export type UpdateBlockTitleParams = {
  title: string;
  safeWorkspaceId: WorkspaceId;
  safeBlockSlug: string;
  safeUserId: UserId;
  blockRepository: IBlockRepository;
  eventLogPolicyContext?: EventLogPolicyContext;
};

/**
 * 블록 제목 업데이트
 *
 * ✅ 권한 검증은 액션에서 완료. 서비스는 context에서 전달된 safeWorkspaceId 사용.
 */
export async function updateBlockTitle(
  params: UpdateBlockTitleParams
): Promise<Result<BlockAggregate, Error>> {
  const {
    title,
    safeWorkspaceId,
    safeBlockSlug,
    safeUserId,
    blockRepository,
    eventLogPolicyContext,
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

    const aggregate = BlockAggregate.reconstitute(block);

    const command: UpdateBlockTitleCommand = {
      title,
      userId: safeUserId,
    };

    // 5. 블록 제목 업데이트
    aggregate.updateTitle(command);

    // 6. 블록 업데이트
    await blockRepository.update(aggregate.getBlock());

    // 7. 도메인 이벤트 처리 (context 있으면 block_updated 로깅)
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(
      events.map(event => event.handle(eventLogPolicyContext))
    );

    // 8. 이벤트 커밋
    aggregate.markEventsAsCommitted();

    return Result.success(aggregate);
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'BLOCK_UPDATE_FAILED',
        `Failed to update block title: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
