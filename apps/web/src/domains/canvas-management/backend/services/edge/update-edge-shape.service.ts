/**
 * Edge 모양 업데이트 서비스 로직
 */
import type { EdgeRepository } from '@/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface';
import type { EdgeAggregate } from '@/domains/canvas-management/shared/aggregates/edge.aggregate';
import type { UpdateEdgeShapeCommand } from '@/domains/canvas-management/shared/commands';
import { EdgeShape } from '@/domains/canvas-management/shared/value-objects/edge-shape.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

/**
 * 엣지 모양 업데이트
 *
 * ✅ Aggregate 조회·전달 패턴: safeEdgeAggregate만 사용 (서비스 내부 재조회 없음)
 */
export async function updateEdgeShape(
  safeEdgeAggregate: EdgeAggregate,
  newShapeValue: string,
  safeUserId: UserId,
  edgeRepository: EdgeRepository
): Promise<Result<EdgeAggregate, Error>> {
  try {
    const newShape = new EdgeShape(newShapeValue);
    const command: UpdateEdgeShapeCommand = {
      edgeId: safeEdgeAggregate.edge.id,
      newShape,
      userId: safeUserId,
    };

    safeEdgeAggregate.updateEdgeShape(command);

    await edgeRepository.update(safeEdgeAggregate);

    const events = safeEdgeAggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    safeEdgeAggregate.markEventsAsCommitted();

    return Result.success(safeEdgeAggregate);
  } catch (error) {
    console.error('❌ [updateEdgeShape] Edge shape update failed:', error);
    return Result.error(
      new CanvasManagementError(
        'EDGE_SHAPE_UPDATE_FAILED',
        `Failed to update edge shape: ${error}`
      )
    );
  }
}
