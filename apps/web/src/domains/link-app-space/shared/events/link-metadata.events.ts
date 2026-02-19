/**
 * Link Metadata Events (Application Event)
 *
 * 메타데이터+마크다운 조회 성공 등 Use Case 수준 이벤트.
 * Policy: handle()에서 findOrCreateSource, block.sourceId, ensureSourceJob 등 후속 처리 (Use Case Policy).
 *
 * @see docs/patterns/backend/policy-and-event-types-guide.md
 */

export interface LinkMetadataFetchedEventData {
  workspaceId: string;
  blockId: string; // 8-char slug
  orgId: string;
  url: string;
  language: string;
  /** markdown (raw_content) - 있으면 Source 생성 시 함께 저장, processSourceJob에서 extract 건너뜀 */
  markdown?: string | null;
}

/**
 * Link 메타데이터+콘텐츠 조회 성공 이벤트 (Application Event)
 *
 * fetchLinkMetadata Use Case 성공 시 발행. Aggregate가 아닌 Action/서비스에서
 * 발행하며, handle()에서 Use Case Policy 실행 (runner 주입).
 */
export class LinkMetadataFetchedEvent {
  readonly type = 'LinkMetadataFetched';

  constructor(
    /** Correlation id (blockId). */
    public readonly aggregateId: string,
    public readonly data: LinkMetadataFetchedEventData,
    public readonly occurredAt: Date,
    private readonly runPolicy?: () => Promise<void>
  ) {}

  /**
   * Application Event Policy 실행 (findOrCreateSource, block.sourceId, ensureSourceJob)
   */
  async handle(): Promise<void> {
    if (this.runPolicy) {
      await Promise.allSettled([this.runPolicy()]);
    }
  }
}
