// DomainEvent 인터페이스
// context: optional policy context (e.g. EventLogPolicyContext) for handle() to trigger cross-domain policies
export interface DomainEvent {
  readonly type: string;
  readonly aggregateId: any;
  readonly data: any;
  handle(context?: unknown): Promise<void>;
}
