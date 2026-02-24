/**
 * YouTube Transcript Extraction Service
 *
 * source-management의 extractYoutubeTranscript를 re-export.
 * YoutubeError로 매핑하여 기존 호출자 호환성 유지.
 */
import { extractYoutubeTranscript } from '@/domains/source-management/backend/services/extract/adapters/youtube/extract-transcript';
import type { YoutubeScript } from '@/domains/source-management/backend/services/extract/adapters/youtube/transcript.types';
import { SourceManagementError } from '@/domains/source-management/shared/errors/source-management.error';

import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';

/**
 * YouTube 영상 스크립트 추출
 *
 * @param videoId - YouTube Video ID
 * @param language - 언어 코드 (선택적)
 * @returns YouTube 스크립트 데이터
 * @throws YoutubeError - 자막 추출 실패 시
 */
export async function extractTranscript(
  videoId: string,
  language?: string
): Promise<YoutubeScript> {
  try {
    return await extractYoutubeTranscript(videoId, language);
  } catch (error) {
    if (error instanceof SourceManagementError) {
      throw new YoutubeError(
        'TRANSCRIPT_NOT_AVAILABLE',
        error.message,
        { ...error.details, videoId, language }
      );
    }
    throw error;
  }
}
