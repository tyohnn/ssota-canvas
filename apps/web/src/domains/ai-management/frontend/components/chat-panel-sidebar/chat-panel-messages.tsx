'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@workspace/ui/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@workspace/ui/components/ai-elements/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@workspace/ui/components/ai-elements/reasoning';
import { Shimmer } from '@workspace/ui/components/ai-elements/shimmer';
import type { UIMessage } from 'ai';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type ChatPanelMessagePart,
  type ToolCallPart,
  isReasoningPart,
  isStepStartPart,
  isTextPart,
  isToolPart,
} from './types';
import { ChatPanelToolPart, isWebSearchToolPart } from './tool-part';

/**
 * Renders assistant messages: text parts as main response (Streamdown), tool parts (e.g. search) as Tasks.
 */
function AssistantMessageContent({
  message,
  messages,
  isStreaming,
}: {
  message: UIMessage;
  messages: UIMessage[];
  isStreaming: boolean;
}) {
  const parts = (message.parts ?? []) as ChatPanelMessagePart[];
  const hasStepStart = parts.some(isStepStartPart);
  const reasoningParts = parts.filter(isReasoningPart);
  const textParts = parts.filter(isTextPart);
  const toolParts = parts.filter(isToolPart) as ToolCallPart[];
  const hasContent =
    reasoningParts.length > 0 ||
    textParts.length > 0 ||
    toolParts.length > 0;

  const isLastMessage = message.id === messages[messages.length - 1]?.id;

  // Before first step-start arrives: show "Thinking..." while streaming
  if (isStreaming && isLastMessage && !hasStepStart) {
    return (
      <Shimmer as="span" className="text-muted-foreground text-sm">
        Thinking...
      </Shimmer>
    );
  }

  if (!hasContent) {
    return (
      <Shimmer as="span" className="text-muted-foreground text-sm">
        Thinking...
      </Shimmer>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {parts.map((part, partIndex) => {
        const isLastPartInMessage = partIndex === parts.length - 1;
        const partIsStreaming = isStreaming && isLastMessage && isLastPartInMessage;

        if (isReasoningPart(part)) {
          return (
            <Reasoning
              key={`${message.id}-reasoning-${partIndex}`}
              className="w-full"
              isStreaming={partIsStreaming}
            >
              <ReasoningTrigger />
              <ReasoningContent>{(part as { text?: string }).text || '추론 중...'}</ReasoningContent>
            </Reasoning>
          );
        }

        if (isTextPart(part)) {
          return (
            <MessageResponse key={`${message.id}-text-${partIndex}`}>
              {part.text}
            </MessageResponse>
          );
        }

        if (isToolPart(part)) {
          const toolPart = part as ToolCallPart;
          const webSearchParts = toolParts.filter(isWebSearchToolPart);
          const isFirstWebSearchInMessage =
            isWebSearchToolPart(toolPart) &&
            toolParts.findIndex(isWebSearchToolPart) === toolParts.indexOf(toolPart);
          if (isWebSearchToolPart(toolPart) && isFirstWebSearchInMessage) {
            return (
              <ChatPanelToolPart
                key={`${message.id}-search`}
                parts={webSearchParts}
                partKey={`${message.id}-search`}
              />
            );
          }
          if (isWebSearchToolPart(toolPart)) {
            return null;
          }
          const partKey = (toolPart as { toolCallId?: string }).toolCallId ?? `${message.id}-tool-${partIndex}`;
          return (
            <ChatPanelToolPart
              key={partKey}
              part={toolPart}
              partKey={partKey}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

export interface ChatPanelMessagesProps {
  messages: UIMessage[];
  isStreaming?: boolean;
  className?: string;
  /** Optimistic user message text shown immediately before session creation completes */
  optimisticText?: string | null;
  /** Error message shown when session creation (or send) fails */
  sendError?: string | null;
}

export function ChatPanelMessages({
  messages,
  isStreaming = false,
  className,
  optimisticText,
  sendError,
}: ChatPanelMessagesProps) {
  const hasOptimistic = !!optimisticText;
  const isEmpty = messages.length === 0 && !hasOptimistic;

  if (isEmpty) {
    return null;
  }

  const lastMessage = messages[messages.length - 1];
  const lastIsUser = lastMessage?.role === 'user';
  const showThinkingPlaceholder = isStreaming && lastIsUser;

  return (
    <Conversation className={cn('flex-1 min-h-0', className)}>
      <ConversationContent>
        {messages.map((message) => (
          <Message key={message.id} from={message.role}>
            <MessageContent>
              {message.role === 'user' ? (
                (message.parts ?? []).map((part, i) => {
                  if (isTextPart(part)) {
                    return (
                      <div key={i} className="whitespace-pre-wrap">
                        {part.text}
                      </div>
                    );
                  }
                  return null;
                })
              ) : (
                <AssistantMessageContent
                  message={message}
                  messages={messages}
                  isStreaming={isStreaming}
                />
              )}
            </MessageContent>
          </Message>
        ))}

        {/* Optimistic user bubble: shown before session creation completes */}
        {hasOptimistic && (
          <Message key="__optimistic_user__" from="user">
            <MessageContent>
              <div className="whitespace-pre-wrap">{optimisticText}</div>
            </MessageContent>
          </Message>
        )}

        {/* Thinking placeholder: shown while streaming after real send */}
        {showThinkingPlaceholder && !hasOptimistic && (
          <Message key="thinking-placeholder" from="assistant">
            <MessageContent>
              <Shimmer as="span" className="text-muted-foreground text-sm">
                Thinking...
              </Shimmer>
            </MessageContent>
          </Message>
        )}

        {/* Thinking placeholder during optimistic phase */}
        {hasOptimistic && (
          <Message key="__optimistic_thinking__" from="assistant">
            <MessageContent>
              <Shimmer as="span" className="text-muted-foreground text-sm">
                Thinking...
              </Shimmer>
            </MessageContent>
          </Message>
        )}

        {/* Error bubble: optimistic user message stays, error shown below */}
        {sendError && (
          <Message key="__send_error__" from="assistant">
            <MessageContent>
              <div className="flex items-start gap-2 text-destructive text-sm">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>{sendError}</span>
              </div>
            </MessageContent>
          </Message>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
