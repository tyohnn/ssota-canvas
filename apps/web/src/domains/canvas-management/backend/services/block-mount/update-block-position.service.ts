/**
 * 블럭 위치 업데이트 서비스 로직
 */
import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import type { UpdateBlockPositionRequest } from '../../../shared/dtos/requests';
import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';
import { MultipleBlockPositionsUpdatedEvent } from '../../../shared/events';
import { Position } from '../../../shared/value-objects/position.vo';
import type { BlockMountRepository } from '../../repositories/interfaces/block-mount.repository.interface';

export type UpdateBlockPositionParams = {
  safeDto: UpdateBlockPositionRequest;
  safeUserId: UserId;
  /** Secure action에서 이미 조회한 aggregates (request blockPositions 순서와 동일, 재조회 방지) */
  safeBlockMountAggregates: BlockMountAggregate[];
  blockMountRepository: BlockMountRepository;
  eventLogPolicyContext?: EventLogPolicyContext;
};

/**
 * 블럭 위치 업데이트 (단일 또는 다중)
 *
 * @param params - safeDto, safeUserId, safeBlockMountAggregates, blockMountRepository, eventLogPolicyContext
 * @returns 업데이트된 BlockMountAggregate 배열
 */
export async function updateBlockPosition(
  params: UpdateBlockPositionParams
): Promise<Result<BlockMountAggregate[], Error>> {
  const {
    safeDto,
    safeUserId,
    safeBlockMountAggregates: validAggregates,
    blockMountRepository,
    eventLogPolicyContext,
  } = params;

  try {
    const blockPositions = safeDto.blockPositions.map(bp => ({
      blockMountSlug: bp.blockMountId,
      position: new Position(bp.position.x, bp.position.y),
    }));

    // 각 블럭 위치 업데이트 (aggregates는 request 순서와 동일)
    for (let i = 0; i < validAggregates.length; i++) {
      const aggregate = validAggregates[i]!;
      const position = blockPositions[i]!.position;
      aggregate.updateBlockPosition({ newPosition: position });
    }

    // 배치 저장 (트랜잭션)

    await Promise.all(
      validAggregates.map(agg =>
        blockMountRepository.update(agg.getBlockMount())
      )
    );

    // 5. 이벤트 처리
    const individualEvents = validAggregates.flatMap(agg =>
      agg.getUncommittedEvents()
    );

    let allEvents = individualEvents;
    if (validAggregates.length > 1) {
      const multiplePositionsEvent = new MultipleBlockPositionsUpdatedEvent(
        'batch-update',
        {
          blockMountIds: validAggregates.map(
            agg => agg.getBlockMount().id.value
          ),
          positions: blockPositions.map(bp => ({
            blockMountId: bp.blockMountSlug,
            position: bp.position,
          })),
          userId: safeUserId,
        },
        new Date()
      );
      allEvents = [...individualEvents, multiplePositionsEvent];
    }

    await Promise.allSettled(
      allEvents.map(event => event.handle(eventLogPolicyContext))
    );

    // 6. 이벤트 커밋
    validAggregates.forEach(agg => agg.markEventsAsCommitted());

    // 7. Result.success(aggregates) 반환
    return Result.success(validAggregates);
  } catch (error) {
    return Result.error(
      new CanvasManagementError(
        'POSITION_UPDATE_FAILED',
        `Failed to update block position: ${error}`
      )
    );
  }
}
