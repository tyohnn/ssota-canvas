import type { CreateSourceSummaryCommand } from '../commands';
import { SourceSummary } from '../entities/source-summary.entity';
import { SourceSummaryCreatedEvent } from '../events';
import type { DomainEvent } from '../events/domain-event';

export class SourceSummaryAggregate {
  private _summary: SourceSummary;
  private _uncommittedEvents: SourceSummaryCreatedEvent[] = [];

  private constructor(summary: SourceSummary) {
    this._summary = summary;
  }

  static create(command: CreateSourceSummaryCommand): SourceSummaryAggregate {
    const summary = SourceSummary.create(
      command.summaryId,
      command.sourceId,
      command.language,
      command.summary,
      command.keywords
    );
    const aggregate = new SourceSummaryAggregate(summary);
    const event = new SourceSummaryCreatedEvent(
      summary.id,
      {
        summaryId: summary.id.value,
        sourceId: summary.sourceId.value,
        language: summary.language.value,
        occurredAt: summary.createdAt,
      },
      summary.createdAt
    );
    aggregate._uncommittedEvents.push(event);
    return aggregate;
  }

  static reconstitute(summary: SourceSummary): SourceSummaryAggregate {
    return new SourceSummaryAggregate(summary);
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  getSourceSummary(): SourceSummary {
    return this._summary;
  }
}
