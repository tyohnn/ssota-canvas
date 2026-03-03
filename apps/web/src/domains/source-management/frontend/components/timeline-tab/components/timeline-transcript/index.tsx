/**
 * Timeline Transcript
 *
 * Container Component: Hook → Props 변환
 * 타임라인 스크립트 트랜스크립트를 표시하는 컴포넌트
 */

'use client';

import { useTimelineTranscript } from './core/use-timeline-transcript';
import {
  TimelineTranscriptView,
  type TimelineTranscriptSegment,
} from './components';

export interface TimelineTranscriptProps {
  transcript: TimelineTranscriptSegment[] | undefined;
  sourceTitle: string | undefined;
  blockMountId?: string;
  blockData?: unknown;
  switchToTab?: (tabId: string) => void;
}

export function TimelineTranscript({
  transcript,
  sourceTitle,
  blockMountId,
  blockData,
  switchToTab,
}: TimelineTranscriptProps) {
  const {
    handleTimeClick,
    handleAddQuote,
    loadingSegmentIndex,
    readonly,
  } = useTimelineTranscript({
    sourceTitle,
    blockMountId,
    blockData,
    switchToTab,
  });

  return (
    <TimelineTranscriptView
      transcript={transcript}
      sourceTitle={sourceTitle}
      onTimeClick={handleTimeClick}
      onAddQuote={handleAddQuote}
      loadingSegmentIndex={loadingSegmentIndex}
      readonly={readonly}
    />
  );
}

export { TimelineTranscriptView, TimelineTranscriptItemView } from './components';
export type {
  TimelineTranscriptViewProps,
  TimelineTranscriptItemViewProps,
  TimelineTranscriptSegment,
} from './components';
