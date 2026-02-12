'use client';

import { useChat } from '@ai-sdk/react';
import { useCallback, useMemo } from 'react';
import { DefaultChatTransport } from 'ai';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';
import { useParams } from 'next/navigation';
import { useCanvasdownContext } from '@/domains/canvasdown/frontend/contexts/canvasdown-context';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/block-property/use-block-content-update';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
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
  selectedBlockIds: string[];
  visibleBlocks: VisibleBlockMeta[];
}

/**
 * Visible block metadata (excludes content)
 */
interface VisibleBlockMeta {
  blockMountId: string;
  blockType: string;
  title: string;
  connectedTo?: string[];
}

/**
 * Calculate visible blocks based on viewport
 * Similar to V1 pattern: include blocks within viewport bounds
 */
function calculateVisibleBlocks(
  nodes: Node[],
  edges: Edge[],
  viewport: { x: number; y: number; zoom: number }
): VisibleBlockMeta[] {
  // Only show visible blocks when zoomed in (>= 0.75)
  if (viewport.zoom < 0.75) {
    return [];
  }

  // Calculate viewport bounds (approximate)
  // For simplicity, include all nodes - in production, calculate actual viewport bounds
  // and filter nodes within bounds

  const visibleBlocks: VisibleBlockMeta[] = nodes.map((node) => {
    // Find edges where this node is the source
    const connectedTo = edges
      .filter((edge) => edge.source === node.id)
      .map((edge) => edge.target);

    return {
      blockMountId: node.id,
      blockType: String(node.data?.blockType ?? 'unknown'),
      title: String(node.data?.title ?? 'Untitled'),
      connectedTo: connectedTo.length > 0 ? connectedTo : undefined,
    };
  });

  return visibleBlocks;
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
    getViewport,
    getNode,
    setNodes,
    setCenter,
    fitView,
    addNodes,
    deleteElements,
  } = useReactFlow();
  const canvasMode = useCanvasModeContext();

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

  // Get route params for pageId, workspaceId, orgId
  const params = useParams();
  const pageId = params.pageId as string ?? '';
  const workspaceId = params.workspaceId as string ?? '';
  const orgId = params.orgId as string ?? '';

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
   * Collect client context from canvas state
   */
  const collectClientContext = useCallback((): ClientContext => {
    const nodes = getNodes();
    const edges = getEdges();
    const viewport = getViewport();

    // Get selected blocks
    const selectedBlockIds = nodes
      .filter((node) => node.selected)
      .map((node) => node.id);

    // Calculate visible blocks
    const visibleBlocks = calculateVisibleBlocks(nodes, edges, viewport);

    return {
      pageId,
      workspaceId,
      orgId,
      selectedBlockIds,
      visibleBlocks,
    };
  }, [getNodes, getEdges, getViewport, pageId, workspaceId, orgId]);

  /**
   * Send message with client context
   */
  const sendMessage = useCallback(
    (payload: { text: string }) => {
      const clientContext = collectClientContext();

      // Send message with clientContext in metadata
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
