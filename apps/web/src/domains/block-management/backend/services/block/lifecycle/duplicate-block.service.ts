/**
 * Block 복제 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { DuplicateBlockCommand } from '../../../../shared/commands';
import type { DuplicateBlockRequest } from '../../../../shared/dtos/requests/block.requests';
import type { Block } from '../../../../shared/entities/block.entity';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import { BlockId } from '../../../../shared/value-objects/block-id.vo';
import type { BlockRepository } from '../../../repositories/interfaces/block.repository.interface';

/**
 * 블록 복제
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음
 * - SafeDTO → Command 변환
 * - Aggregate에 Command 전달
 *
 * @param safeDto - 검증된 블록 복제 요청 (SafeDTO)
 * @param safeUserId - 검증된 사용자 ID (인증된 사용자)
 * @param blockRepository - Block Repository
 * @returns 복제된 블록 Entity
 */
export async function duplicateBlock(
  safeDto: DuplicateBlockRequest,
  safeUserId: UserId,
  blockRepository: BlockRepository
): Promise<Result<Block, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const originalBlockId = new BlockId(safeDto.blockId);

    // 2. 원본 블록 조회
    // Note: Block ownership is already verified by authorizeBlockInWorkspace
    // in the action layer. This service should only be called from authorized actions.
    const originalBlock = await blockRepository.findById(originalBlockId);
    if (!originalBlock) {
      return Result.error(
        new BlockManagementError('BLOCK_NOT_FOUND', 'Block not found')
      );
    }

    // 3. Aggregate 재구성
    const originalBlockAggregate = BlockAggregate.reconstitute(originalBlock);

    // 4. SafeDTO → Command 변환
    const command: DuplicateBlockCommand = {
      userId: safeUserId,
    };

    // 5. 블록 복제 (Command → Event)
    const duplicatedBlockAggregate = originalBlockAggregate.duplicate(command);
    const duplicatedBlock = duplicatedBlockAggregate.getBlock();

    // 6. 블록 생성
    await blockRepository.create(duplicatedBlock);

    // 7. 도메인 이벤트 처리
    const events = duplicatedBlockAggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    // 8. 이벤트 커밋
    duplicatedBlockAggregate.markEventsAsCommitted();

    // 9. 결과 반환
    return Result.success(duplicatedBlock);
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'BLOCK_DUPLICATION_FAILED',
        `Failed to duplicate block: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
