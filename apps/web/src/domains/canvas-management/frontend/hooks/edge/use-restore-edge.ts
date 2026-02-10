'use client';

import { useMutation } from '@tanstack/react-query';

import { restoreEdgeAction } from '@/domains/canvas-management/actions/edge/restore-edge.action';
import {
  type RestoreEdgeRequestInput,
  RestoreEdgeRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests/edge.requests';
import { isFailure } from '@/lib';

export type UseRestoreEdgeParams = {
  pageId: string;
  onSuccess?: () => void;
  onError?: () => void;
};

export type RestoreEdgeInput = {
  edgeIds: string | string[];
};

export type UseRestoreEdgeResult = {
  restoreEdge: (input: RestoreEdgeInput) => Promise<boolean>;
  isRestoring: boolean;
};

/**
 * 엣지 복구 도메인 훅
 */
export function useRestoreEdge(
  params: UseRestoreEdgeParams
): UseRestoreEdgeResult {
  const { pageId, onSuccess, onError } = params;

  const mutation = useMutation({
    mutationFn: async (input: RestoreEdgeInput) => {
      const ids = Array.isArray(input.edgeIds)
        ? input.edgeIds
        : [input.edgeIds];

      // Validation
      const rawRequest: RestoreEdgeRequestInput = {
        edgeIds: ids,
        pageId,
      };

      const parseResult = RestoreEdgeRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        throw new Error('Invalid restore request');
      }

      // Server Action
      const result = await restoreEdgeAction(parseResult.data);
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
    restoreEdge: async (input: RestoreEdgeInput): Promise<boolean> => {
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
