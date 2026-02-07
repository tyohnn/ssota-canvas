/**
 * Summary Job Events
 *
 * 도메인 이벤트 정의 (과거에 발생한 사실)
 * Command와 1:1 대응
 */
import type { DomainEvent } from './domain-event';

/**
 * Summary Job 생성 이벤트 (pending 등록)
 */
export class SummaryJobCreatedEvent implements DomainEvent {
  readonly type = 'SummaryJobCreated';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      jobId: string;
      blockId: string;
      orgId: string;
      youtubeId: string;
      language: string;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

/**
 * Summary Job을 completed 상태로 등록한 이벤트
 */
export class SummaryJobRegisteredCompletedEvent implements DomainEvent {
  readonly type = 'SummaryJobRegisteredCompleted';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      jobId: string;
      blockId: string;
      orgId: string;
      youtubeId: string;
      language: string;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

/**
 * Summary Job 처리 완료 이벤트
 */
export class SummaryJobCompletedEvent implements DomainEvent {
  readonly type = 'SummaryJobCompleted';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      jobId: string;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

/**
 * Summary Job 처리 실패 이벤트
 */
export class SummaryJobFailedEvent implements DomainEvent {
  readonly type = 'SummaryJobFailed';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      jobId: string;
      errorMessage: string;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}
