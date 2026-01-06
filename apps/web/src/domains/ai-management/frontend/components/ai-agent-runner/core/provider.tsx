'use client';

import { AIAgentRunnerContext } from './ai-agent-runner.context';
import { useAIAgent } from './use-ai-agent';

/**
 * AIAgentRunnerProvider Props
 */
export interface AIAgentRunnerProviderProps {
  children: React.ReactNode;
}

/**
 * AIAgentRunnerProvider
 * Context Provider + 상태 관리
 *
 * 특징:
 * - Internal Context (외부 노출 안 함)
 * - useAIAgent Hook으로 상태 관리
 * - Optional business logic injection 지원
 */
export function AIAgentRunnerProvider({
  children,
}: AIAgentRunnerProviderProps) {
  const agentState = useAIAgent({});

  return (
    <AIAgentRunnerContext.Provider value={agentState}>
      {children}
    </AIAgentRunnerContext.Provider>
  );
}
