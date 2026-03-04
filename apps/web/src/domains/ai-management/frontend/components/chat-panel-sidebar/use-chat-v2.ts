'use client';

import { useChat } from '@ai-sdk/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasdownContext } from '@/domains/canvasdown/frontend/contexts/canvasdown-context';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import { useCanvasSelection } from '@/domains/canvas-management/frontend/hooks/use-canvas-selection';
import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/block-property/use-block-content-update';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  useVisibleBlocks,
  nodeToVisibleMeta,
  type VisibleBlockMeta,
} from '@/domains/ai-management/frontend/hooks/context-builder';
import {
  useRenderCanvasdownTool,
  usePatchCanvasdownTool,
  useEditTool,
  useCreateTodosTool,
  useCanvasActionTool,
  useOrganizeLayoutTool,
} from '@/domains/ai-management/frontend/hooks/tools';
import { useUpdateBlockPosition } from '@/domains/canvas-management/frontend/hooks/block/use-update-block-position';
import { useChatSessionPersistence } from '@/domains/ai-management/frontend/hooks/chat-sessions';

/**
 * Client context interface sent to the agent
 */
interface ClientContext {
  pageId: string;
  workspaceId: string;
  orgId: string;
  selectedBlocks: VisibleBlockMeta[];
  visibleBlocks: VisibleBlockMeta[];
  /** Total blocks that intersect the viewport (before cap) */
  visibleBlocksTotalInView?: number;
  /** Number of blocks included in context (capped by distance from center, max 20) */
  visibleBlocksInContext?: number;
}

/**
 * useChat for Agent v2 (/api/agent/v2) with context collection and session persistence.
 *
 * Collects canvas context (selected blocks, visible blocks) and sends it with each message.
 * Manages session persistence: creates new sessions, saves messages, loads existing sessions.
 */
