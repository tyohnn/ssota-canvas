/**
 * TimelineTab
 *
 * Container: useSourceTimelineTab + useTimelineTranscript → package TimelineTabView
 */

'use client';

import {
  TimelineTabView,
  type TimelineScriptLike,
} from '@workspace/editor-panel';
import { useSourceTimelineTab } from './use-source-timeline-tab';
import { useTimelineTranscript } from './use-timeline-transcript';
import type { UseSourceTimelineTabParams } from './types';
import type {
  SourceTimelineTabRuntimeDeps,
  TimelineTranscriptRuntimeDeps,
} from '@/domains/source-management/frontend/adapters/contracts/runtime-deps';

export interface TimelineTabProps extends UseSourceTimelineTabParams {
  timelineTabDeps: SourceTimelineTabRuntimeDeps;
  transcriptDeps: TimelineTranscriptRuntimeDeps;
}

export function TimelineTab({
  blockSlug,
  sourceId,
  sourceTitle,
  blockMountId,
  blockData,
  switchToTab,
  timelineTabDeps,
  transcriptDeps: transcriptRuntimeDeps,
}: TimelineTabProps) {
  const business = useSourceTimelineTab(
    { blockSlug, sourceId, sourceTitle },
    timelineTabDeps
  );

  const transcriptDeps = useTimelineTranscript(
    {
      sourceTitle,
      blockMountId,
      blockData,
      switchToTab,
    },
    transcriptRuntimeDeps
  );

  return (
    <TimelineTabView
      sourceTitle={business.sourceTitle}
      script={business.script as TimelineScriptLike}
      extractedAt={business.extractedAt}
      isLoading={business.isLoading}
      error={business.error}
      onExtractScript={business.handleExtractScript}
      isExtracting={business.isExtracting}
      switchToTab={switchToTab}
      onTimeClick={transcriptDeps.handleTimeClick}
      onAddQuote={transcriptDeps.handleAddQuote}
      loadingSegmentIndex={transcriptDeps.loadingSegmentIndex}
      readonly={transcriptDeps.readonly}
    />
  );
}
