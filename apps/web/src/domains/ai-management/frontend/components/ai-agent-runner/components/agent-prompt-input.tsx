'use client';

import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  PromptInputBody,
} from '@workspace/ui/components/ai-elements/prompt-input';
import { useAIAgentRunnerContext } from '../core/ai-agent-runner.context';

/**
 * AgentPromptInput Props
 * NoCode 호환: 단순 값만
 */
export interface AgentPromptInputProps {
  placeholder?: string;
  className?: string;
}

/**
 * AgentPromptInput
 * PromptInput 컴포넌트 래퍼
 *
 * Context에서 자동으로 상태를 가져옴
 * NoCode 호환: 함수 Props 없음
 */
export function AgentPromptInput({
  placeholder = 'Ask AI to perform a task...',
  className,
}: AgentPromptInputProps) {
  const { sendMessage, agentState } = useAIAgentRunnerContext();

  return (
    <PromptInput
      onSubmit={(message: any) => sendMessage(message.text)}
      className={className}
    >
      <PromptInputBody>
        <PromptInputTextarea
          placeholder={placeholder}
          disabled={agentState.isRunning}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputSubmit disabled={agentState.isRunning} />
      </PromptInputFooter>
    </PromptInput>
  );
}
