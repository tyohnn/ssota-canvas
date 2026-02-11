/**
 * YouTube Transcript Extraction
 *
 * Fallback 메커니즘: 무료 어댑터를 먼저 시도하고, 실패 시 ZenRows 사용
 */
import { SourceManagementError } from '../../../../../shared/errors/source-management.error';

import { YoutubeCaptionExtractorAdapter } from './caption-adapters/youtube-caption-extractor.adapter';
import { ZenRowsCaptionAdapter } from './caption-adapters/zenrows-caption.adapter';
import { buildYoutubeScript } from './build-script';
import { detectLanguageFromScript } from './detect-language';
import type { YoutubeScript } from './transcript.types';

/**
 * YouTube 영상 스크립트 추출
 *
 * @param videoId - YouTube Video ID
 * @param language - 언어 코드 (선택적, 예: 'en', 'ko', 'auto')
 * @returns YouTube 스크립트 데이터
 * @throws SourceManagementError - 자막 추출 실패 시
 */
export async function extractYoutubeTranscript(
  videoId: string,
  language?: string
): Promise<YoutubeScript> {
  const adapters = [
    new YoutubeCaptionExtractorAdapter(), // 1차: 무료
    new ZenRowsCaptionAdapter(), // 2차: 유료, ZenRows bot detection 우회
  ];

  let lastError: Error | null = null;

  for (const adapter of adapters) {
    try {
      const segments = await adapter.getTranscript(videoId, language);

      if (segments.length > 0) {
        let detectedLanguage = language || 'auto';
        if (detectedLanguage === 'auto') {
          const languageResult = await detectLanguageFromScript(segments, videoId);
          if (languageResult.isSuccess()) {
            detectedLanguage = languageResult.value;
          } else {
            console.warn(
              `Failed to detect language for video ${videoId}: ${languageResult.error.message}`
            );
          }
        }

        return buildYoutubeScript(segments, videoId, detectedLanguage);
      }

      lastError = new Error('No transcript segments found');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  throw new SourceManagementError(
    'EXTRACT_TRANSCRIPT_FAILED',
    `Failed to extract transcript: ${lastError?.message || 'All adapters failed'}`,
    {
      videoId,
      language,
      originalError: lastError?.message || 'All adapters failed',
    }
  );
}
