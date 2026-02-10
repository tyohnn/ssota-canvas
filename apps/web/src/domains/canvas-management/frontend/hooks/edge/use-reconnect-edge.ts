'use client';

import { useMutation } from '@tanstack/react-query';
import type { Connection, Edge, Node } from '@xyflow/react';

import { updateEdgeConnectionAction } from '@/domains/canvas-management/actions/edge/update-edge-connection.action';
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
  skipOptimisticUpdate?: boolean; // Undo/Redo 시 화면 업데이트 스킵용
};

export type UseReconnectEdgeParams = {
  pageId: string;
  reactFlow: ReactFlowDependencies;
};

export type UseReconnectEdgeResult = {
  reconnectEdge: (input: ReconnectEdgeInput) => Promise<string | null>;
  isReconnecting: boolean;
};

/**
 * 엣지 재연결 도메인 훅 (Update 방식)
 *
 * 기존 엣지의 연결 정보(Source/Target)를 업데이트합니다.
 * - 삭제/생성이 아닌 Update 방식을 사용하여 Edge ID가 유지됩니다.
 * - Undo/Redo 시 ID 불일치 문제를 해결합니다.
 */
export function useReconnectEdge(
  params: UseReconnectEdgeParams
): UseReconnectEdgeResult {
  const { reactFlow } = params;
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

      const result = await updateEdgeConnectionAction({
        edgeId,
        newSourceBlockMountId,
        newTargetBlockMountId,
        newSourceHandle: sourceHandle as any, // Enum type matching needed if strict
        newTargetHandle: targetHandle as any,
      });

      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Optimistic Update: 화면 즉시 반영
    onMutate: async (input: ReconnectEdgeInput) => {
      const {
        edgeId,
        newSourceBlockMountId,
        newTargetBlockMountId,
        sourceHandle,
        targetHandle,
        skipOptimisticUpdate,
      } = input;

      if (skipOptimisticUpdate) return;

      const currentEdges = getEdges();
      const oldEdge = currentEdges.find(e => e.id === edgeId);

      if (!oldEdge) {
        console.warn(`[useReconnectEdge] Edge not found: ${edgeId}`);
        return;
      }

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

      return { previousEdges: currentEdges };
    },

    // 에러 시 롤백
    onError: (error, variables, context: any) => {
      console.error('[useReconnectEdge] Error:', error);
      if (context?.previousEdges) {
        setEdges(context.previousEdges);
      }
    },
  });

  return {
    reconnectEdge: async (input: ReconnectEdgeInput): Promise<string | null> => {
      try {
        await mutation.mutateAsync(input);
        return input.edgeId; // ID가 변하지 않으므로 기존 ID 반환
      } catch (error) {
        console.error('[useReconnectEdge] Execution failed:', error);
        return null; // 실패 시 null
      }
    },
    isReconnecting: mutation.isPending,
  };
}
