'use client';

import { useMutation } from '@tanstack/react-query';
import type { Edge } from '@xyflow/react';

import { deleteEdgeAction } from '@/domains/canvas-management/actions/edge/delete-edge.action';
import {
  type DeleteEdgeRequestInput,
  DeleteEdgeRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests';
import type { EdgeData } from '@/domains/canvas-management/shared/types/common.types';
import { isFailure } from '@/lib';

export type ReactFlowDependencies = {
  getEdges: () => Edge<EdgeData>[];
  setEdges: (edges: Edge<EdgeData>[]) => void;
};

export type UseDeleteEdgeParams = {
  pageId: string;
  reactFlow: ReactFlowDependencies;
};

export type DeleteEdgeInput = {
  edgeId: string;
};

export type UseDeleteEdgeResult = {
  deleteEdge: (input: DeleteEdgeInput) => Promise<boolean>;
  isDeleting: boolean;
};

/**
 * 엣지 삭제 도메인 훅 (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 제거 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 복원 (onError)
 * - 로딩 상태 자동 관리
 */
export function useDeleteEdge(
  params: UseDeleteEdgeParams
): UseDeleteEdgeResult {
  const { pageId, reactFlow } = params;
  const { getEdges, setEdges } = reactFlow;

  const mutation = useMutation({
    mutationFn: async (edgeId: string) => {
      const rawRequest: DeleteEdgeRequestInput = {
        pageId,
        edgeId,
      };

      const parseResult = DeleteEdgeRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid edge delete data');
      }

      // Server Action
      const result = await deleteEdgeAction(parseResult.data);

      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result;
    },

    // Optimistic Update
    onMutate: async (edgeId: string) => {
      const currentEdges = getEdges();
      const edgeToDelete = currentEdges.find(edge => edge.id === edgeId);

      if (!edgeToDelete) {
        throw new Error('Edge not found');
      }

      // 즉시 React Flow Store에서 제거
      setEdges(currentEdges.filter(edge => edge.id !== edgeId));

      // 롤백을 위한 컨텍스트 반환
      return { previousEdges: currentEdges, deletedEdge: edgeToDelete };
    },

    // 자동 복원
    onError: (error, variables, context) => {
      if (context?.previousEdges) {
        setEdges(context.previousEdges);
      }
    },
  });

  return {
    deleteEdge: async (input: DeleteEdgeInput): Promise<boolean> => {
      try {
        await mutation.mutateAsync(input.edgeId);
        return true;
      } catch (error) {
        return false;
      }
    },
    isDeleting: mutation.isPending,
  };
}
