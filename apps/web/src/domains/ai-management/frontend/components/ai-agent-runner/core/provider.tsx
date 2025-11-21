'use client';

import { AIAgentRunnerContext } from './ai-agent-runner.context';
import { useAIAgent } from './use-ai-agent';
import { AIAgentRunnerProps } from './types';
import { AIAgentBusinessLogic } from './use-ai-agent.business';

/**
 * AIAgentRunnerProvider Props
 */
export interface AIAgentRunnerProviderProps extends AIAgentRunnerProps {
  children: React.ReactNode;
  businessLogic?: AIAgentBusinessLogic; // Optional injection
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
  businessLogic,
  ...props
}: AIAgentRunnerProviderProps) {
  const agentState = useAIAgent({
    ...props,
    businessLogic,
  });

  return (
    <AIAgentRunnerContext.Provider value={agentState}>
      {children}
    </AIAgentRunnerContext.Provider>
  );
}
