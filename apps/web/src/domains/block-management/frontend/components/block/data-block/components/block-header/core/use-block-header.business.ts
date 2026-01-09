import { useCallback } from 'react';

import { useReactFlow } from '@xyflow/react';

import { useUpdateBlockTitle } from '@/domains/block-management/frontend/hooks/block-property/use-block-title-update';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import type { BlockHeaderBusinessLogic } from './types';

/**
 * Production business logic
 * Makes actual API calls and updates domain state
 */
export function useBlockHeaderBusiness(
  data: BlockNodeData
): BlockHeaderBusinessLogic {
  const { getNode, updateNode } = useReactFlow();
  const { updateBlockTitle, isUpdating } = useUpdateBlockTitle({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: BlockNodeData }) => {
        updateNode(nodeId, options);
      },
    },
  });

  const updateTitle = useCallback(
    async (title: string): Promise<boolean> => {
      if (!title.trim()) {
        return false;
      }

      const trimmedTitle = title.trim();
      const blockId = data.blockMountId;

      try {
        const result = await updateBlockTitle({
          nodeId: blockId,
          title: trimmedTitle,
          blockData: data,
        });

        return result;
      } catch (error) {
        console.error('[BlockHeader] Failed to update title:', error);
        return false;
      }
    },
    [data, updateBlockTitle]
  );

  return {
    updateTitle,
    isUpdating,
  };
}

/**
 * Mock business logic (for no-code tools)
 * Tests behavior locally without actual API calls
 */
export function useMockBlockHeaderBusiness(): BlockHeaderBusinessLogic {
  const updateTitle = useCallback(async (title: string): Promise<boolean> => {
    console.log('[Mock] Updating block title:', title);
    await new Promise(resolve => setTimeout(resolve, 300));
    return true;
  }, []);

  return {
    updateTitle,
    isUpdating: false,
  };
}
