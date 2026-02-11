/**
 * Transcript Types
 *
 * YouTube 스크립트/자막 데이터 타입 정의
 * Value Object가 아닌 단순 Type으로 정의
 */

/**
 * Transcript Segment
 *
 * 자막의 한 세그먼트 (문장 단위)
 */
export interface TranscriptSegment {
  /**
   * 텍스트 내용
   */
  text: string;

  /**
   * 시작 시간 (초)
   */
  start: number;

  /**
   * 지속 시간 (초)
   */
  duration: number;
}

/**
 * Transcript Metadata
 *
 * 스크립트 메타데이터
 */
export interface TranscriptMetadata {
  /**
   * 추출 시각 (ISO 8601)
   */
  extractedAt: string;

  /**
   * 전체 영상 길이 (초)
   */
  totalDuration: number;

  /**
   * 전체 세그먼트 수
   */
  totalSegments: number;

  /**
   * 언어 코드 (예: "en", "ko")
   */
  language: string;
}

/**
 * YouTube Script
 *
 * YouTube 영상의 전체 스크립트 데이터
 */
export interface YoutubeScript {
  /**
   * 자막 세그먼트 배열
   */
  transcript: TranscriptSegment[];

  /**
   * 메타데이터
   */
  metadata: TranscriptMetadata;
}
