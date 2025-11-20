'use client';

import { AIAgentRunnerProvider } from './core/provider';
import { AgentConversation } from './components/agent-conversation';
import { AgentPromptInput } from './components/agent-prompt-input';
import { AIAgentRunnerProps } from './core/types';
import { cn } from '@/lib/utils';
import { Box } from '@/components/ui/box';

/**
 * AIAgentRunner
 * AI Agent 실행 및 Conversation UI 통합 컴포넌트
 *
 * 구조:
 * - Provider (Context)
 * - AgentConversation (메시지 목록)
 * - AgentPromptInput (발화 입력)
 *
 * 특징:
 * - Props 전달 방식 (Context 없음)
 * - Compound Component Pattern
 * - Internal Context (외부 노출 안 함)
 * - NoCode 호환 (함수 Props 없음)
 *
 * 사용 예시:
 * <AIAgentRunner
 *   pageId={pageId}
 *   workspaceId={workspaceId}
 *   organizationId={organizationId}
 * />
 */
export function AIAgentRunner({
  pageId,
  workspaceId,
  organizationId,
}: AIAgentRunnerProps) {
  return (
    <AIAgentRunnerProvider
      pageId={pageId}
      workspaceId={workspaceId}
      organizationId={organizationId}
    >
      <Box
        className={cn(
          'ai-agent-runner',
          'w-96 max-h-[600px]',
          'flex flex-col gap-2'
        )}
      >
        <AgentConversation />
        <AgentPromptInput />
      </Box>
    </AIAgentRunnerProvider>
  );
}
