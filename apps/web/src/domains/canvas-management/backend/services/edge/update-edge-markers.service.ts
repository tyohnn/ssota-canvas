/**
 * Edge 마커(화살표) 업데이트 서비스 로직
 * - marker: 'start' | 'end' 중 변경할 쪽
 * - value: MarkerType (none | arrow | arrow-open | circle | circle-open | diamond | diamond-open)
 */
import type { EventLogPolicyContext } from '@/domains/event-management';
import type { EdgeRepository } from '@/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface';
import type { EdgeAggregate } from '@/domains/canvas-management/shared/aggregates/edge.aggregate';
import type { UpdateEdgeMarkerCommand } from '@/domains/canvas-management/shared/commands';
import type { MarkerType } from '@/domains/canvas-management/shared/types/marker-type';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

/**
 * 엣지 마커(화살표) 업데이트 — start/end 중 하나만 변경
 *
 * ✅ Aggregate 조회·전달 패턴: safeEdgeAggregate만 사용 (서비스 내부 재조회 없음)
 */
export async function updateEdgeMarker(
  safeEdgeAggregate: EdgeAggregate,
  marker: 'start' | 'end',
  value: MarkerType,
  safeUserId: UserId,
  edgeRepository: EdgeRepository,
  eventLogPolicyContext?: EventLogPolicyContext
): Promise<Result<EdgeAggregate, Error>> {
  try {
    const command: UpdateEdgeMarkerCommand = {
      edgeId: safeEdgeAggregate.edge.id,
      marker,
      value,
      userId: safeUserId,
    };

    safeEdgeAggregate.updateEdgeMarker(command);

    await edgeRepository.update(safeEdgeAggregate);

    const events = safeEdgeAggregate.getUncommittedEvents();
    await Promise.allSettled(
      events.map(event => event.handle(eventLogPolicyContext))
    );

    safeEdgeAggregate.markEventsAsCommitted();

    return Result.success(safeEdgeAggregate);
  } catch (error) {
    console.error('❌ [updateEdgeMarker] Edge marker update failed:', error);
    return Result.error(
      new CanvasManagementError(
        'EDGE_MARKERS_UPDATE_FAILED',
        `Failed to update edge marker: ${error}`
      )
    );
  }
}
