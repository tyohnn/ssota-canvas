'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import { restoreBlockMountAction } from '@/domains/canvas-management/actions/block-mount/restore-block-mount.action';
import {
  type RestoreBlockMountRequestInput,
  RestoreBlockMountRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests/block.requests';
import { isFailure } from '@/lib';

export type ReactFlowDependencies = {
  getNodes: () => Node[];
  setNodes: (nodes: Node[]) => void;
  addNodes: (nodes: Node[]) => void;
};

export type UseRestoreBlockParams = {
  pageId: string;
  reactFlow: ReactFlowDependencies;
  onSuccess?: () => void;
  onError?: () => void;
};

export type RestoreBlockInput = {
  blockMountIds: string | string[];
};

export type UseRestoreBlockResult = {
  restoreBlock: (input: RestoreBlockInput) => Promise<boolean>;
  isRestoring: boolean;
};

/**
 * 블록 복구 도메인 훅
 */
export function useRestoreBlock(
  params: UseRestoreBlockParams
): UseRestoreBlockResult {
  const { pageId, onSuccess, onError } = params;

  const mutation = useMutation({
    mutationFn: async (input: RestoreBlockInput) => {
      const ids = Array.isArray(input.blockMountIds)
        ? input.blockMountIds
        : [input.blockMountIds];

      // Validation
      const rawRequest: RestoreBlockMountRequestInput = {
        blockMountIds: ids,
        pageId,
      };

      const parseResult = RestoreBlockMountRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        throw new Error('Invalid restore request');
      }

      // Server Action
      const result = await restoreBlockMountAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onError: () => {
      onError?.();
    },
  });

  return {
    restoreBlock: async (input: RestoreBlockInput): Promise<boolean> => {
      try {
        await mutation.mutateAsync(input);
        return true;
      } catch (error) {
        return false;
      }
    },
    isRestoring: mutation.isPending,
  };
}
