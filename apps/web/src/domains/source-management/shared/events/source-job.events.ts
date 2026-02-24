/**
 * Source Job Events
 *
 * 도메인 이벤트 정의 (과거에 발생한 사실)
 * Command와 1:1 대응
 */
import type { DomainEvent } from './domain-event';

/**
 * Source Job 생성 이벤트 (pending 등록)
 */
export class SourceJobCreatedEvent implements DomainEvent {
  readonly type = 'SourceJobCreated';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      jobId: string;
      blockId: string;
      orgId: string;
      sourceId: string;
      language: string;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

/**
 * Source Job을 completed 상태로 등록한 이벤트
 */
export class SourceJobRegisteredCompletedEvent implements DomainEvent {
  readonly type = 'SourceJobRegisteredCompleted';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      jobId: string;
      blockId: string;
      orgId: string;
      sourceId: string;
      language: string;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

/**
 * Source Job 처리 완료 이벤트
 */
export class SourceJobCompletedEvent implements DomainEvent {
  readonly type = 'SourceJobCompleted';

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
 * Source Job 처리 실패 이벤트
 */
export class SourceJobFailedEvent implements DomainEvent {
  readonly type = 'SourceJobFailed';

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
