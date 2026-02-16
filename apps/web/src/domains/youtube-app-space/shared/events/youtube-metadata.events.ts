/**
 * YouTube Metadata Events (Application Event)
 *
 * 메타데이터 조회 성공 등 Use Case 수준 이벤트.
 * Policy: handle()에서 ensure video summary 등 후속 처리 (Use Case Policy).
 *
 * @see docs/patterns/backend/policy-and-event-types-guide.md
 */
import type { ApplicationEvent } from './application-event';

export interface YoutubeMetadataFetchedEventData {
  workspaceId: string;
  blockId: string; // 8-char slug
  orgId: string;
  youtubeId: string; // slug (11-char)
  language: string;
}

/**
 * YouTube 메타데이터 조회 성공 이벤트 (Application Event)
 *
 * getYoutubeMetadata Use Case 성공 시 발행. Aggregate가 아닌 Action/서비스에서
 * 발행하며, handle()에서 Use Case Policy 실행 (runner 주입).
 */
export class YoutubeMetadataFetchedEvent implements ApplicationEvent {
  readonly type = 'YoutubeMetadataFetched';

  constructor(
    /** Correlation id (blockId). */
    public readonly aggregateId: string,
    public readonly data: YoutubeMetadataFetchedEventData,
    public readonly occurredAt: Date,
    private readonly runPolicy?: () => Promise<void>
  ) { }

  /**
   * Application Event Policy 실행 (ensure video summary 등)
   */
  async handle(): Promise<void> {
    if (this.runPolicy) {
      await Promise.allSettled([this.runPolicy()]);
    }
  }
}
