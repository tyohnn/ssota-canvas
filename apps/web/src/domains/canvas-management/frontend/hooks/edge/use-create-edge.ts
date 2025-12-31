'use client';

import { useMutation } from '@tanstack/react-query';
import type { Edge, Node } from '@xyflow/react';

import { createEdgeAction } from '@/domains/canvas-management/actions/edge/create-edge.action';
import { EdgeShape } from '@/domains/canvas-management/frontend/components/canvas/components/edge/edge-toolbar/core/types';
import { CreateEdgeRequestSchema } from '@/domains/canvas-management/shared/dtos/requests';
import type { EdgeView } from '@/domains/canvas-management/shared/dtos/views';
import type { EdgeData } from '@/domains/canvas-management/shared/types/common.types';
import { isFailure } from '@/lib/action-result';

export type ReactFlowDependencies = {
  getEdges: () => Edge<EdgeData>[];
  setEdges: (edges: Edge<EdgeData>[]) => void;
  getNodes: () => Node[];
};

export type UseCreateEdgeParams = {
  pageId: string;
  reactFlow: ReactFlowDependencies;
};

export type CreateEdgeInput = {
  sourceBlockMountId: string;
  targetBlockMountId: string;
  sourceHandle: string;
  targetHandle: string;
};

export type UseCreateEdgeResult = {
  createEdge: (input: CreateEdgeInput) => Promise<EdgeView | null>;
  isCreating: boolean;
};

/**
 * 엣지 생성 도메인 훅 (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 */
export function useCreateEdge(
  params: UseCreateEdgeParams
): UseCreateEdgeResult {
  const { pageId, reactFlow } = params;
  const { getEdges, setEdges, getNodes } = reactFlow;

  const mutation = useMutation({
    mutationFn: async (input: CreateEdgeInput) => {
      const {
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      } = input;

      // Validation
      const rawRequest = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle, // string -> safeParse에서 EdgeHandle로 변환
        targetHandle, // string -> safeParse에서 EdgeHandle로 변환
      };

      const parseResult = CreateEdgeRequestSchema.safeParse(rawRequest); //
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid edge data');
      }

      // Server Action
      const result = await createEdgeAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Optimistic Update
    onMutate: async (input: CreateEdgeInput) => {
      const {
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      } = input;
      // 노드 존재 확인
      const currentNodes = getNodes();
      const sourceNode = currentNodes.find(n => n.id === sourceBlockMountId);
      const targetNode = currentNodes.find(n => n.id === targetBlockMountId);

      if (!sourceNode || !targetNode) {
        throw new Error('Source or target node not found');
      }

      // Optimistic Edge 생성
      const optimisticEdgeId = `optimistic-edge-${Date.now()}-${Math.random()}`;
      const optimisticEdge: Edge<EdgeData> = {
        id: optimisticEdgeId,
        source: sourceBlockMountId,
        target: targetBlockMountId,
        sourceHandle,
        targetHandle,
        type: 'custom',
        data: {
          edgeId: optimisticEdgeId,
          actualEdgeShape: 'default',
          pageId,
        },
      };

      // 즉시 React Flow Store에 추가
      const currentEdges = getEdges();
      setEdges([...currentEdges, optimisticEdge]);

      // 롤백을 위한 컨텍스트 반환
      return { previousEdges: currentEdges, optimisticEdgeId };
    },

    // 자동 롤백
    onError: (error, variables, context) => {
      if (context?.previousEdges) {
        setEdges(context.previousEdges);
      }
    },

    // Optimistic Edge를 실제 Edge로 교체
    onSuccess: (edgeView, variables, context) => {
      if (!context?.optimisticEdgeId) return;

      const currentEdges = getEdges();
      const realEdge: Edge<EdgeData> = {
        id: edgeView.edgeId,
        source: variables.sourceBlockMountId,
        target: variables.targetBlockMountId,
        sourceHandle: edgeView.sourceHandle,
        targetHandle: edgeView.targetHandle,
        type: 'custom',
        data: {
          edgeId: edgeView.edgeId,
          actualEdgeShape: edgeView.edgeShape as EdgeShape,
          pageId,
          createdAt: edgeView.createdAt,
          updatedAt: edgeView.updatedAt,
        },
      };

      setEdges(
        currentEdges.map(edge =>
          edge.id === context.optimisticEdgeId ? realEdge : edge
        )
      );
    },
  });

  return {
    createEdge: async (input: CreateEdgeInput): Promise<EdgeView | null> => {
      try {
        return await mutation.mutateAsync(input);
      } catch (error) {
        return null;
      }
    },
    isCreating: mutation.isPending,
  };
}
