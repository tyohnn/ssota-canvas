/**
 * 연결된 Edge 삭제 서비스 로직
 */
import type { EdgeRepository } from '@/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface';
import type { DeleteEdgeCommand } from '@/domains/canvas-management/shared/commands';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

/**
 * 블럭 마운트 삭제 시 연결된 엣지 모두 삭제
 *
 * ✅ Event Storming + DDD 패턴:
 * - 각 엣지 삭제 시 Command를 통해 처리
 *
 * ⚠️ Schema Change: now uses BlockMountId instead of BlockId
 *
 * @param blockMountId - 블럭 마운트 ID
 * @param edgeRepository - Edge Repository
 * @returns 삭제된 엣지 개수
 */
export async function deleteConnectedEdges(
  blockMountId: BlockMountId,
  safeUserId: UserId,
  edgeRepository: EdgeRepository
): Promise<Result<number, Error>> {
  try {
    // 1. EdgeRepository.findByConnectedBlockMountId() 호출
    const connectedEdges =
      await edgeRepository.findByConnectedBlockMountId(blockMountId);

    if (connectedEdges.length === 0) {
      return Result.success(0);
    }

    // 2. 모든 엣지 삭제: Command 패턴 사용
    for (const aggregate of connectedEdges) {
      // Command 생성
      const command: DeleteEdgeCommand = {
        edgeId: aggregate.edge.id,
        userId: safeUserId,
      };

      // Aggregate에 Command 전달 (이벤트 발행)
      aggregate.deleteEdge(command);

      // 도메인 이벤트 처리
      const events = aggregate.getUncommittedEvents();
      await Promise.allSettled(events.map(event => event.handle()));

      // 이벤트 커밋
      aggregate.markEventsAsCommitted();
    }

    // 3. EdgeRepository.deleteAll() 호출
    const edgeIds = connectedEdges.map(agg => agg.edge.id);
    await edgeRepository.deleteAll(edgeIds);

    // 4. Result.success() 반환 (삭제된 엣지 개수)
    return Result.success(connectedEdges.length);
  } catch (error) {
    console.error(
      '❌ [deleteConnectedEdges] Connected edges deletion failed:',
      error
    );
    return Result.error(
      new CanvasManagementError(
        'CONNECTED_EDGES_DELETION_FAILED',
        `Failed to delete connected edges: ${error}`
      )
    );
  }
}
