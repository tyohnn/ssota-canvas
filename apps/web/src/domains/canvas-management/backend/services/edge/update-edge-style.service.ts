/**
 * Edge 스타일 업데이트 서비스 로직
 */
import type { EventLogPolicyContext } from '@/domains/event-management';
import type { EdgeRepository } from '@/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface';
import type { EdgeAggregate } from '@/domains/canvas-management/shared/aggregates/edge.aggregate';
import type { UpdateEdgeStyleCommand } from '@/domains/canvas-management/shared/commands';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

/**
 * 엣지 스타일 업데이트
 *
 * ✅ Aggregate 조회·전달 패턴: safeEdgeAggregate만 사용 (서비스 내부 재조회 없음)
 */
export async function updateEdgeStyle(
  safeEdgeAggregate: EdgeAggregate,
  style: { stroke?: string; strokeWidth?: number },
  safeUserId: UserId,
  edgeRepository: EdgeRepository,
  eventLogPolicyContext?: EventLogPolicyContext
): Promise<Result<EdgeAggregate, Error>> {
  try {
    const command: UpdateEdgeStyleCommand = {
      edgeId: safeEdgeAggregate.edge.id,
      style,
      userId: safeUserId,
    };

    safeEdgeAggregate.updateEdgeStyle(command);

    await edgeRepository.update(safeEdgeAggregate);

    const events = safeEdgeAggregate.getUncommittedEvents();
    await Promise.allSettled(
      events.map(event => event.handle(eventLogPolicyContext))
    );

    safeEdgeAggregate.markEventsAsCommitted();

    return Result.success(safeEdgeAggregate);
  } catch (error) {
    console.error('❌ [updateEdgeStyle] Edge style update failed:', error);
    return Result.error(
      new CanvasManagementError(
        'EDGE_STYLE_UPDATE_FAILED',
        `Failed to update edge style: ${error}`
      )
    );
  }
}
