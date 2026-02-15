/**
 * Edge 마커(화살표) 업데이트 서비스 로직
 * - marker: 'start' | 'end' 중 변경할 쪽
 * - value: MarkerType (none | arrow | arrow-open | circle | circle-open | diamond | diamond-open)
 */
import type { EventLogPolicyContext } from '@/domains/event-management';
import type { EdgeRepository } from '@/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface';
import { EdgeAggregate } from '@/domains/canvas-management/shared/aggregates/edge.aggregate';
import type { UpdateEdgeMarkerCommand } from '@/domains/canvas-management/shared/commands';
import type { UpdateEdgeMarkerRequest } from '@/domains/canvas-management/shared/dtos/requests/edge.requests';
import { EdgeId } from '@/domains/canvas-management/shared/value-objects/edge-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

/**
 * 엣지 마커(화살표) 업데이트 — start/end 중 하나만 변경
 *
 * @param safeDto - { edgeId, marker: 'start'|'end', value: MarkerType }
 * @param safeUserId - 인증된 사용자 ID
 * @param edgeRepository - Edge Repository
 * @param eventLogPolicyContext - 선택: 감사 로그용 event_log 기록 시 사용
 */
export async function updateEdgeMarker(
  safeDto: UpdateEdgeMarkerRequest,
  safeUserId: UserId,
  edgeRepository: EdgeRepository,
  eventLogPolicyContext?: EventLogPolicyContext
): Promise<Result<EdgeAggregate, Error>> {
  try {
    const edgeId = new EdgeId(safeDto.edgeId);

    const aggregate = await edgeRepository.findById(edgeId);

    if (!aggregate) {
      return Result.error(
        new CanvasManagementError('EDGE_NOT_FOUND', 'Edge not found')
      );
    }

    const command: UpdateEdgeMarkerCommand = {
      edgeId,
      marker: safeDto.marker,
      value: safeDto.value,
      userId: safeUserId,
    };

    aggregate.updateEdgeMarker(command);

    await edgeRepository.update(aggregate);

    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(
      events.map(event => event.handle(eventLogPolicyContext))
    );

    aggregate.markEventsAsCommitted();

    return Result.success(aggregate);
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
