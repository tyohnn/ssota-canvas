'use client';

import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { AddToolOutput } from './use-render-canvasdown-tool';
import type { UpdateBlockPositionInput } from '@/domains/canvas-management/frontend/hooks/block/use-update-block-position';
import type { Position } from '@/domains/canvas-management/shared/types/common.types';
import {
  validateSameLayer,
  computeGridLayout,
  computeStackLayout,
  computeFlowLayout,
  computeTreeLayout,
  computeMindmapLayout,
  type LayoutNode,
  type LayoutEdge,
  type LayoutOptions,
} from '@/domains/ai-management/frontend/utils/layout-engine';

const DEFAULT_NODE_WIDTH = 300;
const DEFAULT_NODE_HEIGHT = 200;

export type OrganizeLayoutType =
  | 'grid'
  | 'flow'
  | 'tree'
  | 'mindmap'
  | 'stack';

export interface UseOrganizeLayoutToolDeps {
  getNodes: () => Node[];
  getEdges: () => Edge[];
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  updateBlockPosition: (
    input: UpdateBlockPositionInput
  ) => Promise<unknown[] | null>;
}

export function useOrganizeLayoutTool({
  getNodes,
  getEdges,
  setNodes,
  updateBlockPosition,
}: UseOrganizeLayoutToolDeps) {
  return useCallback(
    async (
      addToolOutput: AddToolOutput,
      toolCallId: string,
      args: {
        type?: OrganizeLayoutType;
        options?: {
          columns?: number;
          direction?: 'LR' | 'RL' | 'TB' | 'BT';
          spacing?: number;
          centerBlockMountId?: string;
        };
        targetBlockMountIds?: string[];
      }
    ) => {
      try {
        const layoutType = (args.type ?? 'grid') as OrganizeLayoutType;
        const options = (args.options ?? {}) as LayoutOptions;
        const targetIds = args.targetBlockMountIds;

        const nodes = getNodes();
        const edges = getEdges();

        const candidateNodes = targetIds
          ? nodes.filter((n) => targetIds.includes(n.id))
          : nodes.filter((n) => !n.parentId);

        if (candidateNodes.length === 0) {
          addToolOutput({
            tool: 'organizeLayout',
            toolCallId,
            state: 'output-error',
            errorText: targetIds
              ? 'No nodes found for the given targetBlockMountIds.'
              : 'No root-level blocks on the canvas to organize.',
          });
          return;
        }

        const targetIdList = candidateNodes.map((n) => n.id);
        const layerCheck = validateSameLayer(nodes, targetIdList);
        if (!layerCheck.valid) {
          addToolOutput({
            tool: 'organizeLayout',
            toolCallId,
            state: 'output-error',
            errorText:
              'Cannot organize blocks from different layers. All target blocks must share the same parent (or all be root-level).',
          });
          return;
        }

        const layoutNodes: LayoutNode[] = candidateNodes.map((n) => ({
          id: n.id,
          width: n.measured?.width ?? n.width ?? DEFAULT_NODE_WIDTH,
          height: n.measured?.height ?? n.height ?? DEFAULT_NODE_HEIGHT,
        }));

        const nodeIdSet = new Set(layoutNodes.map((n) => n.id));
        const layoutEdges: LayoutEdge[] = edges
          .filter(
            (e) =>
              nodeIdSet.has(e.source) &&
              nodeIdSet.has(e.target) &&
              e.source !== e.target
          )
          .map((e) => ({ source: e.source, target: e.target }));

        let positions: Map<string, { x: number; y: number }>;

        if (layoutType === 'grid') {
          positions = computeGridLayout(layoutNodes, options).positions;
        } else if (layoutType === 'stack') {
          positions = computeStackLayout(layoutNodes, options).positions;
        } else if (layoutType === 'flow') {
          positions = (
            await computeFlowLayout(layoutNodes, layoutEdges, options)
          ).positions;
        } else if (layoutType === 'tree') {
          positions = (
            await computeTreeLayout(layoutNodes, layoutEdges, options)
          ).positions;
        } else if (layoutType === 'mindmap') {
          if (!options.centerBlockMountId) {
            addToolOutput({
              tool: 'organizeLayout',
              toolCallId,
              state: 'output-error',
              errorText:
                'mindmap layout requires options.centerBlockMountId to be set.',
            });
            return;
          }
          positions = (
            await computeMindmapLayout(layoutNodes, layoutEdges, options)
          ).positions;
        } else {
          addToolOutput({
            tool: 'organizeLayout',
            toolCallId,
            state: 'output-error',
            errorText: `Unknown layout type: ${layoutType}`,
          });
          return;
        }

        const blockPositions: Array<{ blockMountId: string; position: Position }> =
          [];
        candidateNodes.forEach((node) => {
          const pos = positions.get(node.id);
          if (pos) {
            const blockMountId =
              (node.data as { blockMountId?: string })?.blockMountId ?? node.id;
            blockPositions.push({
              blockMountId,
              position: { x: pos.x, y: pos.y },
            });
          }
        });

        setNodes((currentNodes: Node[]) =>
          currentNodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return node;
            return { ...node, position: { x: pos.x, y: pos.y } };
          })
        );

        if (blockPositions.length > 0) {
          await updateBlockPosition({ blockPositions });
        }

        addToolOutput({
          tool: 'organizeLayout',
          toolCallId,
          output: {
            success: true,
            movedCount: blockPositions.length,
            message: `Organized ${blockPositions.length} blocks with ${layoutType} layout.`,
          },
        });
      } catch (error) {
        console.error('[useOrganizeLayoutTool] error:', error);
        addToolOutput({
          tool: 'organizeLayout',
          toolCallId,
          state: 'output-error',
          errorText: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [getNodes, getEdges, setNodes, updateBlockPosition]
  );
}
