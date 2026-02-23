'use client';

import { useQuery } from '@tanstack/react-query';
import { listChatSessions } from '@/domains/ai-management/actions/chat-sessions/list-chat-sessions.action';
import { chatSessionQueryKeys } from './query-keys';

interface UseChatSessionListQueryParams {
  workspaceId: string | undefined;
  enabled?: boolean;
}

export function useChatSessionListQuery({
  workspaceId,
  enabled = true,
}: UseChatSessionListQueryParams) {
  return useQuery({
    queryKey: chatSessionQueryKeys.list(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) return [];
      const result = await listChatSessions({ workspaceId });
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: !!workspaceId && enabled,
  });
}
