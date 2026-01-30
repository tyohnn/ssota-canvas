/**
 * AgentConversation
 * AI Agent의 Conversation UI 컴포넌트
 *
 * 역할:
 * - Message.parts 기반 렌더링
 * - Text, Tool, Reasoning, Step Start Part 처리
 * - Compound Component 패턴으로 각 Part 분리
 *
 * 아키텍처:
 * - Context에서 상태 가져옴 (NoCode 호환)
 * - Props 없음 (완전 자체 관리)
 * - 각 Part는 독립적인 컴포넌트로 분리
 *
 * @see Component Development Guidelines
 */

'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@workspace/ui/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
} from '@workspace/ui/components/ai-elements/message';
import { useAIAgentRunnerContext } from '../../core/ai-agent-runner.context';
import { cn } from '@/lib/utils';
import { AgentConversationTextPart } from './agent-conversation-text-part';
import { AgentConversationToolPart } from './agent-conversation-tool-part';
import { AgentConversationReasoningPart } from './agent-conversation-reasoning-part';
import { AgentConversationStepStartPart } from './agent-conversation-step-start-part';
import { AgentConversationDynamicToolPart } from './agent-conversation-dynamic-tool-part';

/**
 * AgentConversation
 * Context에서 자동으로 상태를 가져옴
 * NoCode 호환: Props 없음
 */
export function AgentConversation() {
  const { messages, isHovered, setHovered, agentState } =
    useAIAgentRunnerContext();

  // 메시지가 없으면 아예 렌더링하지 않음
  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'transition-all duration-300',
        isHovered ? 'h-[500px] opacity-100' : 'h-12 opacity-60',
        'bg-background border rounded-lg shadow-lg overflow-hidden'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Conversation className="h-full">
        <ConversationContent>
          {messages.map(message => (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {/* message.parts 기반 렌더링 */}
                {(message.parts || []).map((part, partIndex: number) => {
                  // 안정적인 key 생성: message.id + partIndex 조합
                  // toolCallId가 있으면 사용, 없으면 fallback
                  const partKey =
                    (part as any).toolCallId ||
                    `${message.id}-part-${partIndex}`;

                  // Text Part
                  if (part.type === 'text') {
                    return (
                      <AgentConversationTextPart
                        key={partKey}
                        part={part}
                        partIndex={partIndex}
                        message={message}
                      />
                    );
                  }

                  // Tool Part (Task 컴포넌트로 표현)
                  const isToolPart =
                    part.type === 'tool-addBlock' ||
                    part.type === 'tool-deleteBlock' ||
                    part.type === 'tool-updateProperty' ||
                    part.type === 'tool-connectBlocks' ||
                    part.type === 'tool-executeBlockAction' ||
                    part.type === 'tool-searchByKeyword' ||
                    part.type === 'tool-searchByHop' ||
                    part.type === 'tool-searchBySemantic' ||
                    part.type === 'tool-searchBlockTypes';

                  if (isToolPart) {
                    return (
                      <AgentConversationToolPart
                        key={partKey}
                        part={part}
                        partIndex={partIndex}
                        message={message}
                        messages={messages}
                      />
                    );
                  }

                  // Reasoning Part
                  if (part.type === 'reasoning') {
                    return (
                      <AgentConversationReasoningPart
                        key={partKey}
                        part={part}
                        partIndex={partIndex}
                        message={message}
                        messages={messages}
                        isAgentRunning={agentState.isRunning}
                      />
                    );
                  }

                  // Step Start Part
                  if (part.type === 'step-start') {
                    return (
                      <AgentConversationStepStartPart
                        key={partKey}
                        part={part}
                        partIndex={partIndex}
                      />
                    );
                  }

                  // Dynamic Tool Part
                  if (part.type === 'dynamic-tool') {
                    return (
                      <AgentConversationDynamicToolPart
                        key={partKey}
                        part={part}
                        partIndex={partIndex}
                      />
                    );
                  }

                  // 나머지 part types
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  );
}
