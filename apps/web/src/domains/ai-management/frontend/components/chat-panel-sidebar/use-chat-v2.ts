'use client';

import { useChat } from '@ai-sdk/react';
import { useCallback, useMemo } from 'react';
import { DefaultChatTransport } from 'ai';
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
  useEditBlockLinesTool,
  useCreateTodosTool,
  useCanvasActionTool,
  useOrganizeLayoutTool,
} from '@/domains/ai-management/frontend/hooks/tools';
import { useUpdateBlockPosition } from '@/domains/canvas-management/frontend/hooks/block/use-update-block-position';

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
 * useChat for Agent v2 (/api/agent/v2) with context collection.
 * 
 * Collects canvas context (selected blocks, visible blocks) and sends it with each message.
 */
export function useChatV2() {
  // Get React Flow instance for canvas state
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

  // Canvas metadata (pageId, orgId, workspaceId) from CanvasMetadataProvider (layout/page already provide these)
  const { pageId, workspaceId, orgId } = useCanvasMetadata();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/agent/v2',
      }),
    []
  );

  // Get canvasdown executor from context
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
  const handleEditBlockLines = useEditBlockLinesTool({
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
    ...chat
  } = useChat({
    transport,
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
      if (toolName === 'editBlockLines') {
        await handleEditBlockLines(addToolOutput, toolCall.toolCallId, args);
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

      console.log(`[useChatV2] Tool ${toolName} not handled client-side`);
    },
  });

  /**
   * Collect client context from canvas state.
   * Selected blocks: prefer React Flow selection (useCanvasSelection), fallback to canvas mode
   * when nothing is selected in the store but user is in single-selection or block-editing mode.
   */
  const collectClientContext = useCallback((): { clientContext: ClientContext } => {
    const nodes = getNodes();
    const edges = getEdges();

    // Get selected blocks from the same source as multi-select toolbar (React Flow store)
    let selectedBlockIds = getSelectedBlocks();
    // Fallback: when store has no selection but UI is in single-selection or block-editing mode,
    // include the current block so the agent still receives "focused" block context
    if (selectedBlockIds.length === 0) {
      const mode = canvasMode.getCurrentMode();
      if (mode.type === 'single-selection' && mode.blockMountId) {
        selectedBlockIds = [mode.blockMountId];
      } else if (mode.type === 'block-editing' && mode.blockMountId) {
        selectedBlockIds = [mode.blockMountId];
      }
    }

    // Selected blocks with full meta (blockMountId, type, title) — same shape as visibleBlocks
    const selectedBlocks: VisibleBlockMeta[] = selectedBlockIds.map((id) => {
      const node = nodes.find((n) => n.id === id);
      return node
        ? nodeToVisibleMeta(node, edges)
        : { blockMountId: id, blockType: 'unknown', title: 'Untitled' };
    });

    // Visible blocks (viewport bounds + center-distance cap) from context-builder hook
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

  /**
   * Send message with client context
   */
  const sendMessage = useCallback(
    (payload: { text: string }) => {
      const { clientContext } = collectClientContext();
      chat.sendMessage({
        text: payload.text,
        metadata: {
          clientContext,
        },
      });
    },
    [chat, collectClientContext]
  );

  return {
    ...chat,
    messages,
    status,
    sendMessage,
  };
}
