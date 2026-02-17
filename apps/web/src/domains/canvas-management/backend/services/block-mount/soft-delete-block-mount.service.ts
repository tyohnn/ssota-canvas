/**
 * 블럭 마운트 삭제 서비스 로직
 */
import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import {
  SoftDeleteBlockMountCommand,
  type DeleteEdgeCommand,
} from '../../../shared/commands';
import type { SoftDeleteBlockMountRequest } from '../../../shared/dtos/requests';
import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';
import { MultipleBlockMountsDeletedEvent } from '../../../shared/events';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import type { BlockMountRepository } from '../../repositories/interfaces/block-mount.repository.interface';
import type { EdgeRepository } from '../../repositories/interfaces/edge.repository.interface';

export type SoftDeleteBlockMountParams = {
  safeDto: SoftDeleteBlockMountRequest;
  safeUserId: UserId;
  /** Secure action에서 이미 조회한 aggregates (request blockMountIds 순서와 동일, 재조회 방지) */
  safeBlockMountAggregates: BlockMountAggregate[];
  blockMountRepository: BlockMountRepository;
  edgeRepository: EdgeRepository;
  eventLogPolicyContext?: EventLogPolicyContext;
};

/**
 * 블럭 마운트 삭제 (단일 또는 다중, 연결된 엣지 자동 정리)
 *
 * @param params - safeDto, safeUserId, safeBlockMountAggregates, blockMountRepository, edgeRepository, eventLogPolicyContext
 * @returns 삭제 결과
 */
export async function softDeleteBlockMount(
  params: SoftDeleteBlockMountParams
): Promise<
  Result<
    {
      deletedCount: number;
      deletedEdgesCount: number;
      deletedBlockMountIds: BlockMountId[];
    },
    Error
  >
> {
  const {
    safeDto,
    safeUserId,
    safeBlockMountAggregates: validAggregates,
    blockMountRepository,
    edgeRepository,
    eventLogPolicyContext,
  } = params;

  try {
    if (validAggregates.length === 0) {
      return Result.error(
        new CanvasManagementError(
          'BLOCK_MOUNT_NOT_FOUND',
          'No valid block mounts found'
        )
      );
    }

    const blockMountIds = validAggregates.map(agg => agg.getBlockMount().id);

    // 4. 삭제하는 block mounts 들에 연결된 모든 엣지 한 번에 조회 (bulk)
    const connectedEdges =
      await edgeRepository.findByConnectedBlockMountIds(blockMountIds);

    // 5. 엣지 aggregate별 deleteEdge command (이벤트는 아직 처리하지 않음)
    for (const edgeAggregate of connectedEdges) {
      const command: DeleteEdgeCommand = {
        edgeId: edgeAggregate.edge.id,
        userId: safeUserId,
      };
      edgeAggregate.deleteEdge(command);
    }

    // 6. 엣지 한 번에 삭제 (bulk) — DB 반영 먼저
    if (connectedEdges.length > 0) {
      const edgeIds = connectedEdges.map(agg => agg.edge.id);
      await edgeRepository.deleteAll(edgeIds);
    }

    // 7. 엣지 삭제 반영 후 도메인 이벤트 처리
    for (const edgeAggregate of connectedEdges) {
      const events = edgeAggregate.getUncommittedEvents();
      await Promise.allSettled(events.map(event => event.handle()));
      edgeAggregate.markEventsAsCommitted();
    }

    // 8. BlockMount aggregate별 deleteBlockMount (이벤트 발행용, 아직 처리하지 않음)
    for (const aggregate of validAggregates) {
      const blockMount = aggregate.getBlockMount();
      const deleteBlockMountCommand: SoftDeleteBlockMountCommand = {
        blockMountId: blockMount.id,
        userId: safeUserId,
      };
      aggregate.deleteBlockMount(deleteBlockMountCommand);
    }

    // 9. 블럭 마운트 한 번에 삭제 (bulk) — DB 반영 먼저
    await blockMountRepository.softDeleteMany(blockMountIds);

    // 10. 블럭 삭제 반영 후 도메인 이벤트 처리
    const individualEvents = validAggregates.flatMap(agg =>
      agg.getUncommittedEvents()
    );
    const isBatch = validAggregates.length > 1;
    if (isBatch) {
      // 배치: 개별 이벤트는 감사 로그 스킵, MultipleBlockMountsDeletedEvent만 한 건으로 로깅
      await Promise.allSettled(individualEvents.map((e) => e.handle(undefined)));
      const multipleDeletionsEvent = new MultipleBlockMountsDeletedEvent(
        'batch-delete',
        {
          deletedBlockMountIds: validAggregates.map(
            (agg) => agg.getBlockMount().id.value
          ),
          deletedEdgesCount: connectedEdges.length,
          deletedAt: new Date(),
          userId: safeUserId.value,
        },
        new Date()
      );
      await Promise.allSettled([
        multipleDeletionsEvent.handle(eventLogPolicyContext),
      ]);
    } else {
      // 단일: BlockMountDeletedEvent가 logBlockMountSoftDeleted(blockMountId) 호출
      await Promise.allSettled(
        individualEvents.map((e) => e.handle(eventLogPolicyContext))
      );
    }

    // 11. 이벤트 커밋
    validAggregates.forEach(agg => agg.markEventsAsCommitted());

    return Result.success({
      deletedCount: validAggregates.length,
      deletedEdgesCount: connectedEdges.length,
      deletedBlockMountIds: blockMountIds,
    });
  } catch (error) {
    console.error(
      '❌ [softDeleteBlockMount] Block mount deletion failed:',
      error
    );
    return Result.error(
      new CanvasManagementError(
        'BLOCK_MOUNT_DELETION_FAILED',
        `Failed to delete block mount: ${error}`
      )
    );
  }
}
