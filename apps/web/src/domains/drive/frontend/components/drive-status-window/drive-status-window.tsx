/**
 * Drive Status Window
 *
 * Drive에서 사용하는 Status 창. DriveSourceJobStatusContext 위임.
 * ssota-ui StatusWindowView 사용 (jobs는 이미 resourceId 포함).
 */

'use client';

import { useEffect } from 'react';

import { StatusWindowView } from '@workspace/ui/components/ssota-ui/status-window';
import { useDriveSourceJobStatusContext } from '../../contexts/drive-source-job-status-context';

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

  useEffect(() => {
    if (!hasContent) reportInitialNoContent();
  }, [hasContent, reportInitialNoContent]);

  if (windowDismissed) return null;

  return (
    <StatusWindowView
      jobs={jobs}
      expandedJobIds={expandedJobIds}
      onDismissJob={dismissJob}
      onToggleExpand={toggleExpandedJobId}
      onDismiss={handleDismiss}
      onOpenResource={openResource}
    />
  );
}
