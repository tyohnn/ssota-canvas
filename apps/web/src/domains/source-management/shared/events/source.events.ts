import type { SourceMetadata } from '../types/source-metadata.types';
import { SourceId } from '../value-objects/source-id.vo';
import type { DomainEvent } from './domain-event';

export class SourceCreatedEvent implements DomainEvent {
  readonly type = 'SourceCreated';

  constructor(
    public readonly aggregateId: SourceId,
    public readonly data: {
      sourceId: string;
      url: string;
      sourceType: string;
      occurredAt: Date;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([
      // Policy: 로깅 등 부수 효과
    ]);
  }
}

export class SourceRawContentUpdatedEvent implements DomainEvent {
  readonly type = 'SourceRawContentUpdated';

  constructor(
    public readonly aggregateId: SourceId,
    public readonly data: {
      sourceId: string;
      extractedAt: Date;
      occurredAt: Date;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([
      // Policy: 로깅, 자동 요약 트리거는 Application Event에서 처리
    ]);
  }
}

export class SourceMetadataUpdatedEvent implements DomainEvent {
  readonly type = 'SourceMetadataUpdated';

  constructor(
    public readonly aggregateId: SourceId,
    public readonly data: {
      sourceId: string;
      metadata: Partial<SourceMetadata>;
      occurredAt: Date;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}
