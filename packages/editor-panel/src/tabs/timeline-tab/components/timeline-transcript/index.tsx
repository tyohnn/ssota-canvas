'use client';

import type { TimelineTranscriptViewProps } from './components';
import { TimelineTranscriptView } from './components';

export interface TimelineTranscriptProps {
  transcript: TimelineTranscriptViewProps['transcript'];
  sourceTitle: string | undefined;
  onTimeClick: (seconds: number) => void;
  onAddQuote: (text: string, timestamp: number, segmentIndex: number) => void | Promise<void>;
  loadingSegmentIndex: number | null;
  readonly?: boolean;
}

export function TimelineTranscript({
  transcript,
  sourceTitle,
  onTimeClick,
  onAddQuote,
  loadingSegmentIndex,
  readonly = false,
}: TimelineTranscriptProps) {
  return (
    <TimelineTranscriptView
      transcript={transcript}
      sourceTitle={sourceTitle}
      onTimeClick={onTimeClick}
      onAddQuote={onAddQuote}
      loadingSegmentIndex={loadingSegmentIndex}
      readonly={readonly}
    />
  );
}

export { TimelineTranscriptView, TimelineTranscriptItemView } from './components';
export type {
  TimelineTranscriptViewProps,
  TimelineTranscriptItemViewProps,
  TimelineTranscriptSegmentLike,
} from './components';
