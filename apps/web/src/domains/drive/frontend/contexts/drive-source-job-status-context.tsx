/**
 * Drive Source Job Status Context
 *
 * Drive에서 소스 추가 시 source job Realtime 추적 및 AI status 창 표시.
 * Canvas AIActionProvider와 동일한 Realtime 로직, Drive 전용 openResource(router.push).
 */

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

import {
  useMultiSourceJobRealtime,
  type SourceJob,
} from '@/domains/source-management/frontend/hooks';
import { getLatestSourceJobByBlockIdAction } from '@/domains/source-management/actions/summary/get-latest-source-job-by-block-id.action';
import {
  createStatusJobPatchFromSourceJob,
  getAutoSummaryTaskTitle,
} from '@/domains/ai-actions/shared/utils/source-job-to-status-job';
import type { StatusJob } from '@/domains/ai-actions/shared/types/status-job.types';

const AUTO_SUMMARY_TODO_ID = 'auto-summary';

function toBlockSlug(blockId: string): string {
  if (blockId.length >= 36 && blockId.includes('-')) {
    return blockId.slice(0, 8);
  }
  return blockId;
}

export interface DriveSourceJobStatusContextValue {
  /** Drive에서 block 열기 (router.push) */
  openResource: (blockId: string) => void;
  /** summary job 등록 + Realtime 구독 시작 */
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
  const [jobs, setJobs] = useState<StatusJob[]>([]);
  const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);
  const [windowDismissed, setWindowDismissed] = useState(false);

  const openResource = useCallback(
    (blockId: string) => {
      router.push(`/r/${orgId}/drive/${blockId}`);
    },
    [orgId, router]
  );

  const onJobUpdateRef = useRef<(blockId: string, raw: SourceJob) => void>(
    () => {}
  );

  const pushSummaryJob = useCallback(
    (
      blockId: string,
      workspaceId: string,
      options?: { resourceTitle?: string; language?: string }
    ) => {
      const lang = options?.language ?? 'en';
      const taskTitle = getAutoSummaryTaskTitle(lang);
      setJobs((prev) => {
        const existingJob = prev.find(
          (j) => j.type === 'summary' && j.sourceBlockId === blockId
        );
        if (existingJob) {
          if (
            existingJob.status === 'completed' ||
            existingJob.status === 'failed'
          ) {
            return prev.map((j) =>
              j.id === existingJob.id
                ? {
                    ...j,
                    status: 'running' as const,
                    error: null,
                    resourceTitle: options?.resourceTitle ?? j.resourceTitle,
                    language: lang,
                    tasks: [
                      {
                        id: AUTO_SUMMARY_TODO_ID,
                        title: taskTitle,
                        description: 'Generating summary...',
                        status: 'pending' as const,
                      },
                    ],
                  }
                : j
            );
          }
          return prev;
        }
        const id = `summary-${blockId}-${Date.now()}`;
        const job: StatusJob = {
          id,
          type: 'summary',
          status: 'running',
          tasks: [
            {
              id: AUTO_SUMMARY_TODO_ID,
              title: taskTitle,
              description: 'Generating summary...',
              status: 'pending',
            },
          ],
          error: null,
          sourceBlockId: blockId,
          resourceTitle: options?.resourceTitle,
          language: lang,
          createdAt: Date.now(),
        };
        setExpandedJobIds((p) => (p.includes(id) ? p : [...p, id]));
        return [job, ...prev];
      });
      setWindowDismissed(false);

      // 즉시 completed 상태 동기화 (Realtime 미전달 환경 대응)
      const blockSlug = toBlockSlug(blockId);
      getLatestSourceJobByBlockIdAction({ workspaceId, blockId: blockSlug })
        .then((result) => {
          if (result.success && result.data?.job) {
            const raw = result.data.job as SourceJob;
            onJobUpdateRef.current(blockId, raw);
          }
        })
        .catch(() => {});
    },
    []
  );

  const updateJob = useCallback((id: string, patch: Partial<StatusJob>) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...patch } : j))
    );
  }, []);

  const dismissJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setExpandedJobIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const toggleExpandedJobId = useCallback((id: string) => {
    setExpandedJobIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const showStatusWindow = useCallback(() => {
    setWindowDismissed(false);
  }, []);

  const dismissStatusWindow = useCallback(() => {
    setWindowDismissed(true);
  }, []);

  const initialNoContentDismissedRef = useRef(false);
  const reportInitialNoContent = useCallback(() => {
    if (initialNoContentDismissedRef.current) return;
    initialNoContentDismissedRef.current = true;
    dismissStatusWindow();
  }, [dismissStatusWindow]);

  const summaryBlockIds = jobs
    .filter(
      (j) =>
        j.type === 'summary' &&
        (j.status === 'running' || j.status === 'pending')
    )
    .map((j) => j.sourceBlockId);

  const onJobUpdate = useCallback(
    (blockId: string, raw: SourceJob) => {
      if (raw.status === 'completed') {
        openResource(blockId);
      }
      setJobs((prev) => {
        const idx = prev.findIndex(
          (j) => j.type === 'summary' && j.sourceBlockId === blockId
        );
        if (idx === -1) return prev;
        const job = prev[idx];
        if (!job) return prev;
        const patch = createStatusJobPatchFromSourceJob({
          raw,
          existingJob: {
            id: job.id,
            type: job.type,
            sourceBlockId: job.sourceBlockId,
            templateName: job.templateName,
            resourceTitle: job.resourceTitle,
            language: job.language,
            createdAt: job.createdAt,
          },
        });
        const next = [...prev];
        next[idx] = { ...job, ...patch };
        return next;
      });
    },
    [openResource]
  );

  onJobUpdateRef.current = onJobUpdate;

  useMultiSourceJobRealtime(summaryBlockIds, onJobUpdate);

  const isGenerating = jobs.some(
    (j) => j.status === 'running' || j.status === 'pending'
  );

  const value: DriveSourceJobStatusContextValue = {
    openResource,
    pushSummaryJob,
    updateJob,
    dismissJob,
    toggleExpandedJobId,
    jobs,
    expandedJobIds,
    isGenerating,
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
