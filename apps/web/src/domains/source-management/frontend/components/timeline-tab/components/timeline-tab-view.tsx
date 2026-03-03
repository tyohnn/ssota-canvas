/**
 * Timeline Tab View
 *
 * Presentational 컴포넌트
 * source-management 타임라인 탭에서 공통으로 사용
 */

'use client';

import type { TimelineTabViewProps } from '../core/types';

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
  blockMountId,
  blockData,
  switchToTab,
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
        <TimelineNoScriptState
          onExtractScript={onExtractScript}
          isExtracting={isExtracting}
        />
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
        blockMountId={blockMountId}
        blockData={blockData}
        switchToTab={switchToTab}
      />
    </TimelineTabContainer>
  );
}
