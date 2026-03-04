/**
 * Timeline Tab Types
 * Domain-neutral view types
 */

export interface TimelineTranscriptSegmentLike {
  text: string;
  start: number;
  duration?: number;
}

export interface TimelineScriptLike {
  transcript: TimelineTranscriptSegmentLike[];
  metadata?: { extractedAt?: string; totalDuration?: number; language?: string };
}

export interface TimelineTabViewProps {
  sourceTitle: string | undefined;
  script: TimelineScriptLike | undefined;
  extractedAt?: Date | string | null;
  isLoading: boolean;
  error: string | null;
  onExtractScript: () => Promise<void>;
  isExtracting: boolean;
  switchToTab?: (tabId: string) => void;
  onTimeClick?: (seconds: number) => void;
  onAddQuote?: (text: string, timestamp: number, segmentIndex: number) => void | Promise<void>;
  loadingSegmentIndex?: number | null;
  readonly?: boolean;
}
