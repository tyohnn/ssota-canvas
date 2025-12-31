'use client';

import { useMutation } from '@tanstack/react-query';
import type { Edge, Node } from '@xyflow/react';

import { EdgeShape } from '@/domains/canvas-management/frontend/components/canvas/components/edge/edge-toolbar/core/types';
import type { EdgeData } from '@/domains/canvas-management/shared/types/common.types';

import { useCreateEdge } from './use-create-edge';
import { useDeleteEdge } from './use-delete-edge';

export type ReactFlowDependencies = {
  getEdges: () => Edge<EdgeData>[];
  setEdges: (edges: Edge<EdgeData>[]) => void;
  getNodes: () => Node[];
};

export type ReconnectEdgeInput = {
  edgeId: string;
  newSourceBlockMountId: string;
  newTargetBlockMountId: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export type UseReconnectEdgeParams = {
  pageId: string;
  reactFlow: ReactFlowDependencies;
};

export type UseReconnectEdgeResult = {
  reconnectEdge: (input: ReconnectEdgeInput) => Promise<boolean>;
  isReconnecting: boolean;
};

/**
 * 엣지 재연결 도메인 훅 (TanStack Query Optimistic Update)
 *
 * 기존 엣지의 source 또는 target을 변경하여 다른 노드에 재연결
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 백그라운드 동기화 (삭제 + 생성)
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 */
export function useReconnectEdge(
  params: UseReconnectEdgeParams
): UseReconnectEdgeResult {
  const { pageId, reactFlow } = params;
  const { getEdges, setEdges, getNodes } = reactFlow;

  // 외부 훅 사용
  const { deleteEdge } = useDeleteEdge({ reactFlow });
  const { createEdge } = useCreateEdge({
    pageId,
    reactFlow,
  });

  const mutation = useMutation({
    mutationFn: async (input: ReconnectEdgeInput) => {
      const {
        edgeId,
        newSourceBlockMountId,
        newTargetBlockMountId,
        sourceHandle,
        targetHandle,
      } = input;

      // 1. 현재 엣지 정보 가져오기
      const currentEdges = getEdges();
      const oldEdge = currentEdges.find(e => e.id === edgeId);

      if (!oldEdge) {
        throw new Error(`Edge not found: ${edgeId}`);
      }

      const edgeShape = (oldEdge.data?.actualEdgeShape as string) || 'default';

      // 2. 기존 엣지 삭제 (외부 훅 사용)
      const deleteSuccess = await deleteEdge({ edgeId });
      if (!deleteSuccess) {
        throw new Error('Failed to delete edge');
      }

      // 3. 새 엣지 생성 (외부 훅 사용)
      const newEdgeView = await createEdge({
        sourceBlockMountId: newSourceBlockMountId,
        targetBlockMountId: newTargetBlockMountId,
        sourceHandle: sourceHandle || undefined,
        targetHandle: targetHandle || undefined,
        edgeShape,
      });

      if (!newEdgeView) {
        throw new Error('Failed to create edge');
      }

      return {
        oldEdge,
        newEdgeView,
        edgeShape,
      };
    },

    // Optimistic Update
    onMutate: async (input: ReconnectEdgeInput) => {
      const {
        edgeId,
        newSourceBlockMountId,
        newTargetBlockMountId,
        sourceHandle,
        targetHandle,
      } = input;

      // 노드 존재 확인
      const currentNodes = getNodes();
      const sourceNode = currentNodes.find(n => n.id === newSourceBlockMountId);
      const targetNode = currentNodes.find(n => n.id === newTargetBlockMountId);

      if (!sourceNode || !targetNode) {
        throw new Error('Source or target node not found');
      }

      // 현재 엣지 정보 가져오기
      const currentEdges = getEdges();
      const oldEdge = currentEdges.find(e => e.id === edgeId);

      if (!oldEdge) {
        throw new Error(`Edge not found: ${edgeId}`);
      }

      // Optimistic Update: 즉시 React Flow Store 반영
      const updatedEdge = {
        ...oldEdge,
        source: newSourceBlockMountId,
        target: newTargetBlockMountId,
        sourceHandle: sourceHandle || oldEdge.sourceHandle,
        targetHandle: targetHandle || oldEdge.targetHandle,
      };

      setEdges(
        currentEdges.map(edge => (edge.id === edgeId ? updatedEdge : edge))
      );

      // 롤백을 위한 컨텍스트 반환
      return {
        previousEdges: currentEdges,
        oldEdge,
        updatedEdge,
      };
    },

    // 자동 롤백
    onError: (error, variables, context) => {
      if (context?.previousEdges) {
        setEdges(context.previousEdges);
      }
    },

    // Optimistic Edge를 실제 Edge로 교체
    onSuccess: (data, variables, context) => {
      if (!context?.updatedEdge || !data.newEdgeView) return;

      const currentEdges = getEdges();
      const finalEdge: Edge<EdgeData> = {
        ...context.updatedEdge,
        id: data.newEdgeView.edgeId,
        sourceHandle: data.newEdgeView.sourceHandle,
        targetHandle: data.newEdgeView.targetHandle,
        type: 'custom',
        data: {
          edgeId: data.newEdgeView.edgeId,
          actualEdgeShape: data.newEdgeView.edgeShape as EdgeShape,
          pageId,
          createdAt: data.newEdgeView.createdAt,
          updatedAt: data.newEdgeView.updatedAt,
        },
      };

      setEdges(
        currentEdges.map(edge =>
          edge.id === variables.edgeId ? finalEdge : edge
        )
      );
    },
  });

  return {
    reconnectEdge: async (input: ReconnectEdgeInput): Promise<boolean> => {
      try {
        await mutation.mutateAsync(input);
        return true;
      } catch (error) {
        return false;
      }
    },
    isReconnecting: mutation.isPending,
  };
}
