/**
 * AI Action Context
 *
 * Job 단위로 상태창 관리. jobs[] (StatusJob) + pushJob/updateJob/dismissJob.
 * useStatusJob (packages/ui) 훅으로 공통 Realtime 로직 사용.
 */

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import { useReactFlow } from '@xyflow/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useStatusJob,
  type StatusJob,
} from '@workspace/ui/components/ssota-ui/status-window';
import { useVisualSummary } from '../hooks/use-visual-summary';
import { useStatusJobDeps } from '../hooks/use-status-job-deps';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { RawSourceJob } from '@workspace/ui/components/ssota-ui/status-window';
import { createOnSummaryJobCompleted } from '@/domains/source-management/frontend/handlers/handle-summary-job-completion';
import type { VisualTemplate } from '../../shared/types/template.types';
import type { UIMessage } from 'ai';

/** blockId가 UUID(36자)이면 slug(앞 8자)로 변환 */
function toBlockSlug(blockId: string): string {
  if (blockId.length >= 36 && blockId.includes('-')) {
    return blockId.slice(0, 8);
  }
  return blockId;
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
  toggleExpandedJobId: (id: string) => void;
  openBlockEditor: (sourceBlockId: string) => void;

  jobs: StatusJob[];
  expandedJobIds: string[];
  isGenerating: boolean;
  messages: UIMessage[];
  currentRunSourceBlockId: string | null;
  windowDismissed: boolean;
}

const AIActionContext = createContext<AIActionContextValue | null>(null);

interface AIActionProviderProps {
  children: React.ReactNode;
}

export function AIActionProvider({ children }: AIActionProviderProps) {
  const queryClient = useQueryClient();
  const { pageId, workspaceId } = useCanvasMetadata();
  const canvasMode = useCanvasModeContext();
  const { getNodes } = useReactFlow();

  const onSummaryJobCompleted = useMemo(
    () => createOnSummaryJobCompleted(queryClient),
    [queryClient]
  );

  const openBlockEditorRef = useRef<(sourceBlockId: string) => void>(() => {});
  const canvasModeRef = useRef(canvasMode);
  canvasModeRef.current = canvasMode;

  const showStatusWindowForRestoreRef = useRef<() => void>(() => {});
  const deps = useStatusJobDeps();

  const summaryJobStatus = useStatusJob({
    deps,
    onJobCompleted: useCallback(
      (blockId: string, raw: RawSourceJob) => {
        onSummaryJobCompleted(
          blockId,
          raw as unknown as Parameters<typeof onSummaryJobCompleted>[1]
        );
        if (canvasModeRef.current.mode.type !== 'block-editing') {
          openBlockEditorRef.current(blockId);
        }
      },
      [onSummaryJobCompleted]
    ),
    workspaceId,
    enablePolling: true,
    initialRestore: pageId
      ? {
          pageId,
          onComplete: () => showStatusWindowForRestoreRef.current(),
        }
      : undefined,
    onShowStatusWindow: undefined,
  });

  const visualSummaryHook = useVisualSummary({
    pageId,
    pushJob: summaryJobStatus.pushJob,
    updateJob: summaryJobStatus.updateJob,
  });

  showStatusWindowForRestoreRef.current = visualSummaryHook.showStatusWindow;

  const openBlockEditor = useCallback(
    (sourceBlockId: string) => {
      const sourceSlug = toBlockSlug(sourceBlockId);
      const nodes = getNodes();
      const node = nodes.find((n) => {
        const nodeBlockId = (n.data as BlockNodeData)?.blockId;
        if (!nodeBlockId) return false;
        return toBlockSlug(nodeBlockId) === sourceSlug;
      });
      if (node) {
        const blockId =
          (node.data as BlockNodeData)?.blockId ?? sourceBlockId;
        const blockType = (node.data as BlockNodeData)?.blockType;
        const hasSummaryTab =
          blockType &&
          ['youtube', 'link', 'pdf', 'audio', 'x'].includes(blockType);
        const initialTab = hasSummaryTab ? { tab: 'summary' } : undefined;
        canvasMode.enterBlockEditingMode(blockId, node.id, initialTab);
      }
    },
    [getNodes, canvasMode]
  );
  openBlockEditorRef.current = openBlockEditor;

  const setAutoSummaryBlockIdWithOpen = useCallback(
    (blockId: string | null) => {
      if (blockId && workspaceId) {
        summaryJobStatus.registerSummaryJob({
          blockId,
          workspaceId,
          options: {},
        });
        visualSummaryHook.showStatusWindow();
      }
    },
    [
      summaryJobStatus.registerSummaryJob,
      visualSummaryHook.showStatusWindow,
      workspaceId,
    ]
  );

  const initialNoContentDismissedRef = useRef(false);
  const reportInitialNoContent = useCallback(() => {
    if (initialNoContentDismissedRef.current) return;
    initialNoContentDismissedRef.current = true;
    visualSummaryHook.dismissStatusWindow();
  }, [visualSummaryHook.dismissStatusWindow]);

  const runningJob = summaryJobStatus.jobs.find(
    (j) => j.status === 'running' || j.status === 'pending'
  );
  const currentRunSourceBlockId =
    runningJob?.resourceId ??
    visualSummaryHook.currentRunSourceBlockId ??
    null;

  const value: AIActionContextValue = {
    generateVisualSummary: visualSummaryHook.generateVisualSummary,
    dismissStatusWindow: visualSummaryHook.dismissStatusWindow,
    showStatusWindow: visualSummaryHook.showStatusWindow,
    setAutoSummaryBlockId: setAutoSummaryBlockIdWithOpen,
    reportInitialNoContent,
    pushJob: summaryJobStatus.pushJob,
    updateJob: summaryJobStatus.updateJob,
    dismissJob: summaryJobStatus.dismissJob,
    toggleExpandedJobId: summaryJobStatus.toggleExpandedJobId,
    openBlockEditor,
    jobs: summaryJobStatus.jobs,
    expandedJobIds: summaryJobStatus.expandedJobIds,
    isGenerating: summaryJobStatus.isGenerating,
    messages: visualSummaryHook.messages,
    currentRunSourceBlockId,
    windowDismissed: visualSummaryHook.windowDismissed,
  };

  return (
    <AIActionContext.Provider value={value}>
      {children}
    </AIActionContext.Provider>
  );
}

export function useAIActionContext(): AIActionContextValue {
  const context = useContext(AIActionContext);
  if (!context) {
    throw new Error('useAIActionContext must be used within AIActionProvider');
  }
  return context;
}
