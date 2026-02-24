/**
 * Audio Metadata Events (Application Event)
 *
 * 오디오 URL 메타데이터 fetcht 완료 시 Application Event.
 * Policy: findOrCreateSource, block.sourceId, ensureSourceJob
 *
 * @see docs/patterns/backend/policy-and-event-types-guide.md
 */

export interface AudioMetadataFetchedEventData {
  workspaceId: string;
  blockId: string; // 8-char slug
  orgId: string;
  url: string;
  language: string;
}

/**
 * Audio 메타데이터 fetch 완료 이벤트 (Application Event)
 *
 * fetchAudioMetadata Use Case 성공 시 발행.
 */
export class AudioMetadataFetchedEvent {
  readonly type = 'AudioMetadataFetched';

  constructor(
    public readonly aggregateId: string,
    public readonly data: AudioMetadataFetchedEventData,
    public readonly occurredAt: Date,
    private readonly runPolicy?: () => Promise<void>
  ) {}

  async handle(): Promise<void> {
    if (this.runPolicy) {
      await Promise.allSettled([this.runPolicy()]);
    }
  }
}
