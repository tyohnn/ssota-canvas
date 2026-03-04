/**
 * YouTube Transcript Extraction
 *
 * 1차: ZenRows (premium_proxy false) → 2차: ZenRows (premium_proxy true)
 */
import { SourceManagementError } from '../../../../../shared/errors/source-management.error';

import { ZenRowsCaptionAdapter } from './caption-adapters/zenrows-caption.adapter';
import type { TimelineScript } from '@/domains/source-management/shared/types/timeline-script.types';

import { buildYoutubeScript } from './build-script';
import { detectLanguageFromScript } from './detect-language';

/**
 * YouTube 영상 스크립트 추출
 *
 * @param videoId - YouTube Video ID
 * @param language - 언어 코드 (선택적, 예: 'en', 'ko', 'auto')
 * @returns TimelineScript (YouTube는 speakerId 없음)
 * @throws SourceManagementError - 자막 추출 실패 시
 */
export async function extractYoutubeTranscript(
  videoId: string,
  language?: string
): Promise<TimelineScript> {
  const adapters = [
    new ZenRowsCaptionAdapter({ premiumProxy: false }), // 1차
    new ZenRowsCaptionAdapter({ premiumProxy: true }), // 2차
  ];

  let lastError: Error | null = null;

  for (const adapter of adapters) {
    try {
      const segments = await adapter.getTranscript(videoId, language);

      if (segments.length > 0) {
        if (adapter.name === 'zenrows-caption-premium') {
          console.warn(
            `[extractYoutubeTranscript] videoId=${videoId} succeeded via fallback: ${adapter.name}`
          );
        }
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
      console.warn(
        `[extractYoutubeTranscript] videoId=${videoId} adapter=${adapter.name} failed:`,
        lastError.message
      );
      continue;
    }
  }

  throw new SourceManagementError(
    'EXTRACT_TRANSCRIPT_FAILED',
    `Failed to extract transcript: ${lastError?.message ?? 'All adapters failed'}`,
    {
      videoId,
      language,
      originalError: lastError?.message ?? 'All adapters failed',
    }
  );
}
