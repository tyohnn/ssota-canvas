/**
 * Domain Event Interface
 *
 * 도메인 이벤트의 기본 인터페이스
 */

export interface DomainEvent {
  readonly type: string;
  readonly aggregateId: string;
  readonly data: any;
  readonly occurredAt: Date;
  handle(): Promise<void>;
}
