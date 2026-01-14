/**
 * Video Events
 *
 * 도메인 이벤트 정의 (과거에 발생한 사실)
 * Command와 1:1 대응
 */
import type { DomainEvent } from './domain-event';

/**
 * Video 생성 이벤트
 *
 * Video가 생성되었을 때 발생
 */
export class VideoCreatedEvent implements DomainEvent {
  readonly type = 'VideoCreated';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      videoId: string;
      slug: string; // YouTube Video ID (11자리)
      title: string;
      channelId: string;
    },
    public readonly occurredAt: Date
  ) {}

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    // Policy 구현 예시:
    // - 통계 업데이트
    // - 캐시 무효화
    // - 알림 전송
    await Promise.allSettled([]);
  }
}

/**
 * 스크립트 업데이트 이벤트
 *
 * Video의 스크립트가 업데이트되었을 때 발생
 */
export class ScriptUpdatedEvent implements DomainEvent {
  readonly type = 'ScriptUpdated';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      videoId: string;
      slug: string; // YouTube Video ID (11자리)
      scriptLanguage: string;
      totalSegments: number;
    },
    public readonly occurredAt: Date
  ) {}

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    // Policy 구현 예시:
    // - 검색 인덱스 업데이트
    // - AI 분석 트리거
    // - 통계 업데이트
    await Promise.allSettled([]);
  }
}
