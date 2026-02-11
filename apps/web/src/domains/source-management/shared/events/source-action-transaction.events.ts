import { SourceActionTransactionId } from '../value-objects/source-action-tx-id.vo';
import type { DomainEvent } from './domain-event';

export class SourceActionTransactionCreatedEvent implements DomainEvent {
  readonly type = 'SourceActionTransactionCreated';

  constructor(
    public readonly aggregateId: SourceActionTransactionId,
    public readonly data: {
      transactionId: string;
      orgId: string;
      sourceId: string;
      actionType: string;
      language: string | null;
      occurredAt: Date;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}
