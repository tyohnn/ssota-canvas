/**
 * Block 복원 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { RestoreBlockRequest } from '../../../../shared/dtos/requests/block.requests';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import { BlockId } from '../../../../shared/value-objects/block-id.vo';
import type { IBlockRepository } from '../../../repositories/interfaces/block.repository.interface';

/**
 * 블록 복원
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음
 * - Aggregate에 Command 전달
 *
 * @param safeDto - 검증된 블록 복원 요청 (SafeDTO)
 * @param blockRepository - Block Repository
 * @returns void
 */
export async function restoreBlock(
  safeDto: RestoreBlockRequest,
  safeUserId: UserId,
  blockRepository: IBlockRepository
): Promise<Result<void, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const blockId = new BlockId(safeDto.blockId);

    // 2. 블록 조회 (삭제된 블록도 포함)
    // Note: Block ownership is already verified by authorizeBlockInWorkspace
    // in the action layer. This service should only be called from authorized actions.
    const block = await blockRepository.findById(blockId);
    if (!block) {
      return Result.error(
        new BlockManagementError('BLOCK_NOT_FOUND', 'Block not found')
      );
    }

    // 3. Aggregate 재구성
    const aggregate = BlockAggregate.reconstitute(block);

    // 4. 블록 복원
    aggregate.restore({ userId: safeUserId });

    // 5. 블록 업데이트
    await blockRepository.update(aggregate.getBlock());

    // 6. 도메인 이벤트 처리
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    // 7. 이벤트 커밋
    aggregate.markEventsAsCommitted();

    // 8. 결과 반환
    return Result.success(undefined);
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'BLOCK_RESTORE_FAILED',
        `Failed to restore block: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
