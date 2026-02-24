'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveChatSessionMessages } from '@/domains/ai-management/actions/chat-sessions/save-chat-session-messages.action';
import { chatSessionQueryKeys } from './query-keys';

interface SaveMessagesParams {
  workspaceId: string;
  sessionId: string;
  appendMessages: unknown[];
}

export function useSaveChatSessionMessagesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      sessionId,
      appendMessages,
    }: SaveMessagesParams) => {
      const result = await saveChatSessionMessages({
        workspaceId,
        sessionId,
        appendMessages,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_data, { workspaceId, sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: chatSessionQueryKeys.detail(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: chatSessionQueryKeys.list(workspaceId),
      });
    },
  });
}
