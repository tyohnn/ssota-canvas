import { useCallback, useMemo } from 'react';

import type {
  BlockPosition,
  DomainDependencies,
  FlowDependencies,
  SelectionBoundingBoxBusinessLogic,
} from './types';

/**
 * Production business logic
 * Performs actual API calls and updates domain state
 */
export function useSelectionBoundingBoxBusiness(
  { setNodes }: FlowDependencies,
  { updateBlockPosition: updateBlockPositionDomain }: DomainDependencies
): SelectionBoundingBoxBusinessLogic {
  const updateNodePositions = useCallback(
    (nodePositions: Array<{ id: string; x: number; y: number }>) => {
      setNodes(nodes => {
        const updated = nodes.map(node => {
          const updatedPos = nodePositions.find(p => p.id === node.id);
          if (updatedPos) {
            return {
              ...node,
              position: {
                x: updatedPos.x,
                y: updatedPos.y,
              },
            };
          }
          return node;
        });
        return updated;
      });
    },
    [setNodes]
  );

  const saveBlockPositions = useCallback(
    async (blockPositions: BlockPosition[]) => {
      if (blockPositions.length === 0) {
        return;
      }

      try {
        // BlockPosition의 blockId는 실제로 blockMountId (node.id = blockMountId)
        const blockMountPositions = blockPositions.map(bp => ({
          blockMountId: bp.blockId, // node.id는 이미 blockMountId
          position: bp.position,
        }));
        
        await updateBlockPositionDomain({ blockPositions: blockMountPositions });
      } catch (error) {
        console.error(
          '[SelectionBoundingBox] Failed to save positions:',
          error
        );
        throw error;
      }
    },
    [updateBlockPositionDomain]
  );

  return useMemo(
    () => ({
      updateNodePositions,
      saveBlockPositions,
    }),
    [updateNodePositions, saveBlockPositions]
  );
}

/**
 * Mock business logic (for no-code tools)
 * Tests locally without actual API calls
 */
export function useMockSelectionBoundingBoxBusiness(): SelectionBoundingBoxBusinessLogic {
  const updateNodePositions = useCallback(
    (nodePositions: Array<{ id: string; x: number; y: number }>) => {
      console.log('[Mock] Updating node positions:', nodePositions);
    },
    []
  );

  const saveBlockPositions = useCallback(
    async (blockPositions: BlockPosition[]) => {
      console.log('[Mock] Saving block positions:', blockPositions);
      await new Promise(resolve => setTimeout(resolve, 300));
    },
    []
  );

  return {
    updateNodePositions,
    saveBlockPositions,
  };
}
