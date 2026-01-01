/**
 * BlockMount Service 공통 코드
 *
 * 이벤트 핸들러 등 공통 로직을 담당
 */
import {
  BlockMountDeletedEvent,
  BlockMountDuplicatedEvent,
  BlockMountedEvent,
  BlockMovedToPageEvent,
  BlockPositionUpdatedEvent,
  BlockSizeUpdatedEvent,
  DomainEvent,
  MultipleBlockMountsDeletedEvent,
  MultipleBlockPositionsUpdatedEvent,
} from '@/domains/canvas-management/shared/events';

/**
 * Canvas BlockMount Management 에러 클래스
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
 * 이벤트가 BlockMount Service가 처리할 이벤트인지 확인
 */
export function isBlockMountManagementEvent(
  event: any
): event is
  | BlockMountedEvent
  | BlockPositionUpdatedEvent
  | BlockSizeUpdatedEvent
  | MultipleBlockPositionsUpdatedEvent
  | MultipleBlockMountsDeletedEvent
  | BlockMountDeletedEvent
  | BlockMountDuplicatedEvent
  | BlockMovedToPageEvent {
  return (
    event instanceof BlockMountedEvent ||
    event instanceof BlockPositionUpdatedEvent ||
    event instanceof BlockSizeUpdatedEvent ||
    event instanceof MultipleBlockPositionsUpdatedEvent ||
    event instanceof MultipleBlockMountsDeletedEvent ||
    event instanceof BlockMountDeletedEvent ||
    event instanceof BlockMountDuplicatedEvent ||
    event instanceof BlockMovedToPageEvent
  );
}

/**
 * 도메인 이벤트 처리 (Canvas BlockMount Management 도메인 내부) - 비동기 병렬 처리
 *
 * Event Bus 없이 비동기로 처리:
 * 1. Aggregate에서 이벤트 수집
 * 2. Service에서 이벤트 핸들러 병렬 실행
 * 3. Event Storming의 Policy와 1:1 매칭
 *
 * @param events - 처리할 도메인 이벤트 목록
 */
export async function handleDomainEvents(
  events: Array<DomainEvent>
): Promise<void> {
  // Promise.allSettled를 사용하여 일부 이벤트 실패 시에도 다른 이벤트는 계속 처리
  const results = await Promise.allSettled(
    events
      .filter(event => isBlockMountManagementEvent(event))
      .map(async event => {
        // Event Storming과 매칭: BlockMount Management 도메인 이벤트 처리
        if (event instanceof BlockMountedEvent) {
          return await handleBlockMounted(event);
        } else if (event instanceof BlockPositionUpdatedEvent) {
          return await handleBlockPositionUpdated(event);
        } else if (event instanceof BlockSizeUpdatedEvent) {
          return await handleBlockSizeUpdated(event);
        } else if (event instanceof MultipleBlockPositionsUpdatedEvent) {
          return await handleMultipleBlockPositionsUpdated(event);
        } else if (event instanceof MultipleBlockMountsDeletedEvent) {
          return await handleMultipleBlockMountsDeleted(event);
        } else if (event instanceof BlockMountDeletedEvent) {
          return await handleBlockDeleted(event);
        } else if (event instanceof BlockMountDuplicatedEvent) {
          return await handleBlockMountDuplicated(event);
        } else if (event instanceof BlockMovedToPageEvent) {
          return await handleBlockMovedToPage(event);
        }
      })
  );

  // 실패한 이벤트 로깅
  const failures = results.filter(
    result => result.status === 'rejected'
  ) as PromiseRejectedResult[];

  if (failures.length > 0) {
    console.warn(
      `[CanvasBlockMountService] ${failures.length} event handler(s) failed:`,
      failures.map(f => f.reason)
    );
  }
}

/**
 * Policy: 블럭이 마운트되었을 때
 *
 * Event Storming에서 정의한 Policy 구현:
 * - 예: 특정 블럭 타입이 마운트되면 자동으로 엣지 생성
 * - 예: 캔버스 통계 업데이트
 * - 예: 알림 전송
 */
