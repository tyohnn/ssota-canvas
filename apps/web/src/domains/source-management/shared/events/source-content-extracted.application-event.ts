/**
 * Application Event: 추출 완료 (Use Case 수준)
 * Policy: (1) ensureSourceSummary 자동 요약 큐잉, (2) App Space 도메인 호출로 구조화 데이터 저장
 */
export interface SourceContentExtractedEventPayload {
  sourceId: string;
  sourceType: string;
  rawContent: string;
  /** 플랫폼 식별자 (e.g. appSpaceId for YouTube video) */
  appSpaceId?: string;
  /** 구조화 원본 (e.g. script JSON for YouTube) - Policy에서 App Space 저장 시 사용 */
  structuredPayload?: unknown;
  contentLanguage?: string | null;
  occurredAt: Date;
}

export interface ApplicationEvent<T = unknown> {
  readonly type: string;
  readonly payload: T;
  handle(): Promise<void>;
}

export class SourceContentExtractedEvent implements ApplicationEvent<SourceContentExtractedEventPayload> {
  readonly type = 'SourceContentExtracted';

  constructor(
    public readonly payload: SourceContentExtractedEventPayload,
    private readonly policyRunner?: (event: SourceContentExtractedEvent) => Promise<void>
  ) {}

  async handle(): Promise<void> {
    if (this.policyRunner) {
      await Promise.allSettled([this.policyRunner(this)]);
    }
  }
}
