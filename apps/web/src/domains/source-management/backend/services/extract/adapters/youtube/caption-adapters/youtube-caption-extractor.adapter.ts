/**
 * YouTube Caption Extractor Adapter (1차)
 *
 * youtube-transcript-plus로 자막을 추출합니다 (직접 요청, 프록시 없음).
 * 실패 시 ZenRowsCaptionAdapter(youtube-transcript-plus + ZenRows)가 사용됩니다.
 */
import { fetchTranscript } from 'youtube-transcript-plus';

import type { TimelineTranscriptSegment } from '../transcript.types';
import type { TranscriptAdapter } from './types';

export class YoutubeCaptionExtractorAdapter implements TranscriptAdapter {
  name = 'youtube-caption-extractor';

  async getTranscript(
    videoId: string,
    language?: string
  ): Promise<TimelineTranscriptSegment[]> {
    const segments = await fetchTranscript(videoId, {
      lang: language || undefined,
    });

    return segments.map((s) => ({
      text: s.text,
      start: s.offset,
      duration: s.duration,
    }));
  }
}
