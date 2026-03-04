'use client';

import type { TimelineTabViewProps } from '../types';
import { TimelineContent } from './timeline-content';
import {
  TimelineErrorState,
  TimelineLoadingState,
  TimelineNoScriptState,
} from './states';
import { TimelineTabContainer } from './timeline-tab-container';

export function TimelineTabView({
  sourceTitle,
  script,
  extractedAt,
  isLoading,
  error,
  onExtractScript,
  isExtracting,
  switchToTab,
  onTimeClick,
  onAddQuote,
  loadingSegmentIndex,
  readonly,
}: TimelineTabViewProps) {
  if (isLoading) {
    const isActuallyExtracting = isExtracting || (!script && isLoading);
    return (
      <TimelineTabContainer>
        <TimelineLoadingState isExtracting={isActuallyExtracting} />
      </TimelineTabContainer>
    );
  }

  if (error) {
    return (
      <TimelineTabContainer>
        <TimelineErrorState
          error={error}
          hasScript={!!script}
          onExtractScript={onExtractScript}
          isExtracting={isExtracting}
        />
      </TimelineTabContainer>
    );
  }

  if (!script) {
    return (
      <TimelineTabContainer>
        <TimelineNoScriptState onExtractScript={onExtractScript} isExtracting={isExtracting} />
      </TimelineTabContainer>
    );
  }

  return (
    <TimelineTabContainer>
      <TimelineContent
        script={script}
        sourceTitle={sourceTitle}
        extractedAt={extractedAt}
        onRefresh={onExtractScript}
        switchToTab={switchToTab}
        onTimeClick={onTimeClick}
        onAddQuote={onAddQuote}
        loadingSegmentIndex={loadingSegmentIndex}
        readonly={readonly}
      />
    </TimelineTabContainer>
  );
}
