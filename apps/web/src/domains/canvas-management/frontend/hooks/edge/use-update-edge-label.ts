'use client';

import { useMutation } from '@tanstack/react-query';
import type { Edge } from '@xyflow/react';

import { updateEdgeLabelAction } from '@/domains/canvas-management/actions/edge/update-edge-label.action';
import {
  type UpdateEdgeLabelRequestInput,
  UpdateEdgeLabelRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests';
import type { EdgeData } from '@/domains/canvas-management/shared/types/common.types';
import { isFailure } from '@/lib/action-result';

export type ReactFlowDependencies = {
  getEdges: () => Edge<EdgeData>[];
  setEdges: (edges: Edge<EdgeData>[]) => void;
};

export type UseUpdateEdgeLabelParams = {
  reactFlow: ReactFlowDependencies;
};

export type UpdateEdgeLabelInput = {
  edgeId: string;
  newLabel: string;
};

export type UseUpdateEdgeLabelResult = {
  updateEdgeLabel: (input: UpdateEdgeLabelInput) => Promise<boolean>;
  isUpdating: boolean;
};

/**
 * 엣지 라벨 업데이트 도메인 훅 (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 */
export function useUpdateEdgeLabel(
  params: UseUpdateEdgeLabelParams
): UseUpdateEdgeLabelResult {
  const { reactFlow } = params;
  const { getEdges, setEdges } = reactFlow;

  const mutation = useMutation({
    mutationFn: async ({
      edgeId,
      newLabel,
    }: {
      edgeId: string;
      newLabel: string;
    }) => {
      // Validation
      const rawRequest: UpdateEdgeLabelRequestInput = {
        edgeId,
        newLabel,
      };

      const parseResult = UpdateEdgeLabelRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(
          firstError?.message || 'Invalid edge label update data'
        );
      }

      // Server Action
      const result = await updateEdgeLabelAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Optimistic Update
    onMutate: async ({ edgeId, newLabel }) => {
      const currentEdges = getEdges();
      const edgeToUpdate = currentEdges.find(edge => edge.id === edgeId);

      if (!edgeToUpdate) {
        throw new Error('Edge not found');
      }

      // 즉시 React Flow Store에서 라벨 변경
      setEdges(
        currentEdges.map(edge =>
          edge.id === edgeId ? { ...edge, label: newLabel } : edge
        )
      );

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
    updateEdgeLabel: async (input: UpdateEdgeLabelInput): Promise<boolean> => {
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
