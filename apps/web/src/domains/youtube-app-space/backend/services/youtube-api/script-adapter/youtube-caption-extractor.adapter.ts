/**
 * YouTube Caption Extractor Adapter (2차 Fallback)
 *
 * youtube-caption-extractor 라이브러리를 사용하여 자막을 추출합니다.
 * Serverless/Edge 환경에 최적화되어 있으며, bot detection bypass를 지원합니다.
 */
import { type Subtitle, getSubtitles } from 'youtube-caption-extractor';

import type { TranscriptSegment } from '../../../../shared/types/transcript.types';
import type { TranscriptAdapter } from './types';

export class YoutubeCaptionExtractorAdapter implements TranscriptAdapter {
  name = 'youtube-caption-extractor';

  async getTranscript(
    videoId: string,
    language?: string
  ): Promise<TranscriptSegment[]> {
    const subtitles: Subtitle[] = await getSubtitles({
      videoID: videoId,
      lang: language || 'en',
    });

    return subtitles.map(subtitle => ({
      text: subtitle.text,
      start: parseFloat(subtitle.start),
      duration: parseFloat(subtitle.dur),
    }));
  }
}
