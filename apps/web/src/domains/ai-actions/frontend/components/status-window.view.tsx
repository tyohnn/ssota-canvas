/**
 * Status Window View Component (ai-actions adapter)
 *
 * ai-actions StatusJob (sourceBlockId) → ssota-ui StatusWindowView (resourceId) 호환 레이어.
 * 기존 MockStatusWindow 등 sourceBlockId 사용처 호환용.
 */

'use client';

import {
  StatusWindowView as SsotaStatusWindowView,
  type StatusJob as SsotaStatusJob,
} from '@workspace/ui/components/ssota-ui/status-window';
import type { StatusJob } from '../../shared/types/status-job.types';

export interface StatusWindowViewProps {
  jobs: StatusJob[];
  expandedJobIds: string[];
  onDismissJob: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onDismiss?: () => void;
  /** 호출부가 리소스 열기 동작 정의 (sourceBlockId 전달) */
  onOpenBlock?: (sourceBlockId: string) => void;
}

function toSsotaJobs(jobs: StatusJob[]): SsotaStatusJob[] {
  return jobs.map((j) => ({
    ...j,
    resourceId: j.sourceBlockId,
  })) as SsotaStatusJob[];
}

export function StatusWindowView({
  jobs,
  expandedJobIds,
  onDismissJob,
  onToggleExpand,
  onDismiss,
  onOpenBlock,
}: StatusWindowViewProps) {
  const ssotaJobs = toSsotaJobs(jobs);

  return (
    <SsotaStatusWindowView
      jobs={ssotaJobs}
      expandedJobIds={expandedJobIds}
      onDismissJob={onDismissJob}
      onToggleExpand={onToggleExpand}
      onDismiss={onDismiss}
      onOpenResource={onOpenBlock}
    />
  );
}
