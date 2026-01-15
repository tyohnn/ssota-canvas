/**
 * Script Section Utils
 *
 * 유틸리티 함수들
 */

/**
 * Script Transcript Segment
 */
export interface ScriptTranscriptSegment {
  start: number;
  text: string;
}

/**
 * Table of Contents Item
 */
export interface TOCItem {
  minute: number; // 분 단위 (0, 1, 2, ...)
  startTime: number; // 시작 시간 (초)
  firstSegmentIndex: number; // 첫 번째 segment의 인덱스
  previewText?: string; // 미리보기 텍스트 (첫 번째 segment의 text)
  intervalType: '5min' | '10min'; // 간격 타입 (5분 또는 10분)
}

/**
 * 시간 포맷팅 헬퍼
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 5분/10분 간격 목차 생성
 *
 * transcript 배열을 분석하여 5분(300초) 및 10분(600초) 간격으로 목차 항목을 생성합니다.
 * 각 목차 항목은 해당 구간의 첫 번째 segment를 가리킵니다.
 *
 * @param transcript - 스크립트 세그먼트 배열
 * @returns 5분/10분 간격 목차 항목 배열
 */
export function generateMinuteTOC(
  transcript: ScriptTranscriptSegment[] | undefined
): TOCItem[] {
  if (!transcript || transcript.length === 0) {
    return [];
  }

  const tocItems: TOCItem[] = [];
  const processedIntervals = new Set<string>(); // "5min:30" 또는 "10min:60" 형식

  // 전체 영상 길이 계산 (마지막 segment의 시간)
  const totalDuration = transcript[transcript.length - 1]?.start || 0;
  const totalMinutes = Math.floor(totalDuration / 60);

  transcript.forEach((segment, index) => {
    const minute = Math.floor(segment.start / 60);
    const seconds = segment.start;

    // 5분 간격 체크 (0, 5, 10, 15, ...)
    if (minute % 5 === 0 && minute % 10 !== 0) {
      const key = `5min:${minute}`;
      if (!processedIntervals.has(key)) {
        processedIntervals.add(key);
        tocItems.push({
          minute,
          startTime: segment.start,
          firstSegmentIndex: index,
          previewText: segment.text.substring(0, 50),
          intervalType: '5min',
        });
      }
    }

    // 10분 간격 체크 (0, 10, 20, 30, ...)
    if (minute % 10 === 0) {
      const key = `10min:${minute}`;
      if (!processedIntervals.has(key)) {
        processedIntervals.add(key);
        tocItems.push({
          minute,
          startTime: segment.start,
          firstSegmentIndex: index,
          previewText: segment.text.substring(0, 50),
          intervalType: '10min',
        });
      }
    }
  });

  // 시간 순서대로 정렬
  return tocItems.sort((a, b) => a.startTime - b.startTime);
}
