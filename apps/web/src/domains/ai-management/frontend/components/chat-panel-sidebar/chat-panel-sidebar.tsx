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
import { MessageSquareIcon, PanelRightCloseIcon, Plus, History } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { useCanvasLayout } from '@/app/(dashboard)/contexts/canvas-layout-context';
import { useState } from 'react';
import { ChatPanelMessages } from './chat-panel-messages';
import { useChatV2 } from './use-chat-v2';
import { ConversationEmptyState } from '@workspace/ui/components/ai-elements/conversation';
import { ChatSessionPopover } from './chat-session-popover';

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
    sessionTitle,
    setSessionTitle,
    startNewSession,
    loadSession,
    loadMoreOlder,
    hasMoreOlder,
    isLoadingMoreOlder,
    currentSessionId,
    isLoadingSession,
    optimisticText,
    sendError,
  } = useChatV2();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
        'flex flex-col h-full min-h-0 overflow-hidden border-l border-border bg-background shrink-0',
        className
      )}
      style={{ width: CHAT_PANEL_WIDTH }}
    >
      {/* Header: session title + actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        <span className="font-medium text-sm truncate flex-1" title={sessionTitle}>
          {sessionTitle}
        </span>
        <Box className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={startNewSession}
            title="New chat"
          >
            <Plus className="size-4" />
          </Button>
          <ChatSessionPopover
            open={isHistoryOpen}
            onOpenChange={setIsHistoryOpen}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                title="Chat history"
              >
                <History className="size-4" />
              </Button>
            }
            onSessionSelect={(sessionId, sessionTitle) => loadSession(sessionId, sessionTitle)}
            currentSessionId={currentSessionId}
            onTitleUpdate={(sessionId, title) => {
              if (sessionId === currentSessionId) {
                setSessionTitle(title);
              }
            }}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setRightSidebarOpen(false)}
            title="Close chat panel"
          >
            <PanelRightCloseIcon className="size-4" />
          </Button>
        </Box>
      </div>

      {/* Message list */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {isLoadingSession ? (
          <div className="flex flex-col gap-4 p-4 flex-1">
            <div className="flex justify-end">
              <Skeleton className="h-8 w-3/5 rounded-2xl" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="h-16 w-4/5 rounded-2xl" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-8 w-2/5 rounded-2xl" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="h-12 w-3/4 rounded-2xl" />
            </div>
          </div>
        ) : messages.length === 0 && !optimisticText ? (
          <ConversationEmptyState
            title="Start a conversation"
            description="Search or ask a question and Sophi will help."
          />
        ) : (
          <ChatPanelMessages
            messages={messages}
            isStreaming={isRunning}
            optimisticText={optimisticText}
            sendError={sendError}
            onLoadMoreOlder={loadMoreOlder}
            hasMoreOlder={hasMoreOlder}
            isLoadingMoreOlder={isLoadingMoreOlder}
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
