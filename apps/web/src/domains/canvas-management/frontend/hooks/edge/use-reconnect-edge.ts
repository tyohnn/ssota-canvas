'use client';

import { useMutation } from '@tanstack/react-query';
import type { Connection, Edge, Node } from '@xyflow/react';

import { createEdgeAction } from '@/domains/canvas-management/actions/edge/create-edge.action';
import { deleteEdgeAction } from '@/domains/canvas-management/actions/edge/delete-edge.action';
import { EdgeShape } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/custom-edge/components/edge-toolbar/core/types';
import {
  CreateEdgeRequestSchema,
  DeleteEdgeRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests';
import type { EdgeData } from '@/domains/canvas-management/shared/types/common.types';
import { isFailure } from '@/lib';

export type ReactFlowDependencies = {
  getEdges: () => Edge<EdgeData>[];
  setEdges: (edges: Edge<EdgeData>[]) => void;
  getNodes: () => Node[];
};

export type ReconnectEdgeInput = {
  edgeId: string;
  newSourceBlockMountId: string;
  newTargetBlockMountId: string;
  sourceHandle: Connection['sourceHandle'];
  targetHandle: Connection['targetHandle'];
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

      // 2. 기존 엣지 삭제 (직접 서버 액션 호출, optimistic update 없음)
      const deleteRequest = DeleteEdgeRequestSchema.safeParse({ edgeId });
      if (!deleteRequest.success) {
        throw new Error('Invalid delete request');
      }

      const deleteResult = await deleteEdgeAction(deleteRequest.data);
      if (isFailure(deleteResult)) {
        throw new Error(deleteResult.error);
      }

      // 3. 새 엣지 생성 (직접 서버 액션 호출, optimistic update 없음)
      const createRequest = {
        pageId,
        sourceBlockMountId: newSourceBlockMountId,
        targetBlockMountId: newTargetBlockMountId,
        sourceHandle: sourceHandle,
        targetHandle: targetHandle,
      };

      const parseResult = CreateEdgeRequestSchema.safeParse(createRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid edge data');
      }

      const createResult = await createEdgeAction(parseResult.data);
      if (isFailure(createResult)) {
        throw new Error(createResult.error);
      }

      return {
        oldEdge,
        newEdgeView: createResult.data,
      };
    },

    // Optimistic Update: 기존 엣지를 즉시 업데이트 (깜빡임 방지)
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

      // Optimistic Update: 기존 엣지를 즉시 업데이트 (ID는 유지)
      const optimisticEdge: Edge<EdgeData> = {
        ...oldEdge,
        source: newSourceBlockMountId,
        target: newTargetBlockMountId,
        sourceHandle: sourceHandle,
        targetHandle: targetHandle,
      };

      setEdges(
        currentEdges.map(edge => (edge.id === edgeId ? optimisticEdge : edge))
      );

      // 롤백을 위한 컨텍스트 반환
      return {
        previousEdges: currentEdges,
        oldEdge,
        optimisticEdge,
      };
    },

    // 자동 롤백
    onError: (error, variables, context) => {
      console.error('[useReconnectEdge] Error:', error);
      if (context?.previousEdges) {
        setEdges(context.previousEdges);
      }
    },

    // 서버 응답 후: 새 ID로 교체
    onSuccess: (data, variables, context) => {
      if (!context?.optimisticEdge || !data.newEdgeView) return;

      const currentEdges = getEdges();

      // 기존 optimistic edge를 제거하고 새 edge를 추가
      const finalEdge: Edge<EdgeData> = {
        ...context.optimisticEdge,
        id: data.newEdgeView.edgeId, // 새 ID로 교체
        sourceHandle: data.newEdgeView.sourceHandle,
        targetHandle: data.newEdgeView.targetHandle,
        type: 'custom',
        data: {
          edgeId: data.newEdgeView.edgeId, // data.edgeId도 새 ID로 교체
          actualEdgeShape: data.newEdgeView.edgeShape as EdgeShape,
          pageId,
          createdAt: data.newEdgeView.createdAt,
          updatedAt: data.newEdgeView.updatedAt,
        },
      };

      // 기존 ID의 edge를 제거하고 새 ID의 edge를 추가
      setEdges(
        currentEdges
          .filter(edge => edge.id !== variables.edgeId) // 기존 ID 제거
          .concat(finalEdge) // 새 ID 추가
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
