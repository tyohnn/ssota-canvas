/**
 * Drive Status Window
 *
 * Drive에서 사용하는 Status 창. DriveSourceJobStatusContext 위임.
 * ssota-ui StatusWindowView 사용 (sourceBlockId -> resourceId 매핑).
 */

'use client';

import { useEffect, useMemo } from 'react';

import {
  StatusWindowView,
  type StatusJob as SsotaStatusJob,
} from '@workspace/ui/components/ssota-ui/status-window';
import type { StatusJob } from '@/domains/ai-actions/shared/types/status-job.types';
import { useDriveSourceJobStatusContext } from '../../contexts/drive-source-job-status-context';

function toSsotaJobs(jobs: StatusJob[]): SsotaStatusJob[] {
  return jobs.map((j) => ({
    ...j,
    resourceId: j.sourceBlockId,
  })) as SsotaStatusJob[];
}

export interface DriveStatusWindowProps {
  onDismiss?: () => void;
}

export function DriveStatusWindow({ onDismiss }: DriveStatusWindowProps = {}) {
  const {
    jobs,
    expandedJobIds,
    dismissJob,
    toggleExpandedJobId,
    openResource,
    dismissStatusWindow,
    windowDismissed,
    reportInitialNoContent,
  } = useDriveSourceJobStatusContext();

  const handleDismiss = onDismiss ?? dismissStatusWindow;
  const hasContent = jobs.length > 0;
  const ssotaJobs = useMemo(() => toSsotaJobs(jobs), [jobs]);

  useEffect(() => {
    if (!hasContent) reportInitialNoContent();
  }, [hasContent, reportInitialNoContent]);

  if (windowDismissed) return null;

  return (
    <StatusWindowView
      jobs={ssotaJobs}
      expandedJobIds={expandedJobIds}
      onDismissJob={dismissJob}
      onToggleExpand={toggleExpandedJobId}
      onDismiss={handleDismiss}
      onOpenResource={openResource}
    />
  );
}
