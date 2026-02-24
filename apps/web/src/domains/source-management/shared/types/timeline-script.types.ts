/**
 * Timeline Script Types
 *
 * sources.raw_content 파싱 결과 (타임라인 기반 스크립트)
 * Video, audio 등 타임스탬프 기반 transcript용
 */

/**
 * Timeline Transcript Segment
 *
 * 자막의 한 세그먼트 (문장 단위)
 * speakerId: diarization 사용 시 발화자 식별자 (오디오 등)
 */
export interface TimelineTranscriptSegment {
  text: string;
  start: number;
  duration: number;
  /** 발화자 ID (diarization 사용 시, ElevenLabs 등) */
  speakerId?: string;
}

/**
 * Timeline Transcript Metadata
 */
export interface TimelineTranscriptMetadata {
  extractedAt: string;
  totalDuration: number;
  totalSegments: number;
  language: string;
}

/**
 * Timeline Script
 *
 * 타임라인 기반 전체 스크립트 데이터
 */
export interface TimelineScript {
  transcript: TimelineTranscriptSegment[];
  metadata: TimelineTranscriptMetadata;
}
