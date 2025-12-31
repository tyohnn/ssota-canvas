'use client';

import { useCallback } from 'react';

import { Edge, useReactFlow } from '@xyflow/react';

import type { EdgeData } from '../../shared/types/common.types';
import { type CreateEdgeInput, useCreateEdge } from './edge/use-create-edge';
import { type DeleteEdgeInput, useDeleteEdge } from './edge/use-delete-edge';
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
import {
  type UpdateEdgeStyleInput,
  useUpdateEdgeStyle,
} from './edge/use-update-edge-style';

export interface UseCanvasEdgeManagementParams {
  pageId: string;
}

/**
 * useCanvasEdgeManagement Hook
 *
 * React Flow 기반 엣지 관리 Hook
 * - 도메인 훅들을 조합하여 통합 API 제공
 * - 기존 API 유지 (breaking change 없음)
 * - 프로그램적 제어 및 상태 읽기 기능 포함
 */
export function useCanvasEdgeManagement(params: UseCanvasEdgeManagementParams) {
  const { pageId } = params;
  const { getEdges: getEdgesRaw, setEdges, getNodes } = useReactFlow();

  // 타입 안전한 래퍼 함수
  const getEdges = useCallback((): Edge<EdgeData>[] => {
    return getEdgesRaw() as Edge<EdgeData>[];
  }, [getEdgesRaw]);

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

  const { reconnectEdge, isReconnecting } = useReconnectEdge({
    pageId,
    reactFlow: {
      getEdges,
      setEdges,
      getNodes,
    },
  });

  // ============================================================================
  // 프로그램적 제어 (UI만 변경, 서버 호출 X)
  // ============================================================================

  /**
   * 프로그램적 제어: 엣지를 React Flow Store에만 추가 (서버 저장 X)
   */
  const addEdgeToCanvas = useCallback(
    (
      edgeId: string,
      sourceBlockMountId: string,
      targetBlockMountId: string,
      edgeType: string = 'default'
    ) => {
      const newEdge: Edge = {
        id: edgeId,
        source: sourceBlockMountId,
        target: targetBlockMountId,
        type: edgeType,
        data: { edgeId },
      };

      const currentEdges = getEdges();
      setEdges([...currentEdges, newEdge]);
    },
    [getEdges, setEdges]
  );

  /**
   * 프로그램적 제어: 엣지를 React Flow Store에서만 제거 (서버 저장 X)
   */
  const removeEdgeFromCanvas = useCallback(
    (edgeId: string) => {
      const currentEdges = getEdges();
      setEdges(currentEdges.filter(edge => edge.id !== edgeId));
    },
    [getEdges, setEdges]
  );

  /**
   * 프로그램적 제어: 엣지 타입을 React Flow Store에서만 변경 (서버 저장 X)
   */
  const setEdgeType = useCallback(
    (edgeId: string, edgeType: string) => {
      const currentEdges = getEdges();
      setEdges(
        currentEdges.map(edge =>
          edge.id === edgeId ? { ...edge, type: edgeType } : edge
        )
      );
    },
    [getEdges, setEdges]
  );

  // ============================================================================
  // 상태 읽기
  // ============================================================================

  /**
   * 상태 읽기: 모든 엣지 정보 반환
   */
  const getAllEdges = useCallback((): Edge[] => {
    return getEdges();
  }, [getEdges]);

  /**
   * 상태 읽기: 특정 엣지 정보 반환
   */
  const getEdgeById = useCallback(
    (edgeId: string): Edge<EdgeData> | undefined => {
      return getEdges().find(edge => edge.id === edgeId);
    },
    [getEdges]
  );

  /**
   * 상태 읽기: 특정 블럭과 연결된 엣지들 반환
   */
  const getEdgesByBlock = useCallback(
    (blockMountId: string): Edge[] => {
      return getEdges().filter(
        edge => edge.source === blockMountId || edge.target === blockMountId
      );
    },
    [getEdges]
  );

  /**
   * 상태 읽기: 현재 엣지 개수 반환
   */
  const getEdgeCount = useCallback((): number => {
    return getEdges().length;
  }, [getEdges]);

  return {
    // Optimistic UI 제어 (사용자 액션, AI Tool Call)
    createEdge,
    deleteEdge,
    updateEdgeShape,
    updateEdgeLabel,
    updateEdgeStyle,
    reconnectEdge,

    // 프로그램적 제어 (UI만 변경, 서버 호출 X)
    addEdgeToCanvas,
    removeEdgeFromCanvas,
    setEdgeType,

    // 상태 읽기
    getAllEdges,
    getEdgeById,
    getEdgesByBlock,
    getEdgeCount,

    // 로딩 상태
    isUpdating:
      isCreating ||
      isDeleting ||
      isUpdatingShape ||
      isUpdatingLabel ||
      isUpdatingStyle ||
      isReconnecting,
  };
}
