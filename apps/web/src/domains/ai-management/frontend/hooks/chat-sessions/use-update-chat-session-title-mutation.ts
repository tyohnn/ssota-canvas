'use client';

import type { ChatSessionListItem } from '@/domains/ai-management/shared/dtos/responses/chat-session.responses';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateChatSessionTitle } from '@/domains/ai-management/actions/chat-sessions/update-chat-session-title.action';
import { chatSessionQueryKeys } from './query-keys';

interface UpdateTitleParams {
  workspaceId: string;
  sessionId: string;
  title: string;
}

export function useUpdateChatSessionTitleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      sessionId,
      title,
    }: UpdateTitleParams) => {
      const result = await updateChatSessionTitle({
        workspaceId,
        sessionId,
        title,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onMutate: async ({ workspaceId, sessionId, title }) => {
      const listKey = chatSessionQueryKeys.list(workspaceId);
      await queryClient.cancelQueries({ queryKey: listKey });

      const previousList = queryClient.getQueryData<ChatSessionListItem[]>(
        listKey
      );

      queryClient.setQueryData<ChatSessionListItem[]>(listKey, (old) => {
        if (!old) return old;
        const now = new Date();
        return old.map((s) =>
          s.id === sessionId
            ? { ...s, title, updatedAt: now }
            : s
        );
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
