'use client';

import { useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Box } from '@/components/ui/box';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import type { ChatSessionListItem } from '@/domains/ai-management/shared/dtos/responses/chat-session.responses';
import {
  useChatSessionListQuery,
  useUpdateChatSessionTitleMutation,
  useDeleteChatSessionMutation,
} from '@/domains/ai-management/frontend/hooks/chat-sessions';

interface ChatSessionPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  onSessionSelect: (sessionId: string, sessionTitle?: string) => void;
  currentSessionId: string | null;
  onTitleUpdate?: (sessionId: string, title: string) => void;
}

export function ChatSessionPopover({
  open,
  onOpenChange,
  trigger,
  onSessionSelect,
  currentSessionId,
  onTitleUpdate,
}: ChatSessionPopoverProps) {
  const { workspaceId } = useCanvasMetadata();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // Prevent blur from firing after confirm/cancel button click
  const committingRef = useRef(false);

  const { data: sessions = [], isLoading } = useChatSessionListQuery({
    workspaceId,
    enabled: open,
  });
  const updateTitleMutation = useUpdateChatSessionTitleMutation();
  const deleteMutation = useDeleteChatSessionMutation();

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!workspaceId) return;
    deleteMutation.mutate({ workspaceId, sessionId });
  };

  const handleStartEdit = (session: ChatSessionListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    committingRef.current = false;
    setEditingId(session.id);
    setEditTitle(session.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = (sessionId: string, title: string) => {
    committingRef.current = true;
    setEditingId(null);
    const trimmed = title.trim();
    if (!trimmed || !workspaceId) return;
    updateTitleMutation.mutate(
      { workspaceId, sessionId, title: trimmed },
      { onSuccess: () => onTitleUpdate?.(sessionId, trimmed) }
    );
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    committingRef.current = true;
    setEditingId(null);
    setEditTitle('');
  };

  const handleBlur = (sessionId: string) => {
    if (committingRef.current) return;
    commitEdit(sessionId, editTitle);
  };

  const handleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit(sessionId, editTitle);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={5}
        alignOffset={-30}
        className="w-[260px] p-0 max-h-[360px] overflow-hidden flex flex-col"
      >
        <Box className="px-3 py-1.5 border-b border-border">
          <h3 className="font-medium text-xs text-muted-foreground tracking-wide uppercase">History</h3>
        </Box>

        <Box className="flex-1 overflow-y-auto">
          {isLoading ? (
            <Box className="flex items-center justify-center py-8">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </Box>
          ) : sessions.length === 0 ? (
            <Box className="px-3 py-8 text-center text-xs text-muted-foreground">
              No chat history yet
            </Box>
          ) : (
            <Box className="py-1">
              {sessions.map((session) => (
                <Box
                  key={session.id}
                  className={`
                    px-2.5 py-1.5 hover:bg-accent/50 cursor-pointer
                    flex items-center gap-1.5 group
                    ${currentSessionId === session.id ? 'bg-accent' : ''}
                  `}
                  onClick={() => {
                    if (editingId !== session.id) {
                      onSessionSelect(session.id, session.title);
                      onOpenChange(false);
                    }
                  }}
                >
                  <Box className="flex-1 min-w-0">
                    {editingId === session.id ? (
                      <input
                        ref={inputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, session.id)}
                        onBlur={() => handleBlur(session.id)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full text-xs font-medium bg-transparent border-0 border-b border-b-foreground/30 outline-none focus-visible:ring-0 py-0 leading-tight"
                      />
                    ) : (
                      <Box className="text-xs font-medium truncate">
                        {session.title}
                      </Box>
                    )}
                    <Box className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                    </Box>
                  </Box>

                  <Box className="flex items-center gap-0.5 shrink-0">
                    {editingId === session.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onMouseDown={(e) => { e.stopPropagation(); commitEdit(session.id, editTitle); }}
                        >
                          <Check className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-5 w-5"
                          onMouseDown={(e) => handleCancelEdit(e)}
                        >
                          <X className="size-3" />
                        </Button>
                      </>
                    ) : (
                      <Box className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-5 w-5"
                          onClick={(e) => handleStartEdit(session, e)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-5 w-5 text-destructive hover:text-destructive"
                          onClick={(e) => handleDelete(session.id, e)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </PopoverContent>
    </Popover>
  );
}
