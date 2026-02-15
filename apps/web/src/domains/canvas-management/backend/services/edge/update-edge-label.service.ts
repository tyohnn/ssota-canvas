/**
 * Edge 레이블 업데이트 서비스 로직
 */
import type { EventLogPolicyContext } from '@/domains/event-management';
import type { EdgeRepository } from '@/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface';
import { EdgeAggregate } from '@/domains/canvas-management/shared/aggregates/edge.aggregate';
import type { UpdateEdgeLabelCommand } from '@/domains/canvas-management/shared/commands';
import type { UpdateEdgeLabelRequest } from '@/domains/canvas-management/shared/dtos/requests/edge.requests';
import { EdgeId } from '@/domains/canvas-management/shared/value-objects/edge-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

/**
 * 엣지 레이블 업데이트
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음
 * - SafeDTO → Command 변환
 * - Aggregate에 Command 전달
 *
 * @param safeDto - 검증된 엣지 레이블 업데이트 요청 (SafeDTO)
 * @param edgeRepository - Edge Repository
 * @param eventLogPolicyContext - 선택: 감사 로그용 event_log 기록 시 사용
 * @returns 업데이트된 엣지 Aggregate
 */
export async function updateEdgeLabel(
  safeDto: UpdateEdgeLabelRequest,
  safeUserId: UserId,
  edgeRepository: EdgeRepository,
  eventLogPolicyContext?: EventLogPolicyContext
): Promise<Result<EdgeAggregate, Error>> {
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
    const command: UpdateEdgeLabelCommand = {
      edgeId,
      newLabel: safeDto.newLabel,
      userId: safeUserId,
    };

    // 4. Aggregate에 Command 전달 (Command → Event)
    aggregate.updateEdgeLabel(command);

    // 5. Repository 업데이트
    await edgeRepository.update(aggregate);

    // 6. 도메인 이벤트 처리
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(
      events.map(event => event.handle(eventLogPolicyContext))
    );

    // 7. Event 커밋
    aggregate.markEventsAsCommitted();

    // 8. Result.success(aggregate) 반환
    return Result.success(aggregate);
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
