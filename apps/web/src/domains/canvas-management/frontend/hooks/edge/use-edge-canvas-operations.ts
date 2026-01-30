'use client';

import { useCallback } from 'react';

import type { Edge } from '@xyflow/react';

import type { EdgeData } from '../../../shared/types/common.types';

export type ReactFlowDependencies = {
  getEdges: () => Edge<EdgeData>[];
  setEdges: (
    edges:
      | Edge<EdgeData>[]
      | ((prev: Edge<EdgeData>[]) => Edge<EdgeData>[])
  ) => void;
};

export type UseEdgeCanvasOperationsParams = {
  reactFlow: ReactFlowDependencies;
  pageId: string;
};

export type UseEdgeCanvasOperationsResult = {
  addEdgeToCanvas: (
    edgeId: string,
    sourceBlockMountId: string,
    targetBlockMountId: string,
    edgeType?: string
  ) => void;
  removeEdgeFromCanvas: (edgeId: string) => void;
  setEdgeType: (edgeId: string, edgeType: string) => void;
  getAllEdges: () => Edge<EdgeData>[];
  getEdgeById: (edgeId: string) => Edge<EdgeData> | undefined;
  getEdgesByBlock: (blockMountId: string) => Edge<EdgeData>[];
  getEdgeCount: () => number;
};

/**
 * 엣지 Canvas 프로그램적 제어 Hook
 *
 * 서버 호출 없이 UI만 조작하는 함수들을 제공합니다.
 * - React Flow Store 직접 조작
 * - 순수 함수만 제공 (useCallback 사용)
 * - TanStack Query 사용 X
 */
export function useEdgeCanvasOperations(
  params: UseEdgeCanvasOperationsParams
): UseEdgeCanvasOperationsResult {
  const { reactFlow, pageId } = params;
  const { getEdges, setEdges } = reactFlow;

  /**
   * 프로그램적 제어: UI에만 엣지 추가 (서버 저장 X)
   */
  const addEdgeToCanvas = useCallback(
    (
      edgeId: string,
      sourceBlockMountId: string,
      targetBlockMountId: string,
      edgeType: string = 'default'
    ) => {
      const newEdge: Edge<EdgeData> = {
        id: edgeId,
        source: sourceBlockMountId,
        target: targetBlockMountId,
        type: edgeType,
        data: {
          edgeId,
          actualEdgeShape: 'default',
          pageId,
        },
      };

      const currentEdges = getEdges();
      setEdges([...currentEdges, newEdge]);
    },
    [getEdges, setEdges, pageId]
  );

  /**
   * 프로그램적 제어: UI에서만 엣지 제거 (서버 저장 X)
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

  /**
   * 모든 엣지 조회
   */
  const getAllEdges = useCallback((): Edge<EdgeData>[] => {
    return getEdges() as Edge<EdgeData>[];
  }, [getEdges]);

  /**
   * 특정 엣지 조회
   */
  const getEdgeById = useCallback(
    (edgeId: string): Edge<EdgeData> | undefined => {
      const edges = getEdges() as Edge<EdgeData>[];
      return edges.find(edge => edge.id === edgeId);
    },
    [getEdges]
  );

  /**
   * 특정 블럭과 연결된 엣지들 조회
   */
  const getEdgesByBlock = useCallback(
    (blockMountId: string): Edge<EdgeData>[] => {
      const edges = getEdges() as Edge<EdgeData>[];
      return edges.filter(
        edge => edge.source === blockMountId || edge.target === blockMountId
      );
    },
    [getEdges]
  );

  /**
   * 엣지 개수 조회
   */
  const getEdgeCount = useCallback((): number => {
    return getEdges().length;
  }, [getEdges]);

  return {
    addEdgeToCanvas,
    removeEdgeFromCanvas,
    setEdgeType,
    getAllEdges,
    getEdgeById,
    getEdgesByBlock,
    getEdgeCount,
  };
}
