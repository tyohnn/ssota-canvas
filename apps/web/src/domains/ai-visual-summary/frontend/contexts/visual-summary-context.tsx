/**
 * Visual Summary Context
 *
 * Visual summary 실행 상태를 전역으로 관리하는 컨텍스트
 * 로직은 useVisualSummary hook에 있습니다.
 */

'use client';

import React, { createContext, useContext } from 'react';
import { useVisualSummary, type StatusOperationType } from '../hooks/use-visual-summary';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import type { VisualTemplate } from '../../shared/types/template.types';
import type { QueueTodo } from '@workspace/ui/components/ai-elements/queue';
import type { UIMessage } from 'ai';

interface VisualSummaryContextValue {
  // Actions
  generateVisualSummary: (params: {
    summary: string;
    template: VisualTemplate;
    sourceBlockId: string;
    sourceBlockPosition: { x: number; y: number };
    sourceBlockSize: { width: number; height: number };
  }) => void;
  /** 상태창 닫기 (숨김) */
  dismissStatusWindow: () => void;

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

const VisualSummaryContext = createContext<VisualSummaryContextValue | null>(null);

interface VisualSummaryProviderProps {
  children: React.ReactNode;
}

/**
 * Visual Summary Provider
 *
 * Visual summary 실행 상태를 관리합니다.
 * 로직은 useVisualSummary hook에 있습니다.
 */
export function VisualSummaryProvider({ children }: VisualSummaryProviderProps) {
  const { pageId } = useCanvasMetadata();

  // useVisualSummary hook 사용 (pageId만 필요)
  const visualSummaryHook = useVisualSummary({ pageId });

  const value: VisualSummaryContextValue = {
    generateVisualSummary: visualSummaryHook.generateVisualSummary,
    dismissStatusWindow: visualSummaryHook.dismissStatusWindow,
    isGenerating: visualSummaryHook.isGenerating,
    error: visualSummaryHook.error,
    todos: visualSummaryHook.todos,
    messages: visualSummaryHook.messages,
    currentRunSourceBlockId: visualSummaryHook.currentRunSourceBlockId,
    windowDismissed: visualSummaryHook.windowDismissed,
    statusOperationType: visualSummaryHook.statusOperationType,
    statusTemplateName: visualSummaryHook.statusTemplateName,
  };

  return <VisualSummaryContext.Provider value={value}>{children}</VisualSummaryContext.Provider>;
}

/**
 * Hook to access Visual Summary context
 */
export function useVisualSummaryContext(): VisualSummaryContextValue {
  const context = useContext(VisualSummaryContext);
  if (!context) {
    throw new Error('useVisualSummaryContext must be used within VisualSummaryProvider');
  }
  return context;
}
