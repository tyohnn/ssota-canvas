/**
 * Block 속성 일괄 업데이트 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { UpdateBlockPropertyCommand } from '../../../../shared/commands';
import type { UpdateBlockPropertiesRequest } from '../../../../shared/dtos/requests/block.requests';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import { BlockId } from '../../../../shared/value-objects/block-id.vo';
import type { IBlockRepository } from '../../../repositories/interfaces/block.repository.interface';

/**
 * 블록 속성 일괄 업데이트
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음
 * - SafeDTO → Command 변환
 * - Aggregate에 여러 Command 전달 (한 번에 처리)
 *
 * @param safeDto - 검증된 블록 속성 일괄 업데이트 요청 (SafeDTO)
 * @param blockRepository - Block Repository
 * @returns 업데이트된 시간 정보
 */
export async function updateBlockProperties(
  safeDto: UpdateBlockPropertiesRequest,
  safeUserId: UserId,
  blockRepository: IBlockRepository
): Promise<Result<{ updatedAt: Date }, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const blockId = new BlockId(safeDto.blockId);

    // 2. 블록 조회 (한 번만)
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

    // 4. 모든 속성을 한 번에 업데이트
    for (const [key, value] of Object.entries(safeDto.properties)) {
      const command: UpdateBlockPropertyCommand = {
        propertyPath: `properties.${key}`,
        value,
        userId: safeUserId,
      };
      aggregate.updateProperty(command);
    }

    // 5. 블록 업데이트 (한 번만)
    const updatedBlock = aggregate.getBlock();
    await blockRepository.update(updatedBlock);

    // 6. 도메인 이벤트 처리
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    // 7. 이벤트 커밋
    aggregate.markEventsAsCommitted();

    // 8. 업데이트된 시간 반환
    return Result.success({ updatedAt: updatedBlock.updatedAt });
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'BLOCK_PROPERTY_UPDATE_FAILED',
        `Failed to update properties: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
