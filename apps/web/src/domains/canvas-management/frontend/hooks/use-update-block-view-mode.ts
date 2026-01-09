/**
 * Block View Mode Update Hook
 *
 * 블록의 View Mode를 업데이트하는 훅
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import { isFailure } from '@/lib';

import { updateBlockMountViewModeAction } from '../../actions/block-mount/update-block-view-mode.action';
import type { BlockViewModeValue } from '../../shared/value-objects/block-view-mode.vo';

export type ReactFlowDependencies = {
  getNode: (nodeId: string) => Node | undefined;
  updateNode: (nodeId: string, options: { data: Node['data'] }) => void;
};

export type UseUpdateBlockViewModeParams = {
  blockMountId: string;
  pageId: string;
  reactFlow: ReactFlowDependencies;
};

export type UseUpdateBlockViewModeResult = {
  updateViewMode: (viewMode: BlockViewModeValue) => Promise<void>;
  isUpdating: boolean;
};

export function useUpdateBlockViewMode({
  blockMountId,
  pageId,
  reactFlow,
}: UseUpdateBlockViewModeParams): UseUpdateBlockViewModeResult {
  const { getNode, updateNode } = reactFlow;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (viewMode: BlockViewModeValue) => {
      const result = await updateBlockMountViewModeAction({
        blockMountId,
        viewMode,
      });

      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onMutate: async (viewMode: BlockViewModeValue) => {
      // Optimistic update
      const node = getNode(blockMountId);
      if (node) {
        updateNode(blockMountId, {
          data: {
            ...node.data,
            viewMode,
          },
        });
      }
      return { previousViewMode: node?.data?.viewMode };
    },
    onError: (error, viewMode, context) => {
      // Rollback on error
      const node = getNode(blockMountId);
      if (node && context?.previousViewMode) {
        updateNode(blockMountId, {
          data: {
            ...node.data,
            viewMode: context.previousViewMode,
          },
        });
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['canvas', pageId] });
    },
  });

  return {
    updateViewMode: async (viewMode: BlockViewModeValue): Promise<void> => {
      await mutation.mutateAsync(viewMode);
    },
    isUpdating: mutation.isPending,
  };
}
