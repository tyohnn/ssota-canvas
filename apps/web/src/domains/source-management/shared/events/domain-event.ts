export interface DomainEvent {
  readonly type: string;
  readonly aggregateId: unknown;
  readonly data: unknown;
  readonly occurredAt: Date;
  handle(): Promise<void>;
}
