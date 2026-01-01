/**
 * 블럭 위치 업데이트 서비스 로직
 */
import type { BlockMountRepository } from '@/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface';
import { BlockMountAggregate } from '@/domains/canvas-management/shared/aggregates/block-mount.aggregate';
import type { UpdateBlockPositionRequest } from '@/domains/canvas-management/shared/dtos/requests';
import { MultipleBlockPositionsUpdatedEvent } from '@/domains/canvas-management/shared/events';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { Position } from '@/domains/canvas-management/shared/value-objects/position.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError, handleDomainEvents } from './common';

/**
 * 블럭 위치 업데이트 (단일 또는 다중)
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음 (Trust Boundary 통과)
 * - SafeDTO → Command 변환 (Value Objects 생성)
 * - Aggregate에 Command 전달
 * - Domain Event 처리
 *
 * @param safeDto - 검증된 블럭 위치 업데이트 요청 (SafeDTO)
 * @param blockMountRepository - BlockMount Repository
 * @returns 업데이트된 BlockMountAggregate 배열
 */
export async function updateBlockPosition(
  safeDto: UpdateBlockPositionRequest & {
    userId: string;
  },
  blockMountRepository: BlockMountRepository
): Promise<Result<BlockMountAggregate[], Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const userIdVO = new UserId(safeDto.userId);
    const blockPositions = safeDto.blockPositions.map(bp => ({
      blockMountId: new BlockMountId(bp.blockMountId),
      position: new Position(bp.position.x, bp.position.y),
    }));

    // 2. 다중 BlockMount 조회
    const aggregates = await Promise.all(
      blockPositions.map(bp => blockMountRepository.findById(bp.blockMountId))
    );

    // 3. 각 블럭 위치 업데이트
    for (let i = 0; i < aggregates.length; i++) {
      const aggregate = aggregates[i];
      const position = blockPositions[i]!.position;

      if (!aggregate) {
        console.warn(
          `⚠️ [updateBlockPosition] Block mount not found: ${blockPositions[i]!.blockMountId}`
        );
        continue;
      }

      aggregate.updateBlockPosition({ newPosition: position });
    }

    // 4. 배치 저장 (트랜잭션)
    const validAggregates = aggregates.filter(
      (agg): agg is BlockMountAggregate => agg !== null
    );

    await Promise.all(
      validAggregates.map(agg =>
        blockMountRepository.update(agg.getBlockMount())
      )
    );

    // 5. 이벤트 처리
    const individualEvents = validAggregates.flatMap(agg =>
      agg.getUncommittedEvents()
    );

    // 다중 위치 업데이트인 경우 통합 이벤트 추가
    let allEvents = individualEvents;
    if (validAggregates.length > 1) {
      const multiplePositionsEvent = new MultipleBlockPositionsUpdatedEvent(
        'batch-update',
        {
          blockMountIds: validAggregates.map(
            agg => agg.getBlockMount().id.value
          ),
          positions: blockPositions.map(bp => ({
            blockMountId: bp.blockMountId.value,
            position: bp.position,
          })),
          userId: userIdVO.value,
        },
        new Date()
      );
      allEvents = [...individualEvents, multiplePositionsEvent];
    }

    await handleDomainEvents(allEvents);

    // 6. 이벤트 커밋
    validAggregates.forEach(agg => agg.markEventsAsCommitted());

    // 7. Result.success(aggregates) 반환
    return Result.success(validAggregates);
  } catch (error) {
    console.error(
      '❌ [updateBlockPosition] Block position update failed:',
      error
    );
    return Result.error(
      new CanvasManagementError(
        'POSITION_UPDATE_FAILED',
        `Failed to update block position: ${error}`
      )
    );
  }
}
