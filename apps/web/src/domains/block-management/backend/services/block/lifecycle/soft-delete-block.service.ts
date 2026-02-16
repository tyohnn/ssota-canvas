/**
 * Block 소프트 삭제 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { DeleteBlockCommand } from '../../../../shared/commands';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import type { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import type { IBlockRepository } from '../../../repositories/interfaces/block.repository.interface';

export type SoftDeleteBlockParams = {
  safeWorkspaceId: WorkspaceId;
  safeBlockSlug: string;
  safeUserId: UserId;
  blockRepository: IBlockRepository;
};

/**
 * 블록 소프트 삭제
 *
 * ✅ 권한 검증은 액션에서 완료. 서비스는 context에서 전달된 safeWorkspaceId 사용.
 */
export async function softDeleteBlock(
  params: SoftDeleteBlockParams
): Promise<Result<void, Error>> {
  const { safeWorkspaceId, safeBlockSlug, safeUserId, blockRepository } = params;
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

    // 3. Aggregate 재구성
    const aggregate = BlockAggregate.reconstitute(block);

    // 4. SafeDTO → Command 변환
    const command: DeleteBlockCommand = { userId: safeUserId };

    // 5. 블록 삭제 (Command → Event)
    aggregate.delete(command);

    // 6. 블록 업데이트
    await blockRepository.update(aggregate.getBlock());

    // 7. 도메인 이벤트 처리
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    // 8. 이벤트 커밋
    aggregate.markEventsAsCommitted();

    // 9. 결과 반환
    return Result.success(undefined);
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'BLOCK_DELETE_FAILED',
        `Failed to delete block: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
