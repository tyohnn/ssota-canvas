/**
 * AI Action Context
 *
 * Job 단위로 상태창 관리. jobs[] (StatusJob) + pushJob/updateJob/dismissJob.
 * 새로고침 시 진행 중인 summary job 전체 복원, Realtime 다중 구독.
 */

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useVisualSummary } from '../hooks/use-visual-summary';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import {
  useMultiSourceJobRealtime,
  type SourceJob,
} from '@/domains/source-management/frontend/hooks';
import { createOnSummaryJobCompleted } from '@/domains/source-management/frontend/handlers/handle-summary-job-completion';
import { getInProgressSourceJobAction } from '@/domains/source-management/actions/summary/get-in-progress-source-job.action';
import { getLatestSourceJobByBlockIdAction } from '@/domains/source-management/actions/summary/get-latest-source-job-by-block-id.action';
import { isSuccess } from '@/lib';
import { isTempPageId } from '@/domains/workspace-management/shared/utils/temp-page-id.utils';
import type { VisualTemplate } from '../../shared/types/template.types';
import type { StatusJob } from '../../shared/types/status-job.types';
import type { UIMessage } from 'ai';

const AUTO_SUMMARY_TODO_ID = 'auto-summary';

function sourceJobStatusToStatusJobStatus(
  s: string
): StatusJob['status'] {
  if (s === 'pending' || s === 'processing') return 'running';
  if (s === 'completed') return 'completed';
  if (s === 'failed') return 'failed';
  return 'running';
}

function getTaskDescription(raw: SourceJob): string {
  if ('current_step' in raw && raw.current_step === 'extracting') {
    return 'Extracting script...';
  }
  if ('current_step' in raw && raw.current_step === 'summarizing') {
    return 'Generating summary...';
  }
  return 'Generating summary...';
}

interface AIActionContextValue {
  generateVisualSummary: (params: {
    summary: string;
    template: VisualTemplate;
    sourceBlockId: string;
    sourceBlockPosition: { x: number; y: number };
    sourceBlockSize: { width: number; height: number };
    sourceTitle?: string;
    sourceChannelName?: string;
  }) => void;
  dismissStatusWindow: () => void;
  showStatusWindow: () => void;
  setAutoSummaryBlockId: (blockId: string | null) => void;
  reportInitialNoContent: () => void;

  pushJob: (job: Omit<StatusJob, 'id' | 'createdAt'>) => string;
  updateJob: (id: string, patch: Partial<StatusJob>) => void;
  dismissJob: (id: string) => void;
  /** Toggle one job's accordion open/closed; multiple can be open. */
  toggleExpandedJobId: (id: string) => void;

  jobs: StatusJob[];
  expandedJobIds: string[];
  /** True if any job is running or pending (for block loading indicator). */
  isGenerating: boolean;
  messages: UIMessage[];
  currentRunSourceBlockId: string | null;
  windowDismissed: boolean;
}

const AIActionContext = createContext<AIActionContextValue | null>(null);

interface AIActionProviderProps {
  children: React.ReactNode;
}

/** blockId가 UUID(36자)이면 slug(앞 8자)로 변환 */
function toBlockSlug(blockId: string): string {
  if (blockId.length >= 36 && blockId.includes('-')) {
    return blockId.slice(0, 8);
  }
  return blockId;
}

