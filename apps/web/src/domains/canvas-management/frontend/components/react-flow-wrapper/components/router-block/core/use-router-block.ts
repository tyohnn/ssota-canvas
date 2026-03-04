'use client';

import { useCallback } from 'react';

import type { BlockType } from '@/domains/block-management/shared/types/block-types';

import { useCanvasBlockLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useReactFlow } from '@xyflow/react';

export interface RouterNodeData {
  /** @deprecated Router blocks are now persisted; kept for compatibility */
  isPhantom?: true;
  routerType: 'link' | 'file';
}

export interface UseRouterBlockParams {
  nodeId: string;
  nodeData: RouterNodeData;
}

export interface UseRouterBlockReturn {
  /** Soft-delete router block and create the real block with resolved type and properties */
  resolveAndCreateBlock: (
    blockType: BlockType,
    initialProperties: Record<string, unknown>,
    initialContent?: unknown
  ) => Promise<void>;

  /** Soft-delete router block (cancel/ESC) */
  cancel: () => void;
}

/**
 * Shared hook for Link Router and File Router blocks.
 * Router blocks are persisted to DB; cancel and resolve trigger block_mount soft delete.
 */
export function useRouterBlock({
  nodeId,
  nodeData,
}: UseRouterBlockParams): UseRouterBlockReturn {
  const { pageId } = useCanvasMetadata();
  const {
    createAndMountBlock,
    softDeleteBlockMounts,
  } = useCanvasBlockLifecycle({ pageId });
  const { getNode } = useReactFlow();

  const resolveAndCreateBlock = useCallback(
    async (
      blockType: BlockType,
      initialProperties: Record<string, unknown>,
      initialContent?: unknown
    ) => {
      const node = getNode(nodeId);
      if (!node) return;

      const position = node.position;

      // 1. Create real block first (user sees new block appear)
      await createAndMountBlock(
        blockType,
        position,
        initialProperties as Record<string, any>,
        initialContent
      );

      // 2. Then soft-delete router block (removes placeholder)
      await softDeleteBlockMounts(nodeId);
    },
    [nodeId, getNode, softDeleteBlockMounts, createAndMountBlock]
  );

  const cancel = useCallback(() => {
    softDeleteBlockMounts(nodeId);
  }, [nodeId, softDeleteBlockMounts]);

  return {
    resolveAndCreateBlock,
    cancel,
  };
}
