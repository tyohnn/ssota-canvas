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
    await Promise.allSettled([]);
  }
}
