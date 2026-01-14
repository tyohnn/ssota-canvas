/**
 * YouTube Transcript Service
 *
 * ZenRows 프록시를 사용하여 자막을 추출합니다.
 */
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import type { YoutubeScript } from '../../../shared/types/transcript.types';
import type { TranscriptSegment } from '../../../shared/types/transcript.types';
import { ZenRowsCaptionAdapter } from './script-adapter/zenrows-caption.adapter';

/**
 * YouTube 영상 스크립트 추출
 *
 * ZenRows 프록시를 사용하여 자막을 추출합니다.
 * premium_proxy를 사용하여 YouTube의 bot detection을 우회합니다.
 *
 * @param videoId - YouTube Video ID
 * @param language - 언어 코드 (선택적, 예: 'en', 'ko')
 * @returns YouTube 스크립트 데이터
 * @throws YoutubeError - 자막 추출 실패 시
 */
export async function getTranscript(
  videoId: string,
  language?: string
): Promise<YoutubeScript> {
  const adapter = new ZenRowsCaptionAdapter();

  try {
    const segments = await adapter.getTranscript(videoId, language);
    if (segments.length > 0) {
      return buildYoutubeScript(segments, videoId, language || 'auto');
    }

    throw new YoutubeError(
      'TRANSCRIPT_NOT_AVAILABLE',
      'No transcript segments found',
      { videoId, language }
    );
  } catch (error) {
    throw new YoutubeError(
      'TRANSCRIPT_NOT_AVAILABLE',
      `Failed to extract transcript: ${error instanceof Error ? error.message : String(error)}`,
      {
        videoId,
        language,
        originalError: error instanceof Error ? error.message : String(error),
      }
    );
  }
}

/**
 * YoutubeScript 객체 생성
 *
 * @param segments - 자막 세그먼트 배열
 * @param videoId - YouTube Video ID
 * @param language - 언어 코드
 * @returns YoutubeScript 객체
 */
function buildYoutubeScript(
  segments: TranscriptSegment[],
  videoId: string,
  language: string
): YoutubeScript {
  const lastSegment = segments[segments.length - 1];
  const totalDuration =
    segments.length > 0 && lastSegment
      ? lastSegment.start + lastSegment.duration
      : 0;

  return {
    transcript: segments,
    metadata: {
      extractedAt: new Date().toISOString(),
      totalDuration,
      totalSegments: segments.length,
      language,
    },
  };
}
