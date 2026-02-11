/**
 * YoutubeScript 객체 생성 및 세그먼트 병합
 */
import type { TranscriptSegment, YoutubeScript } from './transcript.types';

/**
 * YoutubeScript 객체 생성
 *
 * @param segments - 자막 세그먼트 배열
 * @param videoId - YouTube Video ID
 * @param language - 언어 코드
 * @returns YoutubeScript 객체
 */
export function buildYoutubeScript(
  segments: TranscriptSegment[],
  _videoId: string,
  language: string
): YoutubeScript {
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
export function mergeSegmentsByPeriod(
  segments: TranscriptSegment[]
): TranscriptSegment[] {
  if (segments.length === 0) {
    return [];
  }

  const merged: TranscriptSegment[] = [];
  let sentenceStartIndex = 0;
  let accumulatedText = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const segmentText = segment.text.trim();

    if (accumulatedText) {
      accumulatedText += ' ' + segmentText;
    } else {
      accumulatedText = segmentText;
      sentenceStartIndex = i;
    }

    while (accumulatedText.includes('.')) {
      const periodIndex = accumulatedText.indexOf('.');
      const sentenceText = accumulatedText.substring(0, periodIndex + 1).trim();

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

      accumulatedText = accumulatedText.substring(periodIndex + 1).trim();
      sentenceStartIndex = i;
    }
  }

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
