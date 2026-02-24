/**
 * Edge 삭제 서비스 로직
 */
import type { EventLogPolicyContext } from '@/domains/event-management';
import type { EdgeRepository } from '@/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface';
import type { DeleteEdgeCommand } from '@/domains/canvas-management/shared/commands';
import type { EdgeAggregate } from '@/domains/canvas-management/shared/aggregates/edge.aggregate';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

/**
 * 엣지 삭제
 *
 * ✅ Aggregate 조회·전달 패턴: secure action에서 조회한 safeEdgeAggregate만 사용 (서비스 내부 재조회 없음)
 *
 * @param safeEdgeAggregate - 권한 검증 후 전달된 엣지 aggregate
 * @param edgeRepository - Edge Repository
 * @param eventLogPolicyContext - 선택: 감사 로그용 event_log 기록 시 사용
 */
export async function deleteEdge(
  safeEdgeAggregate: EdgeAggregate,
  safeUserId: UserId,
  edgeRepository: EdgeRepository,
  eventLogPolicyContext?: EventLogPolicyContext
): Promise<Result<void, Error>> {
  try {
    const command: DeleteEdgeCommand = {
      edgeId: safeEdgeAggregate.edge.id,
      userId: safeUserId,
    };

    safeEdgeAggregate.deleteEdge(command);

    const events = safeEdgeAggregate.getUncommittedEvents();
    await Promise.allSettled(
      events.map(event => event.handle(eventLogPolicyContext))
    );

    safeEdgeAggregate.markEventsAsCommitted();

    await edgeRepository.delete(safeEdgeAggregate.edge.id);

    return Result.success(undefined);
  } catch (error) {
    console.error('❌ [deleteEdge] Edge deletion failed:', error);
    return Result.error(
      new CanvasManagementError(
        'EDGE_DELETION_FAILED',
        `Failed to delete edge: ${error}`
      )
    );
  }
}
