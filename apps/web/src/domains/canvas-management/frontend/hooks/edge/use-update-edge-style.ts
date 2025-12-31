'use client';

import { useMutation } from '@tanstack/react-query';
import type { Edge } from '@xyflow/react';

import { updateEdgeStyleAction } from '@/domains/canvas-management/actions/edge/update-edge-style.action';
import {
  type UpdateEdgeStyleRequestInput,
  UpdateEdgeStyleRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests';
import type { EdgeData } from '@/domains/canvas-management/shared/types/common.types';
import { isFailure } from '@/lib/action-result';

export type ReactFlowDependencies = {
  getEdges: () => Edge<EdgeData>[];
  setEdges: (edges: Edge<EdgeData>[]) => void;
};

export type UseUpdateEdgeStyleParams = {
  reactFlow: ReactFlowDependencies;
};

export type UpdateEdgeStyleInput = {
  edgeId: string;
  style: { stroke?: string; strokeWidth?: number };
};

export type UseUpdateEdgeStyleResult = {
  updateEdgeStyle: (input: UpdateEdgeStyleInput) => Promise<boolean>;
  isUpdating: boolean;
};

/**
 * 엣지 스타일 업데이트 도메인 훅 (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 */
export function useUpdateEdgeStyle(
  params: UseUpdateEdgeStyleParams
): UseUpdateEdgeStyleResult {
  const { reactFlow } = params;
  const { getEdges, setEdges } = reactFlow;

  const mutation = useMutation({
    mutationFn: async ({
      edgeId,
      style,
    }: {
      edgeId: string;
      style: { stroke?: string; strokeWidth?: number };
    }) => {
      // Validation
      const rawRequest: UpdateEdgeStyleRequestInput = {
        edgeId,
        style,
      };

      const parseResult = UpdateEdgeStyleRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(
          firstError?.message || 'Invalid edge style update data'
        );
      }

      // Server Action (updateEdgeStyleAction은 직접 edgeId와 style을 받음)
      const result = await updateEdgeStyleAction(edgeId, style);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Optimistic Update
    onMutate: async ({ edgeId, style }) => {
      const currentEdges = getEdges();
      const edgeToUpdate = currentEdges.find(edge => edge.id === edgeId);

      if (!edgeToUpdate) {
        throw new Error('Edge not found');
      }

      // 즉시 React Flow Store에서 스타일 변경
      setEdges(
        currentEdges.map(edge =>
          edge.id === edgeId
            ? {
                ...edge,
                style: {
                  ...(edge.style || {}),
                  ...style,
                },
              }
            : edge
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
    updateEdgeStyle: async (input: UpdateEdgeStyleInput): Promise<boolean> => {
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
