/**
 * Edge 연결 정보 업데이트 서비스 로직
 */
import type { EdgeRepository } from '@/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface';
import { EdgeAggregate } from '@/domains/canvas-management/shared/aggregates/edge.aggregate';
import type { UpdateEdgeConnectionCommand } from '@/domains/canvas-management/shared/commands';
import type { UpdateEdgeConnectionRequest } from '@/domains/canvas-management/shared/dtos/requests/edge.requests';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { EdgeHandle } from '@/domains/canvas-management/shared/value-objects/edge-handle.vo';
import { EdgeId } from '@/domains/canvas-management/shared/value-objects/edge-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

/**
 * 엣지 연결 정보 업데이트
 *
 * ✅ Event Storming + DDD 패턴 적용
 * 
 * @param safeDto - 검증된 업데이트 요청 (SafeDTO)
 * @param safeUserId - 검증된 사용자 ID
 * @param edgeRepository - Edge Repository
 * @returns 업데이트된 엣지 Aggregate
 */
export async function updateEdgeConnection(
  safeDto: UpdateEdgeConnectionRequest,
  safeUserId: UserId,
  edgeRepository: EdgeRepository
): Promise<Result<EdgeAggregate, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const edgeId = new EdgeId(safeDto.edgeId);
    
    // 2. 엣지 조회
    const aggregate = await edgeRepository.findById(edgeId);

    if (!aggregate) {
      return Result.error(
        new CanvasManagementError('EDGE_NOT_FOUND', 'Edge not found', {
          edgeId: safeDto.edgeId,
        })
      );
    }

    // 3. SafeDTO → Command 변환
    const command: UpdateEdgeConnectionCommand = {
      edgeId,
      newSourceBlockMountId: new BlockMountId(safeDto.newSourceBlockMountId),
      newTargetBlockMountId: new BlockMountId(safeDto.newTargetBlockMountId),
      newSourceHandle: safeDto.newSourceHandle 
        ? EdgeHandle.fromString(safeDto.newSourceHandle) 
        : aggregate.edge.sourceHandle,
      newTargetHandle: safeDto.newTargetHandle 
        ? EdgeHandle.fromString(safeDto.newTargetHandle) 
        : aggregate.edge.targetHandle,
      userId: safeUserId,
    };

    // 4. Aggregate에 Command 전달 (도메인 로직 실행)
    aggregate.updateEdgeConnection(command);

    // 5. Repository에 저장 (변경사항 커밋)
    await edgeRepository.update(aggregate);

    // 6. 도메인 이벤트 처리
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map((event: any) => event.handle()));

    // 7. Event 커밋 완료 마킹
    aggregate.markEventsAsCommitted();

    // 8. Result.success(aggregate) 반환
    return Result.success(aggregate);
  } catch (error) {
    console.error('❌ [updateEdgeConnection] Edge update failed:', error);
    return Result.error(
      new CanvasManagementError(
        'EDGE_CONNECTION_FAILED',
        `Failed to update edge connection: ${error}`
      )
    );
  }
}
