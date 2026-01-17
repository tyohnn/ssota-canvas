/**
 * Block 제목 업데이트 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { UpdateBlockTitleCommand } from '../../../../shared/commands';
import type { UpdateBlockTitleRequest } from '../../../../shared/dtos/requests/block.requests';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import { BlockId } from '../../../../shared/value-objects/block-id.vo';
import type { BlockRepository } from '../../../repositories/interfaces/block.repository.interface';

/**
 * 블록 제목 업데이트
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음
 * - SafeDTO → Command 변환
 * - Aggregate에 Command 전달
 *
 * @param safeDto - 검증된 블록 제목 업데이트 요청 (SafeDTO)
 * @param blockRepository - Block Repository
 * @returns 업데이트된 블록 Aggregate
 */
export async function updateBlockTitle(
  safeDto: UpdateBlockTitleRequest,
  safeUserId: UserId,
  blockRepository: BlockRepository
): Promise<Result<BlockAggregate, Error>> {
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
    const command: UpdateBlockTitleCommand = {
      title: safeDto.title,
      userId: safeUserId,
    };

    // 5. 블록 제목 업데이트
    aggregate.updateTitle(command);

    // 6. 블록 업데이트
    await blockRepository.update(aggregate.getBlock());

    // 7. 도메인 이벤트 처리
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

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
