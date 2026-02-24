/**
 * YouTube Transcript Types
 *
 * TimelineScript / TimelineTranscriptSegment로 통일.
 * 기존 import 호환을 위한 type alias 제공.
 */
import type {
  TimelineScript,
  TimelineTranscriptMetadata,
  TimelineTranscriptSegment,
} from '@/domains/source-management/shared/types/timeline-script.types';

export type { TimelineScript, TimelineTranscriptMetadata, TimelineTranscriptSegment };

/** @deprecated Use TimelineTranscriptSegment */
export type TranscriptSegment = TimelineTranscriptSegment;

/** @deprecated Use TimelineTranscriptMetadata */
export type TranscriptMetadata = TimelineTranscriptMetadata;

/** @deprecated Use TimelineScript */
export type YoutubeScript = TimelineScript;
