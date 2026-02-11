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
import { cn } from '@/lib/utils';
import {
  type ChatPanelMessagePart,
  type ToolCallPart,
  isReasoningPart,
  isTextPart,
  isToolPart,
  isXaiSearchToolPart,
} from './types';
import { ChatPanelToolPart } from './tool-part';

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
  const reasoningParts = parts.filter(isReasoningPart);
  const textParts = parts.filter(isTextPart);
  const toolParts = parts.filter(isToolPart) as ToolCallPart[];
  const hasContent =
    reasoningParts.length > 0 ||
    textParts.length > 0 ||
    toolParts.length > 0;

  const isLastMessage = message.id === messages[messages.length - 1]?.id;

  if (!hasContent) {
    return (
      <Shimmer as="span" className="text-muted-foreground text-sm">
        Generating response...
      </Shimmer>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {reasoningParts.map((part, i) => {
        const partIndex = parts.indexOf(part);
        const isLastPartInMessage =
          partIndex === parts.length - 1;
        const partIsStreaming =
          isStreaming && isLastMessage && isLastPartInMessage;

        return (
          <Reasoning
            key={`${message.id}-reasoning-${i}`}
            className="w-full"
            isStreaming={partIsStreaming}
          >
            <ReasoningTrigger />
            <ReasoningContent>{part.text || '추론 중...'}</ReasoningContent>
          </Reasoning>
        );
      })}
      {textParts.length > 0 && (
        <MessageResponse>
          {textParts.map((p) => p.text).join('')}
        </MessageResponse>
      )}
      {toolParts.length > 0 && (
        <div className="flex flex-col gap-2">
          {(() => {
            const xaiSearchParts = toolParts.filter(isXaiSearchToolPart);
            const otherParts = toolParts.filter((p) => !isXaiSearchToolPart(p));
            return (
              <>
                {xaiSearchParts.length > 0 && (
                  <ChatPanelToolPart
                    key={`${message.id}-search`}
                    parts={xaiSearchParts}
                    partKey={`${message.id}-search`}
                  />
                )}
                {otherParts.map((part, i) => {
                  const partKey =
                    (part as { toolCallId?: string }).toolCallId ??
                    `${message.id}-tool-${i}`;
                  return (
                    <ChatPanelToolPart
                      key={partKey}
                      part={part}
                      partKey={partKey}
                    />
                  );
                })}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export interface ChatPanelMessagesProps {
  messages: UIMessage[];
  isStreaming?: boolean;
  className?: string;
}

export function ChatPanelMessages({
  messages,
  isStreaming = false,
  className,
}: ChatPanelMessagesProps) {
  if (messages.length === 0) {
    return null;
  }

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
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
