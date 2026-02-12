'use client';

import { useChat } from '@ai-sdk/react';
import { useCallback, useMemo } from 'react';
import { DefaultChatTransport } from 'ai';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';
import { useParams } from 'next/navigation';
import { useCanvasdownContext } from '@/domains/canvasdown/frontend/contexts/canvasdown-context';
import { getAbsoluteNodePosition } from '@/domains/canvas-management/frontend/hooks/group/utils/get-absolute-node-position';
import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/block-property/use-block-content-update';
import { convertMarkdownToTiptapJSON } from '@/domains/ai-management/frontend/utils/markdown-to-tiptap';
import { tiptapToMarkdown } from '@/domains/block-management/shared/utils/tiptap-markdown.utils';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

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
 * Apply a line-based edit (replace, insert, delete) to text. 1-based line numbers.
 */
function applyLineEdit(
  currentText: string,
  operation: 'replace' | 'insert' | 'delete',
  startLine: number,
  endLine?: number,
  newContent?: string
): string {
  const lines = currentText.split('\n');
  const start = Math.max(0, startLine - 1);
  const end = Math.min(
    lines.length - 1,
    endLine != null ? endLine - 1 : start
  );
  if (operation === 'replace') {
    const insertLines = (newContent ?? '').split('\n');
    lines.splice(start, end - start + 1, ...insertLines);
  } else if (operation === 'insert') {
    const insertLines = (newContent ?? '').split('\n');
    lines.splice(start, 0, ...insertLines);
  } else {
    lines.splice(start, end - start + 1);
  }
  return lines.join('\n');
}

/**
 * useChat for Agent v2 (/api/agent/v2) with context collection.
 * 
 * Collects canvas context (selected blocks, visible blocks) and sends it with each message.
 */
export function useChatV2() {
  // Get React Flow instance for canvas state
  const { getNodes, getEdges, getViewport, getNode, setNodes } = useReactFlow();

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

      // Handle editBlockLines (client-side)
      if (toolName === 'editBlockLines') {
        try {
          const blockMountId = args.blockMountId as string;
          const operation = args.operation as 'replace' | 'insert' | 'delete';
          const startLine = Number(args.startLine) || 1;
          const endLine = args.endLine != null ? Number(args.endLine) : undefined;
          const newContent = args.newContent as string | undefined;

          if (!blockMountId) {
            addToolOutput({
              tool: 'editBlockLines',
              toolCallId: toolCall.toolCallId,
              state: 'output-error',
              errorText: 'blockMountId is required',
            });
            return;
          }
          if ((operation === 'replace' || operation === 'insert') && newContent === undefined) {
            addToolOutput({
              tool: 'editBlockLines',
              toolCallId: toolCall.toolCallId,
              state: 'output-error',
              errorText: 'newContent is required for replace and insert',
            });
            return;
          }

          const node = getNode(blockMountId);
          if (!node) {
            addToolOutput({
              tool: 'editBlockLines',
              toolCallId: toolCall.toolCallId,
              state: 'output-error',
              errorText: `Block not found: ${blockMountId}. Use readBlockLines first to ensure the block is loaded.`,
            });
            return;
          }

          const blockData = node.data as BlockNodeData;
          let currentText = '';
          if (blockData.content && typeof blockData.content === 'object') {
            try {
              currentText = tiptapToMarkdown(blockData.content as Parameters<typeof tiptapToMarkdown>[0]);
            } catch {
              currentText = '';
            }
          }

          const newText = applyLineEdit(currentText, operation, startLine, endLine, newContent);
          const content = convertMarkdownToTiptapJSON(newText);

          const ok = await updateBlockContent({
            nodeId: blockMountId,
            content,
            blockData,
            contentRaw: newText,
          });
          if (!ok) {
            addToolOutput({
              tool: 'editBlockLines',
              toolCallId: toolCall.toolCallId,
              state: 'output-error',
              errorText: 'Failed to update block content',
            });
            return;
          }
          addToolOutput({
            tool: 'editBlockLines',
            toolCallId: toolCall.toolCallId,
            output: { success: true, message: 'Block lines updated.' },
          });
        } catch (error) {
          console.error('[useChatV2] editBlockLines error:', error);
          addToolOutput({
            tool: 'editBlockLines',
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
