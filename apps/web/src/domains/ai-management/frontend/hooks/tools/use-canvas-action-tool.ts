'use client';

import { useCallback } from 'react';
import type { Node } from '@xyflow/react';
import { getAbsoluteNodePosition } from '@/domains/canvas-management/frontend/hooks/group/utils/get-absolute-node-position';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { AddToolOutput } from './use-render-canvasdown-tool';

export interface CanvasModeContextValue {
  enterSingleSelectionMode: (blockMountId: string) => void;
  enterBlockEditingMode: (blockId: string, blockMountId: string) => void;
}

export interface UseCanvasActionToolDeps {
  getNode: (id: string) => Node | null;
  getNodes: () => Node[];
  setCenter: (x: number, y: number, options?: { duration?: number; zoom?: number }) => void;
  fitView: (options?: { duration?: number; padding?: number }) => void;
  canvasMode: CanvasModeContextValue;
}

export function useCanvasActionTool({
  getNode,
  getNodes,
  setCenter,
  fitView,
  canvasMode,
}: UseCanvasActionToolDeps) {
  return useCallback(
    (
      addToolOutput: AddToolOutput,
      toolCallId: string,
      args: {
        action?: 'select' | 'zoomTo' | 'openEditor';
        blockMountId?: string;
        zoomTarget?: 'block' | 'fit';
      }
    ) => {
      try {
        const action = args.action as 'select' | 'zoomTo' | 'openEditor';
        const blockMountId = args.blockMountId as string | undefined;
        const zoomTarget = args.zoomTarget as 'block' | 'fit' | undefined;

        if (action === 'select') {
          if (!blockMountId) {
            addToolOutput({
              tool: 'canvasAction',
              toolCallId,
              state: 'output-error',
              errorText: 'blockMountId is required for select',
            });
            return;
          }
          canvasMode.enterSingleSelectionMode(blockMountId);
          addToolOutput({
            tool: 'canvasAction',
            toolCallId,
            output: { success: true, message: 'Selected block.' },
          });
          return;
        }

        if (action === 'zoomTo') {
          if (zoomTarget === 'fit') {
            fitView({ duration: 500, padding: 0.1 });
            addToolOutput({
              tool: 'canvasAction',
              toolCallId,
              output: { success: true, message: 'Fitted view to canvas.' },
            });
            return;
          }
          if (!blockMountId) {
            addToolOutput({
              tool: 'canvasAction',
              toolCallId,
              state: 'output-error',
              errorText: 'blockMountId is required for zoomTo block',
            });
            return;
          }
          const node = getNode(blockMountId);
          if (!node) {
            addToolOutput({
              tool: 'canvasAction',
              toolCallId,
              state: 'output-error',
              errorText: `Block not found: ${blockMountId}`,
            });
            return;
          }
          const nodes = getNodes();
          const pos = getAbsoluteNodePosition(node, nodes);
          const centerX = pos.x + (node.width ?? 300) / 2;
          const centerY = pos.y + (node.height ?? 200) / 2;
          setCenter(centerX, centerY, { duration: 500, zoom: 1 });
          addToolOutput({
            tool: 'canvasAction',
            toolCallId,
            output: { success: true, message: 'Zoomed to block.' },
          });
          return;
        }

        if (action === 'openEditor') {
          if (!blockMountId) {
            addToolOutput({
              tool: 'canvasAction',
              toolCallId,
              state: 'output-error',
              errorText: 'blockMountId is required for openEditor',
            });
            return;
          }
          const node = getNode(blockMountId);
          if (!node) {
            addToolOutput({
              tool: 'canvasAction',
              toolCallId,
              state: 'output-error',
              errorText: `Block not found: ${blockMountId}`,
            });
            return;
          }
          const blockId = (node.data as BlockNodeData | undefined)?.blockId;
          if (!blockId) {
            addToolOutput({
              tool: 'canvasAction',
              toolCallId,
              state: 'output-error',
              errorText: `Block has no blockId: ${blockMountId}`,
            });
            return;
          }
          canvasMode.enterBlockEditingMode(blockId, blockMountId);
          addToolOutput({
            tool: 'canvasAction',
            toolCallId,
            output: { success: true, message: 'Opened block editor.' },
          });
          return;
        }

        addToolOutput({
          tool: 'canvasAction',
          toolCallId,
          state: 'output-error',
          errorText: `Unknown action: ${action}`,
        });
      } catch (error) {
        console.error('[useCanvasActionTool] error:', error);
        addToolOutput({
          tool: 'canvasAction',
          toolCallId,
          state: 'output-error',
          errorText: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [getNode, getNodes, setCenter, fitView, canvasMode]
  );
}
