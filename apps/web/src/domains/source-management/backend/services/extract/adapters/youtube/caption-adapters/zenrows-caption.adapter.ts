/**
 * ZenRows Caption Adapter
 *
 * youtube-transcript-plus + ZenRows 프록시로 YouTube 자막을 추출합니다.
 * - options.premiumProxy: false = 1차(저비용), true = 2차(프리미엄 프록시)
 * - watch 페이지 GET, 자막 XML GET, Innertube player API POST → 모두 ZenRows
 *
 * ⚠️ ZENROWS_API_KEY 필요.
 */
import { config } from '@/config';
import { fetchTranscript } from 'youtube-transcript-plus';

import type { TimelineTranscriptSegment } from '../transcript.types';
import type { TranscriptAdapter } from './types';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export interface ZenRowsCaptionAdapterOptions {
  /** true = premium_proxy 사용(유료), false = 미사용(1차 저비용) */
  premiumProxy?: boolean;
}

export class ZenRowsCaptionAdapter implements TranscriptAdapter {
  readonly name: string;
  private readonly premiumProxy: boolean;

  constructor(options: ZenRowsCaptionAdapterOptions = {}) {
    this.premiumProxy = options.premiumProxy ?? true;
    this.name = this.premiumProxy ? 'zenrows-caption-premium' : 'zenrows-caption';
  }

  async getTranscript(
    videoId: string,
    language?: string
  ): Promise<TimelineTranscriptSegment[]> {
    const apiKey = config.providers.zenrows;
    if (!apiKey) {
      throw new Error(
        'ZENROWS_API_KEY environment variable is required for ZenRowsCaptionAdapter'
      );
    }

    const videoFetch = this.createZenRowsGet(apiKey);
    const transcriptFetch = this.createZenRowsGet(apiKey);
    const playerFetch = this.createZenRowsPost(apiKey);

    const segments = await fetchTranscript(videoId, {
      lang: language || undefined,
      videoFetch,
      playerFetch,
      transcriptFetch,
    });

    return segments.map((s) => ({
      text: s.text,
      start: s.offset,
      duration: s.duration,
    }));
  }

  private createZenRowsGet(apiKey: string) {
    return async ({
      url,
      userAgent,
      lang,
      headers = {},
    }: {
      url: string;
      userAgent?: string;
      lang?: string;
      headers?: Record<string, string>;
    }) => {
      const params = new URLSearchParams({
        apikey: apiKey,
        url,
        premium_proxy: this.premiumProxy ? 'true' : 'false',
      });
      return fetch(`https://api.zenrows.com/v1/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent || DEFAULT_USER_AGENT,
          ...(lang && { 'Accept-Language': lang }),
          Referer: 'https://www.youtube.com/',
          ...headers,
        },
      });
    };
  }

  /**
   * ZenRows POST: POST to api.zenrows.com/v1/?url=...&apikey=...; body is forwarded to target.
   * @see https://docs.zenrows.com/universal-scraper-api/features/other#post-put-requests
   */
  private createZenRowsPost(apiKey: string) {
    return async ({
      url,
      method = 'GET',
      body,
      lang,
      userAgent,
      headers = {},
    }: {
      url: string;
      method?: string;
      body?: string;
      lang?: string;
      userAgent?: string;
      headers?: Record<string, string>;
    }) => {
      const params = new URLSearchParams({
        apikey: apiKey,
        url,
        premium_proxy: this.premiumProxy ? 'true' : 'false',
      });
      const isPost = method === 'POST' && body != null;
      return fetch(`https://api.zenrows.com/v1/?${params.toString()}`, {
        method: isPost ? 'POST' : 'GET',
        headers: {
          'User-Agent': userAgent || DEFAULT_USER_AGENT,
          ...(isPost && { 'Content-Type': 'application/json' }),
          ...(lang && { 'Accept-Language': lang }),
          Referer: 'https://www.youtube.com/',
          ...headers,
        },
        ...(isPost && { body }),
      });
    };
  }
}
