/**
 * Action Transaction Events
 *
 * 도메인 이벤트 정의 (과거에 발생한 사실)
 * Command와 1:1 대응
 */
import type { DomainEvent } from './domain-event';

/**
 * Action Transaction 생성 이벤트
 *
 * Action Transaction이 생성되었을 때 발생
 */
export class ActionTransactionCreatedEvent implements DomainEvent {
  readonly type = 'ActionTransactionCreated';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      transactionId: string;
      blockId: string;
      videoId: string;
      actionType: string;
    },
    public readonly occurredAt: Date
  ) {}

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    // Policy 구현 예시:
    // - 통계 업데이트
    // - 로깅
    await Promise.allSettled([]);
  }
}

/**
 * Action Transaction 완료 이벤트
 *
 * Action Transaction이 완료되었을 때 발생
 */
export class ActionTransactionCompletedEvent implements DomainEvent {
  readonly type = 'ActionTransactionCompleted';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      transactionId: string;
      blockId: string;
      videoId: string;
      actionType: string;
    },
    public readonly occurredAt: Date
  ) {}

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    // Policy 구현 예시:
    // - 통계 업데이트
    // - 로깅
    await Promise.allSettled([]);
  }
}
