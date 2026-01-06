'use client';

import { createContext, useContext } from 'react';

import { UIMessage } from 'ai';

import { AgentState } from './types';

/**
 * AIAgentRunner Context Value
 * 서브 컴포넌트 간 상태 공유
 */
export interface AIAgentRunnerContextValue {
  // Agent 상태
  messages: UIMessage[];
  agentState: AgentState;

  // UI 상태
  isHovered: boolean;
  isFocused: boolean;

  // 액션
  sendMessage: (text: string) => void;
  setHovered: (hovered: boolean) => void;
  focusConversation: () => void;
}

/**
 * AIAgentRunner Context
 * 내부 서브 컴포넌트에서만 사용 (외부 노출 안 함)
 */
export const AIAgentRunnerContext =
  createContext<AIAgentRunnerContextValue | null>(null);

/**
 * useAIAgentRunnerContext
 * Context Hook (서브 컴포넌트에서 사용)
 */
export function useAIAgentRunnerContext(): AIAgentRunnerContextValue {
  const context = useContext(AIAgentRunnerContext);

  if (!context) {
    throw new Error(
      'useAIAgentRunnerContext must be used within AIAgentRunnerProvider'
    );
  }

  return context;
}
