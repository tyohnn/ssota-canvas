// DomainEvent interface for AI management domain
// context: optional policy context for handle() to trigger cross-domain policies
export interface DomainEvent {
  readonly type: string;
  readonly aggregateId: unknown;
  readonly data: unknown;
  handle(context?: unknown): Promise<void>;
}
