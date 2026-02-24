/**
 * Transcript Adapter Types
 *
 * 공통 인터페이스 정의
 */
import type { TimelineTranscriptSegment } from '@/domains/source-management/shared/types/timeline-script.types';

/**
 * Transcript Adapter Interface
 *
 * 모든 자막 추출 어댑터가 구현해야 하는 인터페이스
 */
export interface TranscriptAdapter {
  /**
   * 어댑터 이름 (로깅용)
   */
  name: string;

  /**
   * 자막 추출
   *
   * @param videoId - YouTube Video ID
   * @param language - 언어 코드 (선택적, 예: 'en', 'ko')
   * @returns 자막 세그먼트 배열 (TimelineTranscriptSegment)
   */
  getTranscript(
    videoId: string,
    language?: string
  ): Promise<TimelineTranscriptSegment[]>;
}
