'use client';

import { useCallback } from 'react';

import { Edge, useReactFlow } from '@xyflow/react';

import type { EdgeData } from '../../shared/types/common.types';
import { type CreateEdgeInput, useCreateEdge } from './edge/use-create-edge';
import { type DeleteEdgeInput, useDeleteEdge } from './edge/use-delete-edge';
import { useEdgeCanvasOperations } from './edge/use-edge-canvas-operations';
import {
  type ReconnectEdgeInput,
  useReconnectEdge,
} from './edge/use-reconnect-edge';
import {
  type UpdateEdgeLabelInput,
  useUpdateEdgeLabel,
} from './edge/use-update-edge-label';
import {
  type UpdateEdgeShapeInput,
  useUpdateEdgeShape,
} from './edge/use-update-edge-shape';
import { useUpdateEdgeMarkers } from './edge/use-update-edge-markers';
import {
  type UpdateEdgeStyleInput,
  useUpdateEdgeStyle,
} from './edge/use-update-edge-style';
import { useRestoreEdge } from './edge/use-restore-edge';
import { useCanvasHistory } from '../history';

export interface UseCanvasEdgeLifecycleParams {
  pageId: string;
  reactFlow?: {
    getEdges: () => any[];
    setEdges: (updater: any) => void;
    getNodes: () => any[];
  };
}

/**
 * useCanvasEdgeLifecycle Hook
 *
 * React Flow 기반 엣지 관리 Hook
 * - 도메인 훅들을 조합하여 통합 API 제공
 * - 프로그램적 제어 및 상태 읽기 기능 포함
 */
