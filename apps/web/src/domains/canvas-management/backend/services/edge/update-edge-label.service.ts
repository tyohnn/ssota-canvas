/**
 * Edge 레이블 업데이트 서비스 로직
 */
import type { EventLogPolicyContext } from '@/domains/event-management';
import type { EdgeRepository } from '@/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface';
import type { EdgeAggregate } from '@/domains/canvas-management/shared/aggregates/edge.aggregate';
import type { UpdateEdgeLabelCommand } from '@/domains/canvas-management/shared/commands';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

/**
 * 엣지 레이블 업데이트
 *
 * ✅ Aggregate 조회·전달 패턴: safeEdgeAggregate만 사용 (서비스 내부 재조회 없음)
 */
export async function updateEdgeLabel(
  safeEdgeAggregate: EdgeAggregate,
  newLabel: string,
  safeUserId: UserId,
  edgeRepository: EdgeRepository,
  eventLogPolicyContext?: EventLogPolicyContext
): Promise<Result<EdgeAggregate, Error>> {
  try {
    const command: UpdateEdgeLabelCommand = {
      edgeId: safeEdgeAggregate.edge.id,
      newLabel,
      userId: safeUserId,
    };

    safeEdgeAggregate.updateEdgeLabel(command);

    await edgeRepository.update(safeEdgeAggregate);

    const events = safeEdgeAggregate.getUncommittedEvents();
    await Promise.allSettled(
      events.map(event => event.handle(eventLogPolicyContext))
    );

    safeEdgeAggregate.markEventsAsCommitted();

    return Result.success(safeEdgeAggregate);
  } catch (error) {
    console.error('❌ [updateEdgeLabel] Edge label update failed:', error);
    return Result.error(
      new CanvasManagementError(
        'EDGE_LABEL_UPDATE_FAILED',
        `Failed to update edge label: ${error}`
      )
    );
  }
}
