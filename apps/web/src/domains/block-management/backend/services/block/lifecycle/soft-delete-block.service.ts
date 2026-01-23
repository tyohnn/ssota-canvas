/**
 * Block 소프트 삭제 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { DeleteBlockCommand } from '../../../../shared/commands';
import type { SoftDeleteBlockRequest } from '../../../../shared/dtos/requests/block.requests';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import { BlockId } from '../../../../shared/value-objects/block-id.vo';
import type { IBlockRepository } from '../../../repositories/interfaces/block.repository.interface';

/**
 * 블록 소프트 삭제
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음
 * - SafeDTO → Command 변환
 * - Aggregate에 Command 전달
 *
 * @param safeDto - 검증된 블록 소프트 삭제 요청 (SafeDTO)
 * @param blockRepository - Block Repository
 * @returns void
 */
export async function softDeleteBlock(
  safeDto: SoftDeleteBlockRequest,
  safeUserId: UserId,
  blockRepository: IBlockRepository
): Promise<Result<void, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const blockId = new BlockId(safeDto.blockId);

    // 2. 블록 조회
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

    // 4. SafeDTO → Command 변환
    const command: DeleteBlockCommand = {
      userId: safeUserId,
    };

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
