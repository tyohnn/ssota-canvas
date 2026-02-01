/**
 * Script Transcript View
 *
 * Presentational component: 렌더링만 담당
 * - Props만 받음
 * - Hook 사용 없음
 * - Context 사용 없음
 */

'use client';

import { Box } from '@/components/ui/box';

import {
  ScriptTranscriptItemView,
  type ScriptTranscriptSegment,
} from './script-transcript-item.view';

export interface ScriptTranscriptViewProps {
  transcript: ScriptTranscriptSegment[] | undefined;
  youtubeTitle: string | undefined;
  onTimeClick: (seconds: number) => void;
  onAddQuote: (text: string, timestamp: number, segmentIndex: number) => void | Promise<void>;
  loadingSegmentIndex: number | null;
  readonly?: boolean;
}

export function ScriptTranscriptView({
  transcript,
  youtubeTitle,
  onTimeClick,
  onAddQuote,
  loadingSegmentIndex,
  readonly = false,
}: ScriptTranscriptViewProps) {
  if (!transcript || transcript.length === 0) {
    return null;
  }

  return (
    <Box className="space-y-2">
      {transcript.map((segment, index) => (
        <ScriptTranscriptItemView
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
