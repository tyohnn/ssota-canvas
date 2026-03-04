/**
 * YouTube Caption Extractor Adapter (2차 Fallback)
 *
 * youtube-transcript-plus로 자막을 추출합니다 (직접 요청).
 */
import { fetchTranscript } from 'youtube-transcript-plus';

import type { TranscriptSegment } from '../../../../shared/types/transcript.types';
import type { TranscriptAdapter } from './types';

export class YoutubeCaptionExtractorAdapter implements TranscriptAdapter {
  name = 'youtube-caption-extractor';

  async getTranscript(
    videoId: string,
    language?: string
  ): Promise<TranscriptSegment[]> {
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
