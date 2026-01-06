/**
 * Edge 삭제 서비스 로직
 */
import type { EdgeRepository } from '@/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface';
import type { DeleteEdgeCommand } from '@/domains/canvas-management/shared/commands';
import type { DeleteEdgeRequest } from '@/domains/canvas-management/shared/dtos/requests/edge.requests';
import { EdgeId } from '@/domains/canvas-management/shared/value-objects/edge-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

/**
 * 엣지 삭제
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음
 * - SafeDTO → Command 변환
 * - Aggregate에 Command 전달
 *
 * @param safeDto - 검증된 엣지 삭제 요청 (SafeDTO)
 * @param edgeRepository - Edge Repository
 */
export async function deleteEdge(
  safeDto: DeleteEdgeRequest,
  safeUserId: UserId,
  edgeRepository: EdgeRepository
): Promise<Result<void, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const edgeId = new EdgeId(safeDto.edgeId);

    // 2. 엣지 조회
    const aggregate = await edgeRepository.findById(edgeId);

    if (!aggregate) {
      return Result.error(
        new CanvasManagementError('EDGE_NOT_FOUND', 'Edge not found')
      );
    }

    // 3. SafeDTO → Command 변환
    const command: DeleteEdgeCommand = {
      edgeId,
      userId: safeUserId,
    };

    // 4. Aggregate에 Command 전달 (이벤트 발행)
    aggregate.deleteEdge(command);

    // 5. 도메인 이벤트 처리
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    // 6. Event 커밋
    aggregate.markEventsAsCommitted();

    // 7. Repository 삭제
    await edgeRepository.delete(edgeId);

    // 8. Result.success() 반환
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
