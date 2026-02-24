import type {
  CreateSourceCommand,
  UpdateSourceMetadataCommand,
  UpdateSourceRawContentCommand,
} from '../commands';
import { Source } from '../entities/source.entity';
import {
  SourceCreatedEvent,
  SourceMetadataUpdatedEvent,
  SourceRawContentUpdatedEvent,
} from '../events';
import type { DomainEvent } from '../events/domain-event';
import { SourceId } from '../value-objects/source-id.vo';

type SourceDomainEvent =
  | SourceCreatedEvent
  | SourceRawContentUpdatedEvent
  | SourceMetadataUpdatedEvent;

export class SourceAggregate {
  private _source: Source;
  private _uncommittedEvents: SourceDomainEvent[] = [];

  private constructor(source: Source) {
    this._source = source;
  }

  static create(command: CreateSourceCommand): SourceAggregate {
    const source = Source.create(
      command.sourceId,
      command.url,
      command.sourceType,
      command.metadata ?? {},
      command.contentLanguage?.value ?? null
    );
    const aggregate = new SourceAggregate(source);
    const event = new SourceCreatedEvent(
      source.id,
      {
        sourceId: source.id.value,
        url: source.url.value,
        sourceType: source.sourceType.value,
        occurredAt: source.createdAt,
      },
      source.createdAt
    );
    aggregate._uncommittedEvents.push(event);
    return aggregate;
  }

  static reconstitute(source: Source): SourceAggregate {
    return new SourceAggregate(source);
  }

  updateRawContent(command: UpdateSourceRawContentCommand): void {
    this._source.updateRawContent(
      command.rawContent,
      command.extractedAt,
      command.expiresAt,
      command.contentLanguage
    );
    const event = new SourceRawContentUpdatedEvent(
      this._source.id,
      {
        sourceId: this._source.id.value,
        extractedAt: command.extractedAt,
        occurredAt: this._source.updatedAt,
      },
      this._source.updatedAt
    );
    this._uncommittedEvents.push(event);
  }

  updateMetadata(command: UpdateSourceMetadataCommand): void {
    this._source.updateMetadata(command.metadata);
    const event = new SourceMetadataUpdatedEvent(
      this._source.id,
      {
        sourceId: this._source.id.value,
        metadata: command.metadata,
        occurredAt: this._source.updatedAt,
      },
      this._source.updatedAt
    );
    this._uncommittedEvents.push(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  getSource(): Source {
    return this._source;
  }
}
