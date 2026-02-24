'use client';

import type { ChatSessionListItem } from '@/domains/ai-management/shared/dtos/responses/chat-session.responses';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteChatSession } from '@/domains/ai-management/actions/chat-sessions/delete-chat-session.action';
import { chatSessionQueryKeys } from './query-keys';

interface DeleteParams {
  workspaceId: string;
  sessionId: string;
}

export function useDeleteChatSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, sessionId }: DeleteParams) => {
      const result = await deleteChatSession({ workspaceId, sessionId });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onMutate: async ({ workspaceId, sessionId }) => {
      const listKey = chatSessionQueryKeys.list(workspaceId);
      await queryClient.cancelQueries({ queryKey: listKey });

      const previousList = queryClient.getQueryData<ChatSessionListItem[]>(
        listKey
      );

      queryClient.setQueryData<ChatSessionListItem[]>(listKey, (old) => {
        if (!old) return old;
        return old.filter((s) => s.id !== sessionId);
      });

      return { previousList };
    },
    onError: (_err, { workspaceId }, context) => {
      if (context?.previousList !== undefined) {
        queryClient.setQueryData(
          chatSessionQueryKeys.list(workspaceId),
          context.previousList
        );
      }
    },
    onSettled: (_data, _error, { workspaceId, sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: chatSessionQueryKeys.list(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: chatSessionQueryKeys.detail(sessionId),
      });
    },
  });
}