export function AIActionProvider({ children }: AIActionProviderProps) {
  const queryClient = useQueryClient();
  const { pageId, workspaceId } = useCanvasMetadata();
  const [jobs, setJobs] = useState<StatusJob[]>([]);

  const onSummaryJobCompleted = useMemo(
    () => createOnSummaryJobCompleted(queryClient),
    [queryClient]
  );
  const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);

  const pushJob = useCallback(
    (job: Omit<StatusJob, 'id' | 'createdAt'>): string => {
      const id = `job-${Math.random().toString(36).slice(2, 11)}`;
      const full: StatusJob = {
        ...job,
        id,
        createdAt: Date.now(),
      };
      setJobs(prev => [full, ...prev]);
      setExpandedJobIds(prev => (prev.includes(id) ? prev : [...prev, id]));
      return id;
    },
    []
  );

  const updateJob = useCallback((id: string, patch: Partial<StatusJob>) => {
    setJobs(prev =>
      prev.map(j => (j.id === id ? { ...j, ...patch } : j))
    );
  }, []);

  const dismissJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    setExpandedJobIds(prev => prev.filter(x => x !== id));
  }, []);

  const toggleExpandedJobId = useCallback((id: string) => {
    setExpandedJobIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const visualSummaryHook = useVisualSummary({ pageId, pushJob, updateJob });

  const summaryBlockIds = jobs
    .filter(
      j =>
        j.type === 'summary' &&
        (j.status === 'running' || j.status === 'pending')
    )
    .map(j => j.sourceBlockId);

  const onJobUpdate = useCallback(
    (blockId: string, raw: SourceJob) => {
      if (raw.status === 'completed') {
        onSummaryJobCompleted(blockId, raw);
      }
      setJobs(prev => {
        const idx = prev.findIndex(
          j => j.type === 'summary' && j.sourceBlockId === blockId
        );
        if (idx === -1) return prev;
        const job = prev[idx];
        if (!job) return prev;
        const status = sourceJobStatusToStatusJobStatus(raw.status);
        const taskDesc = getTaskDescription(raw);
        const next = [...prev];
        next[idx] = {
          id: job.id,
          type: job.type,
          status,
          error:
            raw.error_message && status === 'failed'
              ? new Error(raw.error_message)
              : null,
          tasks:
            status === 'running' || status === 'pending'
              ? [
                {
                  id: AUTO_SUMMARY_TODO_ID,
                  title: 'Auto Summary',
                  description: taskDesc,
                  status: 'pending' as const,
                },
              ]
              : [
                {
                  id: AUTO_SUMMARY_TODO_ID,
                  title: 'Auto Summary',
                  description:
                    status === 'failed'
                      ? raw.error_message ?? 'Failed'
                      : 'Summary ready',
                  status: 'completed' as const,
                },
              ],
          sourceBlockId: job.sourceBlockId,
          templateName: job.templateName,
          createdAt: job.createdAt,
        };
        return next;
      });
    },
    [onSummaryJobCompleted]
  );

  useMultiSourceJobRealtime(summaryBlockIds, onJobUpdate);

  // Polling fallback: Realtime이 등록된 block에 대해서만 주기적으로 최신 상태 동기화 (main 등 Realtime 미전달 환경 대응)
  useEffect(() => {
    if (!workspaceId || summaryBlockIds.length === 0) return;

    const POLL_INTERVAL_MS = 3000;
    const intervalId = setInterval(() => {
      summaryBlockIds.forEach(blockId => {
        const blockSlug = toBlockSlug(blockId);
        getLatestSourceJobByBlockIdAction({ workspaceId, blockId: blockSlug })
          .then(result => {
            if (result.success && result.data?.job) {
              const job = result.data.job as SourceJob;
              onJobUpdate(job.block_id, job);
            }
          })
          .catch(() => {});
      });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [workspaceId, summaryBlockIds.join(','), onJobUpdate]);

  useEffect(() => {
    if (!pageId || isTempPageId(pageId)) return;
    getInProgressSourceJobAction({ pageId }).then(sourceResult => {
      const sourceJobs = isSuccess(sourceResult) ? sourceResult.data.jobs : [];
      if (!sourceJobs.length) return;
      const initialJobs: StatusJob[] = sourceJobs.map(j => ({
        id: `summary-${j.block_id}-${j.id}`,
        type: 'summary' as const,
        status: sourceJobStatusToStatusJobStatus(j.status),
        tasks: [
          {
            id: AUTO_SUMMARY_TODO_ID,
            title: 'Auto Summary',
            description:
              j.current_step === 'extracting'
                ? 'Extracting script...'
                : j.current_step === 'summarizing'
                  ? 'Generating summary...'
                  : 'Generating summary...',
            status: 'pending' as const,
          },
        ],
        error: j.error_message ? new Error(j.error_message) : null,
        sourceBlockId: j.block_id,
        createdAt: Date.now(),
      }));
      setJobs(prev => {
        const visualJobs = prev.filter(j => j.type === 'visual-summary');
        return [...initialJobs, ...visualJobs];
      });
      setExpandedJobIds(initialJobs.map(j => j.id));
      visualSummaryHook.showStatusWindow();
    });
  }, [pageId]);

  const setAutoSummaryBlockIdWithOpen = useCallback(
    (blockId: string | null) => {
      if (blockId) {
        const existingJob = jobs.find(
          j => j.type === 'summary' && j.sourceBlockId === blockId
        );
        if (!existingJob) {
          pushJob({
            type: 'summary',
            status: 'running',
            tasks: [
              {
                id: AUTO_SUMMARY_TODO_ID,
                title: 'Auto Summary',
                description: 'Generating summary...',
                status: 'pending',
              },
            ],
            error: null,
            sourceBlockId: blockId,
          });
        } else if (
          existingJob.status === 'completed' ||
          existingJob.status === 'failed'
        ) {
          updateJob(existingJob.id, {
            status: 'running',
            error: null,
            tasks: [
              {
                id: AUTO_SUMMARY_TODO_ID,
                title: 'Auto Summary',
                description: 'Generating summary...',
                status: 'pending',
              },
            ],
          });
        }
        visualSummaryHook.showStatusWindow();

        // 요약이 이미 있으면 Realtime 이벤트 없이 completed 상태 즉시 동기화
        if (workspaceId) {
          const blockSlug = toBlockSlug(blockId);
          getLatestSourceJobByBlockIdAction({ workspaceId, blockId: blockSlug })
            .then(result => {
              if (result.success && result.data?.job) {
                const job = result.data.job as SourceJob;
                onJobUpdate(job.block_id, job);
              }
            })
            .catch(() => {});
        }
      }
    },
    [jobs, pushJob, updateJob, visualSummaryHook.showStatusWindow, workspaceId, onJobUpdate]
  );

  const initialNoContentDismissedRef = useRef(false);
  const reportInitialNoContent = useCallback(() => {
    if (initialNoContentDismissedRef.current) return;
    initialNoContentDismissedRef.current = true;
    visualSummaryHook.dismissStatusWindow();
  }, [visualSummaryHook.dismissStatusWindow]);

  const runningJob = jobs.find(
    j => j.status === 'running' || j.status === 'pending'
  );
  const currentRunSourceBlockId =
    runningJob?.sourceBlockId ??
    visualSummaryHook.currentRunSourceBlockId ??
    null;

  const isGenerating = jobs.some(
    j => j.status === 'running' || j.status === 'pending'
  );

  const value: AIActionContextValue = {
    generateVisualSummary: visualSummaryHook.generateVisualSummary,
    dismissStatusWindow: visualSummaryHook.dismissStatusWindow,
    showStatusWindow: visualSummaryHook.showStatusWindow,
    setAutoSummaryBlockId: setAutoSummaryBlockIdWithOpen,
    reportInitialNoContent,
    pushJob,
    updateJob,
    dismissJob,
    toggleExpandedJobId,
    jobs,
    expandedJobIds,
    isGenerating,
    messages: visualSummaryHook.messages,
    currentRunSourceBlockId,
    windowDismissed: visualSummaryHook.windowDismissed,
  };

  return (
    <AIActionContext.Provider value={value}>{children}</AIActionContext.Provider>
  );
}

export function useAIActionContext(): AIActionContextValue {
  const context = useContext(AIActionContext);
  if (!context) {
    throw new Error('useAIActionContext must be used within AIActionProvider');
  }
  return context;
}
