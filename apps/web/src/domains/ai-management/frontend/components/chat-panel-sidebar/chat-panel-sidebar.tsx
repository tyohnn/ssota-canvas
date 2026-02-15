'use client';

import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  PromptInputBody,
} from '@workspace/ui/components/ai-elements/prompt-input';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageSquareIcon, PanelRightCloseIcon } from 'lucide-react';
import { useCanvasLayout } from '@/app/(dashboard)/contexts/canvas-layout-context';
import { ChatPanelMessages } from './chat-panel-messages';
import { useChatV2 } from './use-chat-v2';
import { ConversationEmptyState } from '@workspace/ui/components/ai-elements/conversation';

const CHAT_PANEL_WIDTH = 320;

export interface ChatPanelSidebarProps {
  className?: string;
}

/**
 * Right sidebar chat panel (Agent v2).
 * Uses useChat(/api/agent/v2); assistant messages render text and optional search tool results.
 */
export function ChatPanelSidebar({ className }: ChatPanelSidebarProps) {
  const { rightSidebarOpen, setRightSidebarOpen } = useCanvasLayout();
  const {
    messages,
    sendMessage,
    status,
  } = useChatV2();
  console.log('messages', messages);

  const isRunning = status === 'submitted' || status === 'streaming';

  if (!rightSidebarOpen) {
    return (
      <Box
        className={cn(
          'flex flex-col border-l border-border bg-background',
          'w-14 shrink-0 items-center py-2',
          className
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRightSidebarOpen(true)}
          title="Open chat panel"
        >
          <MessageSquareIcon className="size-5" />
        </Button>
      </Box>
    );
  }

  return (
    <Box
      className={cn(
        'flex flex-col h-full border-l border-border bg-background shrink-0',
        className
      )}
      style={{ width: CHAT_PANEL_WIDTH }}
    >
      {/* Header: title + close */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border shrink-0">
        <span className="font-medium text-sm">Sophi</span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setRightSidebarOpen(false)}
          title="Close chat panel"
        >
          <PanelRightCloseIcon className="size-4" />
        </Button>
      </div>

      {/* Message list */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <ConversationEmptyState
            title="Start a conversation"
            description="Search or ask a question and Sophi will help."
          />
        ) : (
          <ChatPanelMessages
            messages={messages}
            isStreaming={isRunning}
          />
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 p-2 border-t border-border">
        <PromptInput
          onSubmit={(payload) => {
            const text = typeof payload === 'object' && payload && 'text' in payload ? (payload as { text?: string }).text : undefined;
            sendMessage({ text: text ?? '' });
          }}
        >
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Search or ask a question..."
              disabled={isRunning}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputSubmit disabled={isRunning} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </Box>
  );
}
