'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getChatSession } from '@/domains/ai-management/actions/chat-sessions/get-chat-session.action';
import { getChatMessages } from '@/domains/ai-management/actions/chat-sessions/get-chat-messages.action';
import { useCreateChatSessionMutation } from './use-create-chat-session-mutation';
import { useSaveChatSessionMessagesMutation } from './use-save-chat-session-messages-mutation';
import { useUpdateChatSessionTitleMutation } from './use-update-chat-session-title-mutation';
import { useChatSessionListQuery } from './use-chat-session-list-query';
import { chatSessionQueryKeys } from './query-keys';

interface UseChatSessionPersistenceParams {
  workspaceId: string | undefined;
  /** setMessages from useChat - accepts array or updater function */
  setMessages: (messages: any) => void;
}

export function useChatSessionPersistence({
  workspaceId,
  setMessages,
}: UseChatSessionPersistenceParams) {
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>('New Chat');
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingMoreOlder, setIsLoadingMoreOlder] = useState(false);
  const lastSavedMessageCount = useRef(0);
  const hasGeneratedTitle = useRef(false);
  const minLoadedIndexRef = useRef<number | null>(null);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);

  const createMutation = useCreateChatSessionMutation(workspaceId);
  const saveMessagesMutation = useSaveChatSessionMessagesMutation();
  const updateTitleMutation = useUpdateChatSessionTitleMutation();
  const { data: sessionList } = useChatSessionListQuery({ workspaceId });

  const loadSession = useCallback(
    async (sessionId: string, optimisticTitle?: string) => {
      if (!workspaceId) return;
      // Optimistic: immediately set session ID and title before network call
      setCurrentSessionId(sessionId);
      if (optimisticTitle) setSessionTitle(optimisticTitle);
      setMessages([]);
      lastSavedMessageCount.current = 0;
      hasGeneratedTitle.current = false;
      minLoadedIndexRef.current = null;
      setHasMoreOlder(false);
      setIsLoadingSession(true);
      try {
        const data = await queryClient.fetchQuery({
          queryKey: chatSessionQueryKeys.detail(sessionId),
          queryFn: async () => {
            const result = await getChatSession({
              workspaceId,
              sessionId,
              limit: 20,
            });
            if (!result.success) throw new Error(result.error);
            return result.data;
          },
        });
        if (data) {
          setSessionTitle(data.title);
          const rawMessages = (data.messages ?? []) as any[];
          const seen = new Set<string>();
          const loadedMessages = rawMessages.filter((m: any) => {
            if (!m?.id || seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
          setMessages(loadedMessages);
          lastSavedMessageCount.current = loadedMessages.length;
          hasGeneratedTitle.current = data.title !== 'New Chat';
          minLoadedIndexRef.current = data.minLoadedIndex ?? null;
          setHasMoreOlder(data.hasMore ?? false);
        }
      } catch (error) {
        console.error('[useChatSessionPersistence] Failed to load session:', error);
      } finally {
        setIsLoadingSession(false);
      }
    },
    [workspaceId, queryClient, setMessages]
  );

  // Auto-load the most recent session once the list is first available
  const didAutoLoad = useRef(false);
  useEffect(() => {
    if (!sessionList || didAutoLoad.current) return;
    const first = sessionList[0];
    if (!first) return;
    didAutoLoad.current = true;
    loadSession(first.id, first.title);
  }, [sessionList]);

  const createSession = useCallback(async (): Promise<string | null> => {
    const data = await createMutation.mutateAsync();
    return data?.sessionId ?? null;
  }, [createMutation]);

  const startNewSession = useCallback(() => {
    setCurrentSessionId(null);
    setSessionTitle('New Chat');
    setMessages([]);
    lastSavedMessageCount.current = 0;
    hasGeneratedTitle.current = false;
    minLoadedIndexRef.current = null;
    setHasMoreOlder(false);
  }, [setMessages]);

  const loadMoreOlder = useCallback(async () => {
    if (
      !workspaceId ||
      !currentSessionId ||
      !hasMoreOlder ||
      minLoadedIndexRef.current === null ||
      isLoadingMoreOlder
    )
      return;
    setIsLoadingMoreOlder(true);
    try {
      const result = await getChatMessages({
        workspaceId,
        sessionId: currentSessionId,
        limit: 20,
        beforeIndex: minLoadedIndexRef.current,
      });
      if (!result.success) return;
      const { messages: olderMessages, hasMore, minLoadedIndex } = result.data;
      const seen = new Set<string>();
      const deduped = (olderMessages as any[]).filter((m: any) => {
        if (!m?.id || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      if (deduped.length > 0) {
        setMessages((prev: any[]) => [...deduped, ...prev]);
        lastSavedMessageCount.current += deduped.length;
      }
      setHasMoreOlder(hasMore);
      minLoadedIndexRef.current = minLoadedIndex ?? null;
    } catch (error) {
      console.error('[useChatSessionPersistence] Failed to load older messages:', error);
    } finally {
      setIsLoadingMoreOlder(false);
    }
  }, [workspaceId, currentSessionId, hasMoreOlder, isLoadingMoreOlder, setMessages]);

  const saveMessages = useCallback(
    async (sessionId: string, messages: unknown[], fromIndex: number) => {
      const appendMessages = messages.slice(fromIndex) as unknown[];
      if (appendMessages.length === 0) return true;
      if (!workspaceId) return false;

      return saveMessagesMutation
        .mutateAsync({ workspaceId, sessionId, appendMessages })
        .then(() => true)
        .catch(() => false);
    },
    [workspaceId, saveMessagesMutation]
  );

  const updateTitle = useCallback(
    async (sessionId: string, title: string) => {
      if (!workspaceId) return false;
      try {
        await updateTitleMutation.mutateAsync({
          workspaceId,
          sessionId,
          title,
        });
        setSessionTitle(title);
        return true;
      } catch {
        return false;
      }
    },
    [workspaceId, updateTitleMutation]
  );

  return {
    currentSessionId,
    setCurrentSessionId,
    sessionTitle,
    setSessionTitle,
    isLoadingSession,
    isLoadingMoreOlder,
    hasMoreOlder,
    lastSavedMessageCount,
    hasGeneratedTitle,
    createSession,
    loadSession,
    loadMoreOlder,
    startNewSession,
    saveMessages,
    updateTitle,
  };
}
