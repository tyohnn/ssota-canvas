/**
 * AI Action Context
 *
 * AI 액션(visual summary, 일반 summary, script 등) 실행 상태를 전역으로 관리하는 컨텍스트.
 * Status window를 범용으로 사용합니다. 로직은 useVisualSummary hook에 있습니다.
 * Auto summary job (YouTube block) 상태는 Realtime으로 연동됩니다.
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useVisualSummary, type StatusOperationType } from '../hooks/use-visual-summary';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useSummaryJobRealtime } from '@/domains/youtube-app-space/frontend/hooks';
import type { VisualTemplate } from '../../shared/types/template.types';
import type { QueueTodo } from '@workspace/ui/components/ai-elements/queue';
import type { UIMessage } from 'ai';

interface AIActionContextValue {
  // Actions
  generateVisualSummary: (params: {
    summary: string;
    template: VisualTemplate;
    sourceBlockId: string;
    sourceBlockPosition: { x: number; y: number };
    sourceBlockSize: { width: number; height: number };
    sourceTitle?: string;
    sourceChannelName?: string;
  }) => void;
  /** 상태창 닫기 (숨김) */
  dismissStatusWindow: () => void;
  /** Auto summary job 추적 시작 (YouTube 블록에서 job 생성 후 호출) */
  setAutoSummaryBlockId: (blockId: string | null) => void;

  // State
  isGenerating: boolean;
  error: Error | null;
  todos: QueueTodo[];
  messages: UIMessage[];
  /** 이번/마지막 실행을 시작한 블록 ID */
  currentRunSourceBlockId: string | null;
  /** 상태창이 사용자에 의해 닫혀 있는지 */
  windowDismissed: boolean;
  /** 현재/마지막 작업 유형 (상태창 라벨용) */
  statusOperationType: StatusOperationType | null;
  /** 비주얼 요약 시 선택된 템플릿 이름 */
  statusTemplateName: string | null;
}

const AIActionContext = createContext<AIActionContextValue | null>(null);

interface AIActionProviderProps {
  children: React.ReactNode;
}

const AUTO_SUMMARY_TODO_ID = 'auto-summary';

/**
 * AI Action Provider
 *
 * AI 액션 실행 상태를 관리합니다.
 * 로직은 useVisualSummary hook에 있습니다.
 * Auto summary job은 Realtime으로 상태를 받아 Status 창에 반영합니다.
 */
export function AIActionProvider({ children }: AIActionProviderProps) {
  const { pageId } = useCanvasMetadata();
  const [autoSummaryBlockId, setAutoSummaryBlockId] = useState<string | null>(null);

  const visualSummaryHook = useVisualSummary({ pageId });
  const summaryJobState = useSummaryJobRealtime(autoSummaryBlockId ?? '');

  // Auto summary job 완료/실패 시 추적 해제 (Status 창이 정리되도록)
  useEffect(() => {
    if (summaryJobState.isCompleted || summaryJobState.isFailed) {
      const t = setTimeout(() => setAutoSummaryBlockId(null), 2000);
      return () => clearTimeout(t);
    }
  }, [summaryJobState.isCompleted, summaryJobState.isFailed]);

  const isGenerating =
    visualSummaryHook.isGenerating || summaryJobState.isProcessing;
  const error =
    visualSummaryHook.error ??
    (summaryJobState.isFailed && summaryJobState.errorMessage
      ? new Error(summaryJobState.errorMessage)
      : null);
  const todos: QueueTodo[] = summaryJobState.isProcessing
    ? [
        {
          id: AUTO_SUMMARY_TODO_ID,
          title: 'Auto Summary',
          description: 'Generating summary...',
          status: 'pending',
        },
      ]
    : visualSummaryHook.todos;
  const statusOperationType: StatusOperationType | null =
    summaryJobState.isProcessing ? 'summary' : visualSummaryHook.statusOperationType;

  const value: AIActionContextValue = {
    generateVisualSummary: visualSummaryHook.generateVisualSummary,
    dismissStatusWindow: visualSummaryHook.dismissStatusWindow,
    setAutoSummaryBlockId,
    isGenerating,
    error,
    todos,
    messages: visualSummaryHook.messages,
    currentRunSourceBlockId:
      summaryJobState.isProcessing ? autoSummaryBlockId : visualSummaryHook.currentRunSourceBlockId,
    windowDismissed: visualSummaryHook.windowDismissed,
    statusOperationType,
    statusTemplateName: visualSummaryHook.statusTemplateName,
  };

  return <AIActionContext.Provider value={value}>{children}</AIActionContext.Provider>;
}

/**
 * Hook to access AI Action context
 */
export function useAIActionContext(): AIActionContextValue {
  const context = useContext(AIActionContext);
  if (!context) {
    throw new Error('useAIActionContext must be used within AIActionProvider');
  }
  return context;
}