export function useChatV2() {
  const [optimisticText, setOptimisticText] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const {
    getNodes,
    getEdges,
    getNode,
    setNodes,
    setCenter,
    fitView,
    addNodes,
    deleteElements,
  } = useReactFlow();
  const canvasMode = useCanvasModeContext();
  const { getSelectedBlocks } = useCanvasSelection();
  const { getVisibleBlocks } = useVisibleBlocks();

  const updateNode = useCallback(
    (nodeId: string, options: { data: Partial<BlockNodeData> }) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...options.data } } : n
        )
      );
    },
    [setNodes]
  );
  const { updateBlockContent } = useUpdateBlockContent({
    reactFlow: { getNode, updateNode },
  });

  const { pageId, workspaceId, orgId } = useCanvasMetadata();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/agent/v2',
      }),
    []
  );

  const { renderCanvasdown: renderCanvasdownFromContext } = useCanvasdownContext();

  const getNodeOrNull = useCallback(
    (id: string) => getNode(id) ?? null,
    [getNode]
  );

  const handleRenderCanvasdown = useRenderCanvasdownTool({
    renderCanvasdownFromContext,
    getNodes,
  });
  const handlePatchCanvasdown = usePatchCanvasdownTool({
    renderCanvasdownFromContext,
  });
  const handleEdit = useEditTool({
    getNode: getNodeOrNull,
    updateBlockContent,
  });
  const handleCreateTodos = useCreateTodosTool();
  const handleCanvasAction = useCanvasActionTool({
    getNode: getNodeOrNull,
    getNodes,
    setCenter,
    fitView,
    canvasMode,
  });

  const { updateBlockPosition } = useUpdateBlockPosition({
    pageId,
    reactFlow: { getNodes, setNodes, addNodes, deleteElements },
  });

  const handleOrganizeLayout = useOrganizeLayoutTool({
    getNodes,
    getEdges,
    setNodes,
    updateBlockPosition,
  });

  const {
    addToolOutput,
    messages,
    status,
    setMessages,
    ...chat
  } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onError: (err) => {
      console.error('[useChatV2] Error:', err);
    },
    onToolCall: async ({ toolCall }) => {
      const toolName = toolCall.toolName as string;
      const args = (toolCall as any).input as Record<string, unknown>;

      console.log(`[useChatV2] Tool called: ${toolName}`, args);

      if (toolName === 'renderCanvasdown') {
        await handleRenderCanvasdown(addToolOutput, toolCall.toolCallId, args);
        return;
      }
      if (toolName === 'patchCanvasdown') {
        await handlePatchCanvasdown(addToolOutput, toolCall.toolCallId, args);
        return;
      }
      if (toolName === 'edit') {
        await handleEdit(addToolOutput, toolCall.toolCallId, args);
        return;
      }
      if (toolName === 'createTodos') {
        handleCreateTodos(addToolOutput, toolCall.toolCallId, args);
        return;
      }
      if (toolName === 'canvasAction') {
        handleCanvasAction(addToolOutput, toolCall.toolCallId, args);
        return;
      }
      if (toolName === 'organizeLayout') {
        await handleOrganizeLayout(addToolOutput, toolCall.toolCallId, args);
        return;
      }
      if (toolName === 'webSearch') {
        console.log('[useChatV2] webSearch: server-executed (streaming tool result to client)', {
          toolCallId: toolCall.toolCallId,
          args,
        });
        return;
      }

      console.log(`[useChatV2] Tool ${toolName} not handled client-side`);
    },
  });

  const {
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
  } = useChatSessionPersistence({ workspaceId, setMessages });

  const collectClientContext = useCallback((): { clientContext: ClientContext } => {
    const nodes = getNodes();
    const edges = getEdges();

    let selectedBlockIds = getSelectedBlocks();
    if (selectedBlockIds.length === 0) {
      const mode = canvasMode.getCurrentMode();
      if (mode.type === 'single-selection' && mode.blockMountId) {
        selectedBlockIds = [mode.blockMountId];
      } else if (mode.type === 'block-editing' && mode.blockMountId) {
        selectedBlockIds = [mode.blockMountId];
      }
    }

    const selectedBlocks: VisibleBlockMeta[] = selectedBlockIds.map((id) => {
      const node = nodes.find((n) => n.id === id);
      return node
        ? nodeToVisibleMeta(node, edges)
        : { blockMountId: id, blockType: 'unknown', title: 'Untitled' };
    });

    const visibleResult = getVisibleBlocks();

    return {
      clientContext: {
        pageId,
        workspaceId,
        orgId,
        selectedBlocks,
        visibleBlocks: visibleResult.visibleBlocks,
        visibleBlocksTotalInView: visibleResult.visibleBlocksTotalInView,
        visibleBlocksInContext: visibleResult.visibleBlocksInContext,
      },
    };
  }, [
    getNodes,
    getEdges,
    getSelectedBlocks,
    canvasMode,
    pageId,
    workspaceId,
    orgId,
    getVisibleBlocks,
  ]);

  const sendMessage = useCallback(
    async (
      payload: { text: string },
      options?: { body?: Record<string, unknown> }
    ) => {
      setOptimisticText(payload.text);
      setSendError(null);

      let sessionId = currentSessionId;
      if (!sessionId) {
        try {
          sessionId = await createSession();
          if (sessionId) setCurrentSessionId(sessionId);
        } catch (error) {
          console.error('[useChatV2] Failed to create session:', error);
          setSendError('세션을 만들지 못했습니다. 다시 시도해 주세요.');
          return;
        }
      }

      setOptimisticText(null);
      const { clientContext } = collectClientContext();
      chat.sendMessage(
        {
          text: payload.text,
          metadata: {
            clientContext,
          },
        },
        options
      );
    },
    [chat, collectClientContext, currentSessionId, createSession, setCurrentSessionId]
  );

  const wrappedStartNewSession = useCallback(() => {
    startNewSession();
  }, [startNewSession]);

  useEffect(() => {
    if (status !== 'ready' && status !== 'submitted') return;
    if (!currentSessionId || messages.length === 0) return;

    const fromIndex = lastSavedMessageCount.current;
    if (messages.length <= fromIndex) return;

    // Immediately guard to prevent duplicate saves when mutation state changes
    // cause saveMessages reference to change and re-fire this effect
    lastSavedMessageCount.current = messages.length;

    const run = async () => {
      const ok = await saveMessages(currentSessionId, messages, fromIndex);
      if (!ok) {
        // Rollback so a retry is possible
        lastSavedMessageCount.current = fromIndex;
      }
    };
    run();
  }, [status, messages, currentSessionId, saveMessages]);

  useEffect(() => {
    const generateTitle = async () => {
      if (!currentSessionId || hasGeneratedTitle.current) return;
      if (messages.length < 2) return;
      if (sessionTitle !== 'New Chat') return;

      const hasUserMessage = messages.some((m) => m.role === 'user');
      const hasAssistantMessage = messages.some((m) => m.role === 'assistant');
      if (!hasUserMessage || !hasAssistantMessage) return;

      hasGeneratedTitle.current = true;

      try {
        const response = await fetch('/api/agent/v2/generate-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
        });

        if (response.ok) {
          const { title } = await response.json();
          setSessionTitle(title);
          await updateTitle(currentSessionId, title);
        }
      } catch (error) {
        console.error('[useChatV2] Failed to generate title:', error);
      }
    };

    generateTitle();
  }, [messages, currentSessionId, sessionTitle, setSessionTitle, updateTitle]);

  return {
    ...chat,
    messages,
    status,
    sendMessage,
    currentSessionId,
    sessionTitle,
    setSessionTitle,
    isLoadingSession,
    loadMoreOlder,
    hasMoreOlder,
    isLoadingMoreOlder,
    startNewSession: wrappedStartNewSession,
    loadSession,
    optimisticText,
    sendError,
    dismissSendError: useCallback(() => setSendError(null), []),
  };
}