async function handleBlockMounted(event: BlockMountedEvent): Promise<void> {
  console.log('[Canvas Management] Block Mounted:', {
    blockMountId: event.aggregateId,
    data: event.data,
  });

  // Policy 구현 예시:
  // - 자동 엣지 연결 확인
  // - 캔버스 레이아웃 최적화
  // - 통계 업데이트
}

/**
 * Policy: 블럭 위치가 업데이트되었을 때
 */
async function handleBlockPositionUpdated(
  event: BlockPositionUpdatedEvent
): Promise<void> {
  console.log('[Canvas Management] Block Position Updated:', {
    blockMountId: event.aggregateId,
    data: event.data,
  });

  // Policy 구현 예시:
  // - 겹침 감지 및 자동 조정
  // - 가이드라인 업데이트
}

/**
 * Policy: 블럭 크기가 업데이트되었을 때
 */
async function handleBlockSizeUpdated(
  event: BlockSizeUpdatedEvent
): Promise<void> {
  console.log('[Canvas Management] Block Size Updated:', {
    blockMountId: event.aggregateId,
    data: event.data,
  });

  // Policy 구현 예시:
  // - 최소/최대 크기 제한 확인
  // - 엣지 재계산
}

/**
 * Policy: 다중 블럭 위치가 업데이트되었을 때
 */
async function handleMultipleBlockPositionsUpdated(
  event: MultipleBlockPositionsUpdatedEvent
): Promise<void> {
  console.log('[Canvas Management] Multiple Block Positions Updated:', {
    eventId: event.aggregateId,
    data: event.data,
  });

  // Policy 구현 예시:
  // - 배치 이동 최적화
  // - 겹침 감지 및 자동 조정
  // - 가이드라인 업데이트
  // - 성능 최적화를 위한 배치 처리
}

/**
 * Policy: 다중 블럭이 삭제되었을 때
 */
async function handleMultipleBlockMountsDeleted(
  event: MultipleBlockMountsDeletedEvent
): Promise<void> {
  console.log('[Canvas Management] Multiple Block Mounts Deleted:', {
    eventId: event.aggregateId,
    data: event.data,
  });

  // Policy 구현 예시:
  // - 캔버스 통계 일괄 업데이트
  // - 레이아웃 자동 재정렬
  // - 성능 최적화를 위한 배치 처리
}

/**
 * Policy: 블럭이 삭제되었을 때
 */
async function handleBlockDeleted(
  event: BlockMountDeletedEvent
): Promise<void> {
  console.log('[Canvas Management] Block Deleted:', {
    blockMountId: event.aggregateId,
    data: event.data,
  });

  // Policy 구현 예시:
  // - 연결된 엣지 정리 (이미 서비스에서 처리됨)
  // - 캔버스 통계 업데이트
  // - 레이아웃 재정렬
}

/**
 * Policy: 블럭 마운트가 복제되었을 때
 */
async function handleBlockMountDuplicated(
  event: BlockMountDuplicatedEvent
): Promise<void> {
  console.log('[Canvas Management] Block Mount Duplicated:', {
    blockMountId: event.aggregateId,
    data: event.data,
  });

  // Policy 구현 예시:
  // - 복제된 블럭의 자동 연결
  // - 캔버스 통계 업데이트
  // - 레이아웃 최적화
}

/**
 * Policy: 블럭이 다른 페이지로 이동되었을 때
 */
async function handleBlockMovedToPage(
  event: BlockMovedToPageEvent
): Promise<void> {
  console.log('[Canvas Management] Block Moved To Page:', {
    blockMountId: event.aggregateId,
    data: event.data,
  });

  // Policy 구현 예시:
  // - 연결된 엣지 정리 (다른 페이지로 이동했으므로)
  // - 캔버스 통계 업데이트
  // - 레이아웃 재정렬
}