export function useCanvasEdgeLifecycle(params: UseCanvasEdgeLifecycleParams) {
  const { pageId } = params;
  const reactFlowFromInstance = useReactFlow();
  const { 
    getEdges: getEdgesRaw, 
    setEdges: setEdgesRaw, 
    getNodes 
  } = params.reactFlow || reactFlowFromInstance;

  // 타입 안전한 래퍼 함수
  const getEdges = useCallback((): Edge<EdgeData>[] => {
    return getEdgesRaw() as Edge<EdgeData>[];
  }, [getEdgesRaw]);

  const setEdges = useCallback(
    (
      payload:
        | Edge<EdgeData>[]
        | ((prev: Edge<EdgeData>[]) => Edge<EdgeData>[])
    ) => {
      setEdgesRaw(payload as Edge[] | ((edges: Edge[]) => Edge[]));
    },
    [setEdgesRaw]
  );

  // ============================================================================
  // 도메인 훅 사용
  // ============================================================================

  const { createEdge, isCreating } = useCreateEdge({
    pageId,
    reactFlow: {
      getEdges,
      setEdges,
      getNodes,
    },
  });

  const { deleteEdge, isDeleting } = useDeleteEdge({
    reactFlow: {
      getEdges,
      setEdges,
    },
  });

  const { updateEdgeShape, isUpdating: isUpdatingShape } = useUpdateEdgeShape({
    reactFlow: {
      getEdges,
      setEdges,
    },
  });

  const { updateEdgeLabel, isUpdating: isUpdatingLabel } = useUpdateEdgeLabel({
    reactFlow: {
      getEdges,
      setEdges,
    },
  });

  const { updateEdgeStyle, isUpdating: isUpdatingStyle } = useUpdateEdgeStyle({
    reactFlow: {
      getEdges,
      setEdges,
    },
  });

  const { updateEdgeMarker, isUpdating: isUpdatingMarkers } =
    useUpdateEdgeMarkers({
      reactFlow: {
        getEdges,
        setEdges,
      },
    });

  const { reconnectEdge, isReconnecting } = useReconnectEdge({
    pageId,
    reactFlow: {
      getEdges,
      setEdges,
      getNodes,
    },
  });

  const { restoreEdge, isRestoring } = useRestoreEdge({
    pageId,
  });

  // Canvas History hook
  const history = useCanvasHistory();

  // ============================================================================
  // 히스토리 기록을 포함한 래퍼 함수
  // ============================================================================

  const createEdgeWithHistory = useCallback(
    async (input: CreateEdgeInput) => {
      console.log('[EdgeLifecycle] Creating edge:', input);
      const edgeView = await createEdge(input);
      
      // Edge 생성 성공 시 히스토리 기록 (Undo/Redo 중이 아닐 때만)
      if (history.getIsSkipping()) {
        console.log('[EdgeLifecycle] Skipping history record (Undo/Redo in progress)');
        return;
      }

      if (!edgeView) {
        console.warn('[EdgeLifecycle] Edge creation failed, no EdgeView returned');
        return;
      }

      // edgeView를 직접 사용하여 히스토리 기록
      // (타이밍 이슈: getEdges()로 찾으면 낙관적 엣지가 실제 엣지로 교체되기 전이라 못 찾을 수 있음)
      console.log('[EdgeLifecycle] Recording edge to history:', edgeView.edgeId);
      history.recordOperation({
        type: 'EDGE_ADD',
        edgeId: edgeView.edgeId,
        data: {
          // edgeView 데이터로 최소한의 엣지 정보 구성
          edge: {
            id: edgeView.edgeId,
            source: input.sourceBlockMountId,
            target: input.targetBlockMountId,
            sourceHandle: input.sourceHandle,
            targetHandle: input.targetHandle,
            type: 'custom',
            data: {
              edgeId: edgeView.edgeId,
              pageId: edgeView.pageId,
            },
          } as any,
          source: input.sourceBlockMountId,
          target: input.targetBlockMountId,
        },
      });
    },
    [createEdge, history]
  );

  const reconnectEdgeWithHistory = useCallback(
    async (input: ReconnectEdgeInput) => {
      console.log('[EdgeLifecycle] Reconnecting edge:', input);
      
      // 재연결 전에 이전 연결 정보 백업
      const previousEdge = getEdges().find(e => e.id === input.edgeId);
      
      const success = await reconnectEdge(input);
      
      // Edge 재연결 성공 시 히스토리 기록 (Undo/Redo 중이 아닐 때만)
      if (success && previousEdge && !history.getIsSkipping()) {
        console.log('[EdgeLifecycle] Edge reconnected, recording to history:', input.edgeId);
        history.recordOperation({
          type: 'EDGE_RECONNECT',
          edgeId: input.edgeId,
          data: {
            previousSource: previousEdge.source,
            previousTarget: previousEdge.target,
            previousSourceHandle: previousEdge.sourceHandle || null,
            previousTargetHandle: previousEdge.targetHandle || null,
            newSource: input.newSourceBlockMountId,
            newTarget: input.newTargetBlockMountId,
            newSourceHandle: input.sourceHandle || null,
            newTargetHandle: input.targetHandle || null,
          },
        });
      }
      
      return success;
    },
    [reconnectEdge, getEdges, history]
  );

  const restoreEdges = useCallback(
    async (edgeIds: string | string[]): Promise<void> => {
      console.log('[EdgeLifecycle] Restoring edges:', edgeIds);
      await restoreEdge({
        edgeIds,
      });
    },
    [restoreEdge]
  );

  // ============================================================================
  // 프로그램적 제어 & 상태 읽기
  // ============================================================================

  const {
    addEdgeToCanvas: addEdgeToCanvasOperation,
    removeEdgeFromCanvas: removeEdgeFromCanvasOperation,
    setEdgeType: setEdgeTypeOperation,
    getAllEdges: getAllEdgesOperation,
    getEdgeById: getEdgeByIdOperation,
    getEdgesByBlock: getEdgesByBlockOperation,
    getEdgeCount: getEdgeCountOperation,
  } = useEdgeCanvasOperations({
    reactFlow: {
      getEdges,
      setEdges,
    },
    pageId,
  });

  // ============================================================================
  // 반환값 구성
  // ============================================================================

  return {
    // Optimistic UI 제어 (사용자 액션, AI Tool Call)
    createEdge: createEdgeWithHistory,
    deleteEdge, // 히스토리 기록은 use-react-flow-wrapper.business.ts에서 처리
    updateEdgeShape,
    updateEdgeLabel,
    updateEdgeStyle,
    updateEdgeMarker,
    reconnectEdge: reconnectEdgeWithHistory,
    restoreEdges,

    // 로딩 상태 (개별 상태 노출)
    isCreating,
    isDeleting,
    isUpdatingShape,
    isUpdatingLabel,
    isUpdatingStyle,
    isUpdatingMarkers,
    isReconnecting,
    isRestoring,

    // 프로그램적 제어 (UI만 변경, 서버 호출 X)
    addEdgeToCanvas: addEdgeToCanvasOperation,
    removeEdgeFromCanvas: removeEdgeFromCanvasOperation,
    setEdgeType: setEdgeTypeOperation,

    // 상태 읽기
    getAllEdges: getAllEdgesOperation,
    getEdgeById: getEdgeByIdOperation,
    getEdgesByBlock: getEdgesByBlockOperation,
    getEdgeCount: getEdgeCountOperation,
  };
}
