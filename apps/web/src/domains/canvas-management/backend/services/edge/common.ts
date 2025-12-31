/**
 * Edge Service 공통 코드
 *
 * 이벤트 핸들러 등 공통 로직을 담당
 */
import {
  EdgeCreatedEvent,
  EdgeDeletedEvent,
  EdgeLabelChangedEvent,
  EdgeShapeChangedEvent,
  EdgeStyleChangedEvent,
} from '@/domains/canvas-management/shared/events';

/**
 * Canvas Edge Management 에러 클래스
 */
export class CanvasManagementError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'CanvasManagementError';
  }
}

/**
 * 이벤트가 Edge Service가 처리할 이벤트인지 확인
 */
export function isEdgeManagementEvent(
  event: any
): event is
  | EdgeCreatedEvent
  | EdgeShapeChangedEvent
  | EdgeLabelChangedEvent
  | EdgeStyleChangedEvent
  | EdgeDeletedEvent {
  return (
    event instanceof EdgeCreatedEvent ||
    event instanceof EdgeShapeChangedEvent ||
    event instanceof EdgeLabelChangedEvent ||
    event instanceof EdgeStyleChangedEvent ||
    event instanceof EdgeDeletedEvent
  );
}

/**
 * 도메인 이벤트 처리 (Canvas Edge Management 도메인 내부) - 비동기 병렬 처리
 *
 * Event Bus 없이 비동기로 처리:
 * 1. Aggregate에서 이벤트 수집
 * 2. Service에서 이벤트 핸들러 병렬 실행
 * 3. Event Storming의 Policy와 1:1 매칭
 *
 * @param events - 처리할 도메인 이벤트 목록
 */
export async function handleDomainEvents(events: Array<any>): Promise<void> {
  // Promise.allSettled를 사용하여 일부 이벤트 실패 시에도 다른 이벤트는 계속 처리
  const results = await Promise.allSettled(
    events
      .filter(event => isEdgeManagementEvent(event))
      .map(async event => {
        // Event Storming과 매칭: Edge Management 도메인 이벤트 처리
        if (event instanceof EdgeCreatedEvent) {
          return await handleEdgeCreated(event);
        } else if (event instanceof EdgeShapeChangedEvent) {
          return await handleEdgeShapeChanged(event);
        } else if (event instanceof EdgeLabelChangedEvent) {
          return await handleEdgeLabelChanged(event);
        } else if (event instanceof EdgeStyleChangedEvent) {
          return await handleEdgeStyleChanged(event);
        } else if (event instanceof EdgeDeletedEvent) {
          return await handleEdgeDeleted(event);
        }
      })
  );

  // 실패한 이벤트 로깅
  const failures = results.filter(
    result => result.status === 'rejected'
  ) as PromiseRejectedResult[];

  if (failures.length > 0) {
    console.warn(
      `[CanvasEdgeService] ${failures.length} event handler(s) failed:`,
      failures.map(f => f.reason)
    );
  }
}

/**
 * Policy: 엣지가 생성되었을 때
 *
 * Event Storming에서 정의한 Policy 구현:
 * - 예: 엣지 생성 로그 기록
 * - 예: 캔버스 통계 업데이트
 * - 예: 생성자별 엣지 수 추적
 */
async function handleEdgeCreated(event: EdgeCreatedEvent): Promise<void> {
  console.log('[Canvas Edge Management] Edge Created:', {
    type: event.type,
    data: event.data,
    occurredAt: event.occurredAt,
  });

  // Policy 구현 예시:
  // - 엣지 생성 통계 업데이트
  // - 생성자별 활동 추적
  // - 페이지별 엣지 수 증가
}

/**
 * Policy: 엣지 모양이 변경되었을 때
 *
 * Event Storming에서 정의한 Policy 구현:
 * - 예: 엣지 변경 로그 기록
 * - 예: 버전 관리
 * - 예: 감사 추적
 */
async function handleEdgeShapeChanged(
  event: EdgeShapeChangedEvent
): Promise<void> {
  console.log('[Canvas Edge Management] Edge Shape Changed:', {
    edgeId: event.aggregateId.value,
    data: event.data,
    occurredAt: event.occurredAt,
  });

  // Policy 구현 예시:
  // - 엣지 변경 이력 기록
  // - 버전 관리 시스템 업데이트
  // - 감사 로그 생성
}

/**
 * Policy: 엣지 레이블이 변경되었을 때
 *
 * Event Storming에서 정의한 Policy 구현:
 * - 예: 엣지 레이블 변경 로그 기록
 */
async function handleEdgeLabelChanged(
  event: EdgeLabelChangedEvent
): Promise<void> {
  console.log('[Canvas Edge Management] Edge Label Changed:', {
    edgeId: event.aggregateId.value,
    data: event.data,
    occurredAt: event.occurredAt,
  });

  // Policy 구현 예시:
  // - 엣지 레이블 변경 이력 기록
}

/**
 * Policy: 엣지 스타일이 변경되었을 때
 *
 * Event Storming에서 정의한 Policy 구현:
 * - 예: 엣지 스타일 변경 로그 기록
 */
async function handleEdgeStyleChanged(
  event: EdgeStyleChangedEvent
): Promise<void> {
  console.log('[Canvas Edge Management] Edge Style Changed:', {
    edgeId: event.aggregateId.value,
    data: event.data,
    occurredAt: event.occurredAt,
  });

  // Policy 구현 예시:
  // - 엣지 스타일 변경 이력 기록
}

/**
 * Policy: 엣지가 삭제되었을 때
 *
 * Event Storming에서 정의한 Policy 구현:
 * - 예: 엣지 삭제 로그 기록
 * - 예: 관련 데이터 정리
 */
async function handleEdgeDeleted(event: EdgeDeletedEvent): Promise<void> {
  console.log('[Canvas Edge Management] Edge Deleted:', {
    edgeId: event.aggregateId.value,
    data: event.data,
    occurredAt: event.occurredAt,
  });

  // Policy 구현 예시:
  // - 엣지 삭제 이력 기록
  // - 관련 데이터 정리
}
