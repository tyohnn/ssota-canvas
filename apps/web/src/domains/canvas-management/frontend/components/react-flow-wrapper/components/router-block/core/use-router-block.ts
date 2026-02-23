'use client';

import { useCallback } from 'react';

import type { BlockType } from '@/domains/block-management/shared/types/block-types';

import { useCanvasBlockLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useReactFlow } from '@xyflow/react';

export interface RouterNodeData {
  isPhantom: true;
  routerType: 'link' | 'file';
}

export interface UseRouterBlockParams {
  nodeId: string;
  nodeData: RouterNodeData;
}

export interface UseRouterBlockReturn {
  /** Remove phantom node and create the real block with resolved type and properties */
  resolveAndCreateBlock: (
    blockType: BlockType,
    initialProperties: Record<string, unknown>,
    initialContent?: unknown
  ) => Promise<void>;

  /** Remove phantom node only (cancel/ESC) */
  cancel: () => void;
}

/**
 * Shared hook for Link Router and File Router blocks.
 * Manages phantom node removal and real block creation.
 */
export function useRouterBlock({
  nodeId,
  nodeData,
}: UseRouterBlockParams): UseRouterBlockReturn {
  const { pageId } = useCanvasMetadata();
  const { createAndMountBlock } = useCanvasBlockLifecycle({ pageId });
  const { deleteElements, getNode } = useReactFlow();

  const resolveAndCreateBlock = useCallback(
    async (
      blockType: BlockType,
      initialProperties: Record<string, unknown>,
      initialContent?: unknown
    ) => {
      const node = getNode(nodeId);
      if (!node) return;

      const position = node.position;

      // Remove phantom node first (order matters for clean UI transition)
      deleteElements({ nodes: [{ id: nodeId }] });

      await createAndMountBlock(
        blockType,
        position,
        initialProperties as Record<string, any>,
        initialContent
      );
    },
    [nodeId, getNode, deleteElements, createAndMountBlock]
  );

  const cancel = useCallback(() => {
    deleteElements({ nodes: [{ id: nodeId }] });
  }, [nodeId, deleteElements]);

  return {
    resolveAndCreateBlock,
    cancel,
  };
}
