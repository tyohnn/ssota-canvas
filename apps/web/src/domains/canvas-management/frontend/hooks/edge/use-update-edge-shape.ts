'use client';

import { useMutation } from '@tanstack/react-query';
import type { Edge } from '@xyflow/react';

import { updateEdgeShapeAction } from '@/domains/canvas-management/actions/edge.actions';
import {
  type UpdateEdgeShapeRequestInput,
  UpdateEdgeShapeRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests';
import type { EdgeData } from '@/domains/canvas-management/shared/types/common.types';
import { isFailure } from '@/lib/action-result';

export type ReactFlowDependencies = {
  getEdges: () => Edge<EdgeData>[];
  setEdges: (edges: Edge<EdgeData>[]) => void;
};

export type UseUpdateEdgeShapeParams = {
  reactFlow: ReactFlowDependencies;
};

export type UpdateEdgeShapeInput = {
  edgeId: string;
  newShape: string;
};

export type UseUpdateEdgeShapeResult = {
  updateEdgeShape: (input: UpdateEdgeShapeInput) => Promise<boolean>;
  isUpdating: boolean;
};

/**
 * 엣지 모양 업데이트 도메인 훅 (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 */
export function useUpdateEdgeShape(
  params: UseUpdateEdgeShapeParams
): UseUpdateEdgeShapeResult {
  const { reactFlow } = params;
  const { getEdges, setEdges } = reactFlow;

  const mutation = useMutation({
    mutationFn: async ({
      edgeId,
      newShape,
    }: {
      edgeId: string;
      newShape: string;
    }) => {
      // Validation
      const rawRequest: UpdateEdgeShapeRequestInput = {
        edgeId,
        newShape,
      };

      const parseResult = UpdateEdgeShapeRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(
          firstError?.message || 'Invalid edge shape update data'
        );
      }

      // Server Action
      const result = await updateEdgeShapeAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Optimistic Update
    onMutate: async ({ edgeId, newShape }) => {
      const currentEdges = getEdges();
      const edgeToUpdate = currentEdges.find(edge => edge.id === edgeId);

      if (!edgeToUpdate) {
        throw new Error('Edge not found');
      }

      // 즉시 React Flow Store에서 모양 변경
      const updatedEdges = currentEdges.map(edge =>
        edge.id === edgeId
          ? {
              ...edge,
              data: {
                ...edge.data,
                actualEdgeShape: newShape,
              } as EdgeData,
            }
          : edge
      );

      setEdges(updatedEdges);

      // 롤백을 위한 컨텍스트 반환
      return { previousEdges: currentEdges };
    },

    // 자동 롤백
    onError: (error, variables, context) => {
      if (context?.previousEdges) {
        setEdges(context.previousEdges);
      }
    },
  });

  return {
    updateEdgeShape: async (input: UpdateEdgeShapeInput): Promise<boolean> => {
      try {
        await mutation.mutateAsync(input);
        return true;
      } catch (error) {
        return false;
      }
    },
    isUpdating: mutation.isPending,
  };
}
