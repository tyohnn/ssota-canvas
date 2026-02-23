'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createChatSession } from '@/domains/ai-management/actions/chat-sessions/create-chat-session.action';
import { chatSessionQueryKeys } from './query-keys';

export function useCreateChatSessionMutation(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error('Workspace not found');
      const result = await createChatSession({ workspaceId });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: chatSessionQueryKeys.list(workspaceId),
        });
      }
    },
  });
}
