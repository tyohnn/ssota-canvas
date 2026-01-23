/**
 * Block 속성 업데이트 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { UpdateBlockPropertyCommand } from '../../../../shared/commands';
import type { UpdateBlockPropertyRequest } from '../../../../shared/dtos/requests/block.requests';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import { BlockId } from '../../../../shared/value-objects/block-id.vo';
import type { IBlockRepository } from '../../../repositories/interfaces/block.repository.interface';

/**
 * 블록 속성 업데이트
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음
 * - SafeDTO → Command 변환
 * - Aggregate에 Command 전달
 *
 * @param safeDto - 검증된 블록 속성 업데이트 요청 (SafeDTO)
 * @param blockRepository - Block Repository
 * @returns 업데이트된 시간 정보
 */
export async function updateBlockProperty(
  safeDto: UpdateBlockPropertyRequest,
  safeUserId: UserId,
  blockRepository: IBlockRepository
): Promise<Result<{ updatedAt: Date }, Error>> {
  try {
    // 1. 속성 경로 검증
    if (!safeDto.propertyPath || safeDto.propertyPath.trim() === '') {
      return Result.error(
        new BlockManagementError(
          'INVALID_PROPERTY_PATH',
          'Property path is required'
        )
      );
    }

    // 2. SafeDTO → Value Objects 생성
    const blockId = new BlockId(safeDto.blockId);

    // 3. 블록 조회
    // Note: Block ownership is already verified by authorizeBlockInWorkspace
    // in the action layer. This service should only be called from authorized actions.
    const block = await blockRepository.findById(blockId);
    if (!block) {
      return Result.error(
        new BlockManagementError('BLOCK_NOT_FOUND', 'Block not found')
      );
    }

    // 4. Aggregate 재구성
    const aggregate = BlockAggregate.reconstitute(block);

    // 5. SafeDTO → Command 변환
    const command: UpdateBlockPropertyCommand = {
      propertyPath: safeDto.propertyPath,
      value: safeDto.value,
      userId: safeUserId,
    };

    // 6. 블록 속성 업데이트
    aggregate.updateProperty(command);

    // 7. 블록 업데이트
    const updatedBlock = aggregate.getBlock();
    await blockRepository.update(updatedBlock);

    // 8. 도메인 이벤트 처리
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    // 9. 이벤트 커밋
    aggregate.markEventsAsCommitted();

    // 10. 업데이트된 시간 반환
    return Result.success({ updatedAt: updatedBlock.updatedAt });
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'BLOCK_PROPERTY_UPDATE_FAILED',
        `Failed to update property: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
