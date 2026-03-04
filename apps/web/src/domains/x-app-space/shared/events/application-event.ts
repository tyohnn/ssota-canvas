/**
 * Application Event interface
 */
export interface ApplicationEvent {
  readonly type: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  handle(): Promise<void>;
}
