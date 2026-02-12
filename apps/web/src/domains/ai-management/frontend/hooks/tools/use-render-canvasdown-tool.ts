'use client';

import { useCallback } from 'react';
import type { Node } from '@xyflow/react';
import { getAbsoluteNodePosition } from '@/domains/canvas-management/frontend/hooks/group/utils/get-absolute-node-position';

export type AddToolOutput = (output:
  | { state?: 'output-available'; tool: string; toolCallId: string; output: unknown; errorText?: undefined }
  | { state: 'output-error'; tool: string; toolCallId: string; output?: undefined; errorText: string }
) => void | Promise<void>;

export type RenderCanvasdownFromContext = (params: {
  canvasdown: string;
  sourceBlockPosition?: { x: number; y: number };
  sourceBlockSize?: { width: number; height: number };
  anchorBlockId?: string;
  anchorDirection?: 'right' | 'below';
}) => Promise<{
  success: boolean;
  blockIdMap: Map<string, string>;
  errors: string[];
}>;

export interface UseRenderCanvasdownToolDeps {
  addToolOutput: AddToolOutput;
  renderCanvasdownFromContext: RenderCanvasdownFromContext;
  getNodes: () => Node[];
}

export function useRenderCanvasdownTool({
  renderCanvasdownFromContext,
  getNodes,
}: Omit<UseRenderCanvasdownToolDeps, 'addToolOutput'>) {
  return useCallback(
    async (
      addToolOutput: AddToolOutput,
      toolCallId: string,
      args: {
        dsl?: string;
        anchorBlockMountId?: string;
        position?: 'right' | 'below';
      }
    ) => {
      try {
        const dsl = args.dsl as string;
        const anchorBlockMountId = args.anchorBlockMountId as string | undefined;
        const position = (args.position as 'right' | 'below' | undefined) ?? 'right';

        let renderParams: Parameters<RenderCanvasdownFromContext>[0];
        if (anchorBlockMountId) {
          renderParams = {
            canvasdown: dsl,
            anchorBlockId: anchorBlockMountId,
            anchorDirection: position,
          };
        } else {
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
          addToolOutput({
            tool: 'renderCanvasdown',
            toolCallId,
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
          toolCallId,
          output: {
            success: true,
            message: `Created ${result.blockIdMap.size} blocks`,
            blockIdMap: blockIdMapObj,
          },
        });
      } catch (error) {
        console.error('[useRenderCanvasdownTool] error:', error);
        addToolOutput({
          tool: 'renderCanvasdown',
          toolCallId,
          state: 'output-error',
          errorText: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [renderCanvasdownFromContext, getNodes]
  );
}
