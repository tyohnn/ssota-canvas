import { SourceSummaryId } from '../value-objects/source-summary-id.vo';
import type { DomainEvent } from './domain-event';

export class SourceSummaryCreatedEvent implements DomainEvent {
  readonly type = 'SourceSummaryCreated';

  constructor(
    public readonly aggregateId: SourceSummaryId,
    public readonly data: {
      summaryId: string;
      sourceId: string;
      language: string;
      occurredAt: Date;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}
