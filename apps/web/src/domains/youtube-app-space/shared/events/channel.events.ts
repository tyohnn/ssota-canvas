/**
 * Channel Events
 *
 * 도메인 이벤트 정의 (과거에 발생한 사실)
 * Command와 1:1 대응
 */
import type { DomainEvent } from './domain-event';

/**
 * Channel 생성 이벤트
 *
 * YouTube 채널이 생성되었을 때 발생
 */
export class ChannelCreatedEvent implements DomainEvent {
  readonly type = 'ChannelCreated';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      channelId: string;
      youtubeChannelId: string;
      channelName: string;
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
