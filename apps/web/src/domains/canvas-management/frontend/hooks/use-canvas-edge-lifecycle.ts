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

export interface UseCanvasEdgeLifecycleParams {
  pageId: string;
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
  const { getEdges: getEdgesRaw, setEdges: setEdgesRaw, getNodes } =
    useReactFlow();

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
    pageId,
    reactFlow: {
      getEdges,
      setEdges,
    },
  });

  const { updateEdgeShape, isUpdating: isUpdatingShape } = useUpdateEdgeShape({
    pageId,
    reactFlow: {
      getEdges,
      setEdges,
    },
  });

  const { updateEdgeLabel, isUpdating: isUpdatingLabel } = useUpdateEdgeLabel({
    pageId,
    reactFlow: {
      getEdges,
      setEdges,
    },
  });

  const { updateEdgeStyle, isUpdating: isUpdatingStyle } = useUpdateEdgeStyle({
    pageId,
    reactFlow: {
      getEdges,
      setEdges,
    },
  });

  const { updateEdgeMarker, isUpdating: isUpdatingMarkers } =
    useUpdateEdgeMarkers({
      pageId,
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
    createEdge,
    deleteEdge,
    updateEdgeShape,
    updateEdgeLabel,
    updateEdgeStyle,
    updateEdgeMarker,
    reconnectEdge,

    // 로딩 상태 (개별 상태 노출)
    isCreating,
    isDeleting,
    isUpdatingShape,
    isUpdatingLabel,
    isUpdatingStyle,
    isUpdatingMarkers,
    isReconnecting,

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
