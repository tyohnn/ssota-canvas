/**
 * TimelineTab
 *
 * Container + Hook + View를 묶은 통합 컴포넌트.
 * blockSlug, sourceId, sourceTitle만 넘기면 됨.
 */

'use client';

import { useSourceTimelineTab } from './core/use-source-timeline-tab';
import { TimelineTabView } from './components/timeline-tab-view';
import type { UseSourceTimelineTabParams } from './core/types';

export interface TimelineTabProps extends UseSourceTimelineTabParams {}

export function TimelineTab({
  blockSlug,
  sourceId,
  sourceTitle,
}: TimelineTabProps) {
  const business = useSourceTimelineTab({
    blockSlug,
    sourceId,
    sourceTitle,
  });

  return (
    <TimelineTabView
      sourceTitle={business.sourceTitle}
      script={business.script}
      extractedAt={business.extractedAt}
      isLoading={business.isLoading}
      error={business.error}
      onExtractScript={business.handleExtractScript}
      isExtracting={business.isExtracting}
    />
  );
}
