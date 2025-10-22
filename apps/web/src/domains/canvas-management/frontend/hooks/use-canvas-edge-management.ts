import { useCallback } from 'react';
import { useReactFlow, Edge } from '@xyflow/react';
import {
  createEdgeAction,
  updateEdgeShapeAction,
  updateEdgeLabelAction,
  updateEdgeStyleAction,
  deleteEdgeAction,
} from '../../actions/edge.actions';
import type { EdgeView } from '../../shared/dtos';

/**
 * useCanvasEdgeManagement Hook
 *
 * React Flow 기반 엣지 관리 Hook
 * - Optimistic UI: 즉시 React Flow Store 반영 → 서버 호출 → 실패 시 롤백
 * - 프로그램적 제어: UI만 변경 (서버 호출 X)
 * - 상태 읽기: React Flow Store에서 엣지 정보 조회
 */
export function useCanvasEdgeManagement(pageId: string) {
  const { getEdges, setEdges, getNodes } = useReactFlow();

  /**
   * Optimistic UI: 엣지 생성
   * 즉시 React Flow Store에 추가 → 서버 호출 → 실패 시 롤백
   */
  const createEdge = useCallback(
    async (
      sourceBlockMountId: string,
      targetBlockMountId: string,
      edgeType: string = 'default'
    ): Promise<EdgeView | null> => {
      // 1. 노드 데이터에서 blockId 추출
      const currentNodes = getNodes();
      const sourceNode = currentNodes.find(n => n.id === sourceBlockMountId);
      const targetNode = currentNodes.find(n => n.id === targetBlockMountId);

      if (!sourceNode || !targetNode) {
        console.warn(
          '⚠️ [useCanvasEdgeManagement] Source or target node not found'
        );
        return null;
      }

      const sourceBlockId = (sourceNode.data as any)?.blockId;
      const targetBlockId = (targetNode.data as any)?.blockId;

      if (!sourceBlockId || !targetBlockId) {
        console.warn(
          '⚠️ [useCanvasEdgeManagement] blockId not found in node data'
        );
        return null;
      }

      // 2. Optimistic Edge 생성
      const optimisticEdgeId = `temp-edge-${Date.now()}`;
      const optimisticEdge: Edge = {
        id: optimisticEdgeId,
        source: sourceBlockMountId,
        target: targetBlockMountId,
        type: 'custom', // 항상 custom 타입 사용
        data: {
          isOptimistic: true,
          actualEdgeShape: edgeType,
          pageId,
        },
      };

      // 3. 즉시 React Flow Store에 추가
      const currentEdges = getEdges();
      setEdges([...currentEdges, optimisticEdge]);

      try {
        // 4. Server Action 호출 (blockId 사용)
        const result = await createEdgeAction(
          pageId,
          sourceBlockId,
          targetBlockId,
          edgeType
        );

        if (!result.success) {
          console.error(
            '❌ [useCanvasEdgeManagement] Edge creation failed:',
            result.error
          );

          // 5. 실패 시 롤백 (Optimistic Edge 제거)
          setEdges(currentEdges);
          return null;
        }

        // 6. 성공 시 Optimistic Edge를 실제 Edge로 교체
        const realEdge: Edge = {
          id: result.data.edgeId,
          source: sourceBlockMountId,
          target: targetBlockMountId,
          type: 'custom', // 항상 custom 타입 사용
          data: {
            edgeId: result.data.edgeId,
            actualEdgeShape: result.data.edgeShape,
            pageId,
            createdAt: result.data.createdAt,
            updatedAt: result.data.updatedAt,
          },
        };

        setEdges(
          currentEdges
            .map(edge => (edge.id === optimisticEdgeId ? realEdge : edge))
            .concat(
              currentEdges.find(e => e.id === optimisticEdgeId)
                ? []
                : [realEdge]
            )
        );

        return result.data;
      } catch (error) {
        console.error(
          '❌ [useCanvasEdgeManagement] Edge creation error:',
          error
        );

        // 예외 발생 시 롤백
        setEdges(currentEdges);
        return null;
      }
    },
    [pageId, getEdges, setEdges, getNodes]
  );

  /**
   * Optimistic UI: 엣지 삭제
   * 즉시 React Flow Store에서 제거 → 서버 호출 → 실패 시 복원
   */
  const deleteEdge = useCallback(
    async (edgeId: string): Promise<boolean> => {
      // 1. 현재 엣지 목록 백업
      const currentEdges = getEdges();
      const edgeToDelete = currentEdges.find(edge => edge.id === edgeId);

      if (!edgeToDelete) {
        console.warn('⚠️ [useCanvasEdgeManagement] Edge not found:', edgeId);
        return false;
      }

      // 2. 즉시 React Flow Store에서 제거
      setEdges(currentEdges.filter(edge => edge.id !== edgeId));

      try {
        // 3. Server Action 호출
        const result = await deleteEdgeAction(edgeId);

        if (!result.success) {
          console.error(
            '❌ [useCanvasEdgeManagement] Edge deletion failed:',
            result.error
          );

          // 4. 실패 시 복원
          setEdges(currentEdges);
          return false;
        }

        // 5. 성공
        return true;
      } catch (error) {
        console.error(
          '❌ [useCanvasEdgeManagement] Edge deletion error:',
          error
        );

        // 예외 발생 시 복원
        setEdges(currentEdges);
        return false;
      }
    },
    [getEdges, setEdges]
  );

  /**
   * Optimistic UI: 엣지 모양 변경
   * 즉시 React Flow Store에서 변경 → 서버 호출 → 실패 시 롤백
   */
  const updateEdgeShape = useCallback(
    async (edgeId: string, newShape: string): Promise<boolean> => {
      // 1. 현재 엣지 목록 백업
      const currentEdges = getEdges();
      const edgeToUpdate = currentEdges.find(edge => edge.id === edgeId);

      if (!edgeToUpdate) {
        console.warn('⚠️ [useCanvasEdgeManagement] Edge not found:', edgeId);
        return false;
      }

      // 2. 즉시 React Flow Store에서 모양 변경 (data.actualEdgeShape 업데이트)
      const updatedEdges = currentEdges.map(edge =>
        edge.id === edgeId
          ? {
              ...edge,
              // type은 'custom'으로 유지, actualEdgeShape만 변경
              data: {
                ...edge.data,
                actualEdgeShape: newShape,
              },
            }
          : edge
      );

      // React Flow가 변경을 감지하도록 새로운 배열로 설정
      setEdges([...updatedEdges]);

      // 추가 강제 리렌더링을 위한 비동기 업데이트
      setTimeout(() => {
        const currentEdges = getEdges();
        setEdges([...currentEdges]);
      }, 0);

      try {
        // 3. Server Action 호출
        const result = await updateEdgeShapeAction(edgeId, newShape);

        if (!result.success) {
          console.error(
            '❌ [useCanvasEdgeManagement] Edge shape update failed:',
            result.error
          );

          // 4. 실패 시 롤백
          setEdges(currentEdges);
          return false;
        }

        // 5. 성공
        return true;
      } catch (error) {
        console.error(
          '❌ [useCanvasEdgeManagement] Edge shape update error:',
          error
        );

        // 예외 발생 시 롤백
        setEdges(currentEdges);
        return false;
      }
    },
    [getEdges, setEdges]
  );

  /**
   * Optimistic UI: 엣지 라벨 변경
   * 즉시 React Flow Store에서 변경 → 서버 호출 → 실패 시 롤백
   */
  const updateEdgeLabel = useCallback(
    async (edgeId: string, newLabel: string): Promise<boolean> => {
      // 1. 현재 엣지 목록 백업
      const currentEdges = getEdges();
      const edgeToUpdate = currentEdges.find(edge => edge.id === edgeId);

      if (!edgeToUpdate) {
        console.warn('⚠️ [useCanvasEdgeManagement] Edge not found:', edgeId);
        return false;
      }

      // 2. 즉시 React Flow Store에서 라벨 변경
      setEdges(
        currentEdges.map(edge =>
          edge.id === edgeId ? { ...edge, label: newLabel } : edge
        )
      );

      try {
        // 3. Server Action 호출
        const result = await updateEdgeLabelAction(edgeId, newLabel);

        if (!result.success) {
          console.error(
            '❌ [useCanvasEdgeManagement] Edge label update failed:',
            typeof result.error === 'string' ? result.error : 'Unknown error'
          );
          setEdges(currentEdges);
          return false;
        }

        return true;
      } catch (error) {
        console.error(
          '❌ [useCanvasEdgeManagement] Edge label update error:',
          error
        );

        // 예외 발생 시 롤백
        setEdges(currentEdges);
        return false;
      }
    },
    [getEdges, setEdges]
  );

  /**
   * Optimistic UI: 엣지 스타일 변경 (색상, 두께)
   * 즉시 React Flow Store에서 변경 → 서버 호출 → 실패 시 롤백
   */
  const updateEdgeStyle = useCallback(
    async (
      edgeId: string,
      style: { stroke?: string; strokeWidth?: number }
    ): Promise<boolean> => {
      // 1. 현재 엣지 목록 백업
      const currentEdges = getEdges();
      const edgeToUpdate = currentEdges.find(edge => edge.id === edgeId);

      if (!edgeToUpdate) {
        console.warn('⚠️ [useCanvasEdgeManagement] Edge not found:', edgeId);
        return false;
      }

      // 2. 즉시 React Flow Store에서 스타일 변경
      setEdges(
        currentEdges.map(edge =>
          edge.id === edgeId
            ? {
                ...edge,
                style: {
                  ...(edge.style || {}),
                  ...style,
                },
              }
            : edge
        )
      );

      try {
        // 3. Server Action 호출
        const result = await updateEdgeStyleAction(edgeId, style);

        if (!result.success) {
          console.error(
            '❌ [useCanvasEdgeManagement] Edge style update failed:',
            result.error
          );

          // 4. 실패 시 롤백
          setEdges(currentEdges);
          return false;
        }

        // 5. 성공
        return true;
      } catch (error) {
        console.error(
          '❌ [useCanvasEdgeManagement] Edge style update error:',
          error
        );

        // 예외 발생 시 롤백
        setEdges(currentEdges);
        return false;
      }
    },
    [getEdges, setEdges]
  );

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
    (edgeId: string): Edge | undefined => {
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

    // 프로그램적 제어 (UI만 변경, 서버 호출 X)
    addEdgeToCanvas,
    removeEdgeFromCanvas,
    setEdgeType,

    // 상태 읽기
    getAllEdges,
    getEdgeById,
    getEdgesByBlock,
    getEdgeCount,
  };
}
