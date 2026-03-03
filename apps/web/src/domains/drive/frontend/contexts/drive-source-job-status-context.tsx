/**
 * Drive Source Job Status Context
 *
 * Drive에서 소스 추가 시 source job Realtime 추적 및 AI status 창 표시.
 * useStatusJob (packages/ui) 사용, Drive 전용 openResource(router.push).
 */

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

import {
  useStatusJob,
  type StatusJob,
} from '@workspace/ui/components/ssota-ui/status-window';
import { useStatusJobDeps } from '@/domains/ai-actions/frontend/hooks/use-status-job-deps';

export interface DriveSourceJobStatusContextValue {
  openResource: (blockId: string) => void;
  pushSummaryJob: (
    blockId: string,
    workspaceId: string,
    options?: { resourceTitle?: string; language?: string }
  ) => void;
  updateJob: (id: string, patch: Partial<StatusJob>) => void;
  dismissJob: (id: string) => void;
  toggleExpandedJobId: (id: string) => void;

  jobs: StatusJob[];
  expandedJobIds: string[];
  isGenerating: boolean;
  windowDismissed: boolean;
  showStatusWindow: () => void;
  dismissStatusWindow: () => void;
  reportInitialNoContent: () => void;
}

const DriveSourceJobStatusContext =
  createContext<DriveSourceJobStatusContextValue | null>(null);

interface DriveSourceJobStatusProviderProps {
  children: React.ReactNode;
  orgId: string;
}

export function DriveSourceJobStatusProvider({
  children,
  orgId,
}: DriveSourceJobStatusProviderProps) {
  const router = useRouter();
  const [windowDismissed, setWindowDismissed] = useState(false);

  const openResource = useCallback(
    (blockId: string) => {
      router.push(`/r/${orgId}/drive/${blockId}`);
    },
    [orgId, router]
  );

  const showStatusWindow = useCallback(() => {
    setWindowDismissed(false);
  }, []);

  const deps = useStatusJobDeps();

  const summaryJobStatus = useStatusJob({
    deps,
    onJobCompleted: (blockId) => openResource(blockId),
    onShowStatusWindow: showStatusWindow,
  });

  const dismissStatusWindow = useCallback(() => {
    setWindowDismissed(true);
  }, []);

  const pushSummaryJob = useCallback(
    (
      blockId: string,
      workspaceId: string,
      options?: { resourceTitle?: string; language?: string }
    ) => {
      summaryJobStatus.registerSummaryJob({
        blockId,
        workspaceId,
        options,
      });
    },
    [summaryJobStatus.registerSummaryJob]
  );

  const initialNoContentDismissedRef = useRef(false);
  const reportInitialNoContent = useCallback(() => {
    if (initialNoContentDismissedRef.current) return;
    initialNoContentDismissedRef.current = true;
    dismissStatusWindow();
  }, [dismissStatusWindow]);

  const value: DriveSourceJobStatusContextValue = {
    openResource,
    pushSummaryJob,
    updateJob: summaryJobStatus.updateJob,
    dismissJob: summaryJobStatus.dismissJob,
    toggleExpandedJobId: summaryJobStatus.toggleExpandedJobId,
    jobs: summaryJobStatus.jobs,
    expandedJobIds: summaryJobStatus.expandedJobIds,
    isGenerating: summaryJobStatus.isGenerating,
    windowDismissed,
    showStatusWindow,
    dismissStatusWindow,
    reportInitialNoContent,
  };

  return (
    <DriveSourceJobStatusContext.Provider value={value}>
      {children}
    </DriveSourceJobStatusContext.Provider>
  );
}

export function useDriveSourceJobStatusContext(): DriveSourceJobStatusContextValue {
  const context = useContext(DriveSourceJobStatusContext);
  if (!context) {
    throw new Error(
      'useDriveSourceJobStatusContext must be used within DriveSourceJobStatusProvider'
    );
  }
  return context;
}
