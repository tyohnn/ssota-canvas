'use client';

import { Box } from '@workspace/ui/components/ui/box';
import {
  TimelineTranscriptItemView,
  type TimelineTranscriptSegmentLike,
} from './timeline-transcript-item-view';

export interface TimelineTranscriptViewProps {
  transcript: TimelineTranscriptSegmentLike[] | undefined;
  sourceTitle: string | undefined;
  onTimeClick: (seconds: number) => void;
  onAddQuote: (text: string, timestamp: number, segmentIndex: number) => void | Promise<void>;
  loadingSegmentIndex: number | null;
  readonly?: boolean;
}

export function TimelineTranscriptView({
  transcript,
  sourceTitle,
  onTimeClick,
  onAddQuote,
  loadingSegmentIndex,
  readonly = false,
}: TimelineTranscriptViewProps) {
  if (!transcript || transcript.length === 0) return null;

  return (
    <Box className="space-y-2">
      {transcript.map((segment, index) => (
        <TimelineTranscriptItemView
          key={index}
          segment={segment}
          onTimeClick={onTimeClick}
          onAddQuote={(text) => onAddQuote(text, segment.start, index)}
          isLoading={loadingSegmentIndex === index}
          readonly={readonly}
        />
      ))}
    </Box>
  );
}
