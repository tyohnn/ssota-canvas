'use client';

import { useMutation } from '@tanstack/react-query';
import type { Connection, Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

import { createEdgeAction } from '@/domains/canvas-management/actions/edge/create-edge.action';
import { toReactFlowEdge } from '@/domains/canvas-management/frontend/acl/react-flow.acl';
import { CreateEdgeRequestSchema } from '@/domains/canvas-management/shared/dtos/requests';
import type { EdgeView } from '@/domains/canvas-management/shared/dtos/views';
import type { EdgeData } from '@/domains/canvas-management/shared/types/common.types';
import type { MarkerType as MarkerTypeValue } from '@/domains/canvas-management/shared/types/marker-type';
import { isFailure } from '@/lib';

export type ReactFlowDependencies = {
  getEdges: () => Edge<EdgeData>[];
  setEdges: (
    edges:
      | Edge<EdgeData>[]
      | ((prev: Edge<EdgeData>[]) => Edge<EdgeData>[])
  ) => void;
  getNodes: () => Node[];
};

export type UseCreateEdgeParams = {
  pageId: string;
  reactFlow: ReactFlowDependencies;
};

export type CreateEdgeInput = {
  sourceBlockMountId: string;
  targetBlockMountId: string;
  sourceHandle: Connection['sourceHandle']; // React Flow에서 string으로 전달하고 있음
  targetHandle: Connection['targetHandle']; // React Flow에서 string으로 전달하고 있음
  /** 생성 시 지정 가능한 선택 필드 */
  label?: string;
  style?: { stroke?: string; strokeWidth?: number };
  shape?: 'default' | 'straight' | 'step' | 'smoothstep' | 'simplebezier';
  markerEnd?: MarkerTypeValue;
  markerStart?: MarkerTypeValue | null;
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
        label,
        style,
        shape,
        markerEnd,
        markerStart,
      } = input;

      // Validation
      const rawRequest = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle, // string | null -> 하단 safeParse에서 EdgeHandle로 변환
        targetHandle, // string | null -> 하단 safeParse에서 EdgeHandle로 변환
        ...(label != null && { label }),
        ...(style != null && { style }),
        ...(shape != null && { shape }),
        ...(markerEnd != null && { markerEnd }),
        ...(markerStart != null && { markerStart }),
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
        label,
        style,
        shape,
        markerEnd,
        markerStart,
      } = input;

      // 노드 존재 확인
      const currentNodes = getNodes();
      const sourceNode = currentNodes.find(n => n.id === sourceBlockMountId);
      const targetNode = currentNodes.find(n => n.id === targetBlockMountId);

      if (!sourceNode || !targetNode) {
        throw new Error('Source or target node not found');
      }

      const optimisticEdgeId = `optimistic-edge-${Date.now()}-${Math.random()}`;
      const defaultStroke = '#9ca3af';
      const strokeColor = style?.stroke ?? defaultStroke;
      const strokeWidth = style?.strokeWidth ?? 2;

      const toMarkerConfig = (m: MarkerTypeValue | null | undefined) => {
        if (!m || m === 'none') return undefined;
        return {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: strokeColor,
          markerType: m,
        };
      };

      // Optimistic Edge 생성 (label, style, markerEnd, markerStart 반영)
      const optimisticEdge: Edge<EdgeData> = {
        id: optimisticEdgeId,
        source: sourceBlockMountId,
        target: targetBlockMountId,
        sourceHandle,
        targetHandle,
        type: 'custom',
        ...(label != null && label !== '' && { label }),
        style: { stroke: strokeColor, strokeWidth },
        markerEnd: toMarkerConfig(markerEnd ?? 'arrow'),
        markerStart: toMarkerConfig(markerStart ?? null),
        data: {
          edgeId: optimisticEdgeId,
          actualEdgeShape: shape ?? 'default',
          pageId,
          markerEndType: markerEnd ?? 'arrow',
          markerStartType: markerStart ?? undefined,
        },
      };

      // 즉시 React Flow Store에 추가 (함수형 업데이트로 최신 prev 기준)
      const previousEdges = getEdges();
      setEdges(prev => [...prev, optimisticEdge]);

      // 롤백을 위한 컨텍스트 반환
      return { previousEdges, optimisticEdgeId };
    },

    // 자동 롤백
    onError: (error, variables, context) => {
      if (context?.previousEdges) {
        setEdges(context.previousEdges);
      }
    },

    // Optimistic Edge를 실제 Edge(서버 edgeId)로 교체
    // 함수형 업데이트로 항상 최신 prev 기준 교체 (visual summary 등 연속 생성 시 stale getEdges 방지)
    onSuccess: (edgeView, _variables, context) => {
      if (!context?.optimisticEdgeId) return;

      const realEdge = toReactFlowEdge(edgeView) as Edge<EdgeData>;
      setEdges(prev => {
        const hasOptimistic = prev.some(e => e.id === context.optimisticEdgeId);
        if (!hasOptimistic) return prev;
        return prev.map(e =>
          e.id === context.optimisticEdgeId ? realEdge : e
        );
      });
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
