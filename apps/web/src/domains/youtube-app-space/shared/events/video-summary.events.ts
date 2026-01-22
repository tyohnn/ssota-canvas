/**
 * Video Summary Events
 *
 * 도메인 이벤트 정의 (과거에 발생한 사실)
 * Command와 1:1 대응
 */
import type { DomainEvent } from './domain-event';

/**
 * VideoSummary 생성 이벤트
 *
 * VideoSummary가 생성되었을 때 발생
 */
export class VideoSummaryCreatedEvent implements DomainEvent {
  readonly type = 'VideoSummaryCreated';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      videoId: string;
      language: string;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    // Policy 구현 예시:
    // - 검색 인덱스 업데이트
    // - 통계 업데이트
    // - 캐시 무효화
    await Promise.allSettled([]);
  }
}

/**
 * VideoSummary 업데이트 이벤트
 *
 * VideoSummary가 업데이트되었을 때 발생
 */
export class VideoSummaryUpdatedEvent implements DomainEvent {
  readonly type = 'VideoSummaryUpdated';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      videoId: string;
      language: string;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    // Policy 구현 예시:
    // - 검색 인덱스 업데이트
    // - 통계 업데이트
    // - 캐시 무효화
    await Promise.allSettled([]);
  }
}
