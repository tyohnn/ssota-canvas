/**
 * Application Event Interface
 *
 * Use Case / Application 레벨 이벤트. Aggregate 상태 변경에 직접 대응되지 않는
 * "유스케이스 완료" 시점을 나타낼 때 사용.
 *
 * @see docs/patterns/backend/policy-and-event-types-guide.md
 */

export interface ApplicationEvent {
  readonly type: string;
  /** Correlation/source id (e.g. blockId). Not necessarily an aggregate root id. */
  readonly aggregateId: string;
  readonly data: unknown;
  readonly occurredAt: Date;
  handle(): Promise<void>;
}
