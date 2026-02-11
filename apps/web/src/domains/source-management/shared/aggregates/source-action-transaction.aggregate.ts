import type { CreateSourceActionTransactionCommand } from '../commands';
import { SourceActionTransaction } from '../entities/source-action-transaction.entity';
import { SourceActionTransactionCreatedEvent } from '../events';
import type { DomainEvent } from '../events/domain-event';

export class SourceActionTransactionAggregate {
  private _transaction: SourceActionTransaction;
  private _uncommittedEvents: SourceActionTransactionCreatedEvent[] = [];

  private constructor(transaction: SourceActionTransaction) {
    this._transaction = transaction;
  }

  static create(
    command: CreateSourceActionTransactionCommand
  ): SourceActionTransactionAggregate {
    const transaction = SourceActionTransaction.create(
      command.transactionId,
      command.orgId,
      command.sourceId,
      command.actionType,
      command.language ?? null
    );
    const aggregate = new SourceActionTransactionAggregate(transaction);
    const event = new SourceActionTransactionCreatedEvent(
      transaction.id,
      {
        transactionId: transaction.id.value,
        orgId: transaction.orgId.value,
        sourceId: transaction.sourceId.value,
        actionType: transaction.actionType,
        language: transaction.language,
        occurredAt: transaction.createdAt,
      },
      transaction.createdAt
    );
    aggregate._uncommittedEvents.push(event);
    return aggregate;
  }

  static reconstitute(
    transaction: SourceActionTransaction
  ): SourceActionTransactionAggregate {
    return new SourceActionTransactionAggregate(transaction);
  }

  markCompleted(): void {
    this._transaction.markCompleted();
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  getTransaction(): SourceActionTransaction {
    return this._transaction;
  }
}
