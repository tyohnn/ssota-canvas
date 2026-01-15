/**
 * YouTube Transcript Extraction Service
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
export async function extractTranscript(
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
  // 마침표를 기준으로 세그먼트 병합
  const mergedSegments = mergeSegmentsByPeriod(segments);

  const lastSegment = mergedSegments[mergedSegments.length - 1];
  const totalDuration =
    mergedSegments.length > 0 && lastSegment
      ? lastSegment.start + lastSegment.duration
      : 0;

  return {
    transcript: mergedSegments,
    metadata: {
      extractedAt: new Date().toISOString(),
      totalDuration,
      totalSegments: mergedSegments.length,
      language,
    },
  };
}

/**
 * 마침표를 기준으로 세그먼트 병합
 *
 * 세그먼트들을 순차적으로 합치면서, 누적된 텍스트에서 마침표를 기준으로
 * 완성된 문장들을 추출하여 각각을 하나의 세그먼트로 병합합니다.
 * 각 문장의 첫 번째 세그먼트의 시작 시간을 사용합니다.
 *
 * @param segments - 병합할 세그먼트 배열
 * @returns 병합된 세그먼트 배열
 */
function mergeSegmentsByPeriod(
  segments: TranscriptSegment[]
): TranscriptSegment[] {
  if (segments.length === 0) {
    return [];
  }

  const merged: TranscriptSegment[] = [];
  let sentenceStartIndex = 0; // 현재 문장이 시작된 세그먼트 인덱스
  let accumulatedText = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const segmentText = segment.text.trim();

    // 누적된 텍스트에 새 세그먼트 텍스트 추가
    if (accumulatedText) {
      accumulatedText += ' ' + segmentText;
    } else {
      accumulatedText = segmentText;
      sentenceStartIndex = i;
    }

    // 누적된 텍스트에서 마침표로 끝나는 문장들을 추출
    while (accumulatedText.includes('.')) {
      const periodIndex = accumulatedText.indexOf('.');
      const sentenceText = accumulatedText.substring(0, periodIndex + 1).trim();

      // 마침표만 있는 경우는 제외 (공백이나 마침표만 있는 경우 필터링)
      if (sentenceText && sentenceText !== '.') {
        const firstSegment = segments[sentenceStartIndex]!;
        const lastSegment = segment;

        const mergedDuration =
          lastSegment.start + lastSegment.duration - firstSegment.start;

        merged.push({
          text: sentenceText,
          start: firstSegment.start,
          duration: mergedDuration,
        });
      }

      // 처리된 문장 제거 (마침표 포함)
      accumulatedText = accumulatedText.substring(periodIndex + 1).trim();
      sentenceStartIndex = i; // 다음 문장은 현재 세그먼트부터 시작
    }
  }

  // 마지막에 남은 세그먼트들 처리 (마침표로 끝나지 않는 경우)
  if (accumulatedText.trim()) {
    const firstSegment = segments[sentenceStartIndex]!;
    const lastSegment = segments[segments.length - 1]!;

    const mergedDuration =
      lastSegment.start + lastSegment.duration - firstSegment.start;

    merged.push({
      text: accumulatedText.trim(),
      start: firstSegment.start,
      duration: mergedDuration,
    });
  }

  return merged;
}
