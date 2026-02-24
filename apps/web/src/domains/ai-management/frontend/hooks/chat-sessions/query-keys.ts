/**
 * Chat session query keys for TanStack Query
 */
export const chatSessionQueryKeys = {
  all: ['chat-sessions'] as const,
  lists: () => [...chatSessionQueryKeys.all, 'list'] as const,
  list: (workspaceId: string) =>
    [...chatSessionQueryKeys.lists(), workspaceId] as const,
  details: () => [...chatSessionQueryKeys.all, 'detail'] as const,
  detail: (sessionId: string) =>
    [...chatSessionQueryKeys.details(), sessionId] as const,
};
