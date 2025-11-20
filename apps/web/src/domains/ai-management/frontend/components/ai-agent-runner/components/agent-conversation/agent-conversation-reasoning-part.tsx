/**
 * AgentConversationReasoningPart
 * Reasoning Part 렌더링 컴포넌트
 *
 * AI의 추론 과정을 Reasoning 컴포넌트로 표시
 * 스트리밍 중: 자동 펼침, 완료 후: 자동 접힘
 */

import { memo } from 'react';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@workspace/ui/components/ai-elements/reasoning';
import type { ReasoningPartProps } from './types';

export const AgentConversationReasoningPart = memo(
  function AgentConversationReasoningPart({
    part,
    partIndex,
    message,
    messages,
    isAgentRunning,
  }: ReasoningPartProps) {
  if (part.type !== 'reasoning') {
    return null;
  }

  // 스트리밍 중인지 확인 (마지막 메시지의 마지막 part)
  const isLastMessage = message.id === messages[messages.length - 1]?.id;
  const isLastPart = partIndex === message.parts.length - 1;
  const isStreaming = isAgentRunning && isLastMessage && isLastPart;

  return (
    <Reasoning isStreaming={isStreaming} className="w-full">
      <ReasoningTrigger />
      <ReasoningContent>{part.text || '추론 중...'}</ReasoningContent>
    </Reasoning>
  );
  }
);
