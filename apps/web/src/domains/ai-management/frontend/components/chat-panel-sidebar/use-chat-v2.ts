'use client';

import { useChat } from '@ai-sdk/react';
import { useCallback, useMemo } from 'react';
import { DefaultChatTransport } from 'ai';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';
import { useParams } from 'next/navigation';
import { useCanvasdownContext } from '@/domains/canvasdown/frontend/contexts/canvasdown-context';
import { getAbsoluteNodePosition } from '@/domains/canvas-management/frontend/hooks/group/utils/get-absolute-node-position';

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
  const { getNodes, getEdges, getViewport } = useReactFlow();
  
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

      // Handle renderCanvasdown (client-side)
      if (toolName === 'renderCanvasdown') {
        try {
          const dsl = args.dsl as string;
          const anchorBlockMountId = args.anchorBlockMountId as string | undefined;
          const position = (args.position as 'right' | 'below' | undefined) ?? 'right';

          // Execute canvasdown rendering
          let renderParams: Parameters<typeof renderCanvasdownFromContext>[0];
          if (anchorBlockMountId) {
            renderParams = {
              canvasdown: dsl,
              anchorBlockId: anchorBlockMountId,
              anchorDirection: position,
            };
          } else {
            // No anchor: use rightmost block on canvas as reference
            const nodes = getNodes();
            const allNodes = nodes;
            const rightmost = allNodes.reduce<{ node: Node; right: number } | null>(
              (acc, node) => {
                const absPos = getAbsoluteNodePosition(node, allNodes);
                const right = absPos.x + (node.width ?? 300);
                if (!acc || right > acc.right) {
                  return { node, right };
                }
                return acc;
              },
              null
            );

            if (rightmost) {
              // If rightmost block is inside a group, use parent's boundary to avoid overlapping
              const refNode =
                rightmost.node.parentId
                  ? allNodes.find((n) => n.id === rightmost.node.parentId) ?? rightmost.node
                  : rightmost.node;
              const absPos = getAbsoluteNodePosition(refNode, allNodes);
              const w = refNode.width ?? 300;
              const h = refNode.height ?? 200;
              renderParams = {
                canvasdown: dsl,
                sourceBlockPosition: absPos,
                sourceBlockSize: { width: w, height: h },
              };
            } else {
              renderParams = {
                canvasdown: dsl,
                sourceBlockPosition: { x: 100, y: 100 },
                sourceBlockSize: { width: 300, height: 200 },
              };
            }
          }

          const result = await renderCanvasdownFromContext(renderParams);

          if (!result.success) {
            console.error('[useChatV2] renderCanvasdown failed:', result.errors);
            addToolOutput({
              tool: 'renderCanvasdown',
              toolCallId: toolCall.toolCallId,
              state: 'output-error',
              errorText: result.errors.join(', '),
            });
            return;
          }

          const blockIdMapObj: Record<string, string> = {};
          result.blockIdMap.forEach((value, key) => {
            blockIdMapObj[key] = value;
          });

          addToolOutput({
            tool: 'renderCanvasdown',
            toolCallId: toolCall.toolCallId,
            output: {
              success: true,
              message: `Created ${result.blockIdMap.size} blocks`,
              blockIdMap: blockIdMapObj,
            },
          });
        } catch (error) {
          console.error('[useChatV2] renderCanvasdown error:', error);
          addToolOutput({
            tool: 'renderCanvasdown',
            toolCallId: toolCall.toolCallId,
            state: 'output-error',
            errorText: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        return;
      }

      // Handle patchCanvasdown (client-side)
      if (toolName === 'patchCanvasdown') {
        try {
          const dsl = args.dsl as string;

          const result = await renderCanvasdownFromContext({
            canvasdown: dsl,
          });

          if (!result.success) {
            console.error('[useChatV2] patchCanvasdown failed:', result.errors);
            addToolOutput({
              tool: 'patchCanvasdown',
              toolCallId: toolCall.toolCallId,
              state: 'output-error',
              errorText: result.errors.join(', '),
            });
            return;
          }

          addToolOutput({
            tool: 'patchCanvasdown',
            toolCallId: toolCall.toolCallId,
            output: {
              success: true,
              message: `Patched ${result.blockIdMap.size} blocks`,
            },
          });
        } catch (error) {
          console.error('[useChatV2] patchCanvasdown error:', error);
          addToolOutput({
            tool: 'patchCanvasdown',
            toolCallId: toolCall.toolCallId,
            state: 'output-error',
            errorText: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        return;
      }

      // Unknown tool - log and ignore (server will handle it)
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
