'use client';

import { useQuery } from '@tanstack/react-query';
import { getChatSession } from '@/domains/ai-management/actions/chat-sessions/get-chat-session.action';
import { chatSessionQueryKeys } from './query-keys';
import type { ChatSessionResponse } from '@/domains/ai-management/shared/dtos/responses/chat-session.responses';

interface UseChatSessionQueryParams {
  workspaceId: string | undefined;
  sessionId: string | null;
}

export function useChatSessionQuery({
  workspaceId,
  sessionId,
}: UseChatSessionQueryParams) {
  return useQuery({
    queryKey: chatSessionQueryKeys.detail(sessionId ?? ''),
    queryFn: async (): Promise<ChatSessionResponse | null> => {
      if (!workspaceId || !sessionId) return null;
      const result = await getChatSession({ workspaceId, sessionId });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!workspaceId && !!sessionId,
  });
}
