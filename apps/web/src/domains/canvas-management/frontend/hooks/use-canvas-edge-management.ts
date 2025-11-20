import { useCallback } from 'react';
import { useReactFlow, Edge } from '@xyflow/react';
import {
  createEdgeAction,
  updateEdgeShapeAction,
  updateEdgeLabelAction,
  updateEdgeStyleAction,
  deleteEdgeAction,
} from '../../actions/edge.actions';
import {
  CreateEdgeRequestSchema,
  type CreateEdgeRequestInput,
  UpdateEdgeShapeRequestSchema,
  type UpdateEdgeShapeRequestInput,
  UpdateEdgeLabelRequestSchema,
  type UpdateEdgeLabelRequestInput,
  DeleteEdgeRequestSchema,
  type DeleteEdgeRequestInput,
} from '../../shared/dtos/requests';
import type { EdgeView } from '../../shared/dtos';
import { ActionResult, isFailure } from '@/lib/action-result';

export interface UseCanvasEdgeManagementParams {
  pageId: string;
  orgId: string;
  workspaceId: string;
}

/**
 * useCanvasEdgeManagement Hook
 *
 * React Flow 기반 엣지 관리 Hook
 * - Optimistic UI: 즉시 React Flow Store 반영 → 서버 호출 → 실패 시 롤백
 * - 프로그램적 제어: UI만 변경 (서버 호출 X)
 * - 상태 읽기: React Flow Store에서 엣지 정보 조회
 */
export function useCanvasEdgeManagement(params: UseCanvasEdgeManagementParams) {
  const { pageId, orgId, workspaceId } = params;
  const { getEdges, setEdges, getNodes } = useReactFlow();

  /**
   * 엣지 생성 요청 검증
   *
   * ⚠️ Schema Change: now uses BlockMountId instead of BlockId
   */
  const validateCreateRequest = useCallback(
    (
      sourceBlockMountId: string,
      targetBlockMountId: string,
      edgeShape: string = 'default',
      sourceHandle?: string,
      targetHandle?: string
    ) => {
      const rawRequest: CreateEdgeRequestInput = {
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
        edgeShape,
        workspaceId,
        orgId,
      };

      const parseResult = CreateEdgeRequestSchema.safeParse(rawRequest);

      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        console.error('[Frontend Validation] Invalid edge data:', {
          message: firstError?.message || 'Invalid edge data',
          issues: parseResult.error.issues,
          rawRequest,
          zodError: parseResult.error,
        });
        // TODO: toast.error로 사용자에게 피드백
        return null;
      }

      return parseResult.data;
    },
    [pageId, orgId, workspaceId]
  );

  /**
   * Optimistic 엣지 생성
   */
  const createOptimisticEdge = useCallback(
    (
      sourceBlockMountId: string,
      targetBlockMountId: string,
      edgeShape: string,
      optimisticId: string,
      sourceHandle?: string,
      targetHandle?: string
    ): Edge => {
      return {
        id: optimisticId,
        source: sourceBlockMountId,
        target: targetBlockMountId,
        sourceHandle,
        targetHandle,
        type: 'custom', // 항상 custom 타입 사용
        data: {
          isOptimistic: true,
          actualEdgeShape: edgeShape,
          pageId,
        },
      };
    },
    [pageId]
  );

  /**
   * 엣지 생성 실패 시 처리
   */
  const handleCreateEdgeFailure = useCallback(
    (
      optimisticEdgeId: string,
      result: ActionResult<EdgeView> | Error,
      currentEdges: Edge[]
    ) => {
      // Optimistic 엣지 제거
      setEdges(currentEdges);
      // 에러 처리
      if (result instanceof Error) {
        console.error('Edge creation error:', result);
      } else if (isFailure(result)) {
        console.error('Edge creation failed:', result.error);
      } else {
        console.error('Edge creation failed: Unknown error');
      }
    },
    [setEdges]
  );

  /**
   * 엣지 생성 성공 시 처리
   */
  const handleCreateEdgeSuccess = useCallback(
    (
      optimisticEdgeId: string,
      edgeView: EdgeView,
      sourceBlockMountId: string,
      targetBlockMountId: string,
      currentEdges: Edge[]
    ) => {
      // 현재 edges에서 optimistic edge 찾기
      const optimisticEdge = currentEdges.find(e => e.id === optimisticEdgeId);

      // Optimistic Edge를 실제 Edge로 교체
      const realEdge: Edge = {
        id: edgeView.edgeId,
        source: sourceBlockMountId, // ✅ blockMountId 사용 (React Flow 노드 ID)
        target: targetBlockMountId, // ✅ blockMountId 사용 (React Flow 노드 ID)
        sourceHandle: edgeView.sourceHandle, // ✅ React Flow handle ID
        targetHandle: edgeView.targetHandle, // ✅ React Flow handle ID
        type: 'custom', // 항상 custom 타입 사용
        data: {
          edgeId: edgeView.edgeId,
          actualEdgeShape: edgeView.edgeShape,
          pageId,
          orgId,
          workspaceId,
          createdAt: edgeView.createdAt,
          updatedAt: edgeView.updatedAt,
        },
      };

      const updatedEdges = currentEdges.map(edge => {
        if (edge.id === optimisticEdgeId) {
          return realEdge;
        }
        return edge;
      });

      setEdges(updatedEdges);
    },
    [pageId, orgId, workspaceId, setEdges]
  );

  /**
   * Optimistic UI: 엣지 생성
   * 즉시 React Flow Store에 추가 → 서버 호출 → 실패 시 롤백
   */
  const createEdge = useCallback(
    async (
      sourceBlockMountId: string,
      targetBlockMountId: string,
      edgeShape: string = 'default',
      sourceHandle?: string,
      targetHandle?: string
    ): Promise<EdgeView | null> => {
      // 1. 노드 데이터에서 blockId 추출
      const currentNodes = getNodes();
      const sourceNode = currentNodes.find(n => n.id === sourceBlockMountId);
      const targetNode = currentNodes.find(n => n.id === targetBlockMountId);

      if (!sourceNode || !targetNode) {
        console.warn(
          '⚠️ [useCanvasEdgeManagement] Source or target node not found',
          {
            sourceBlockMountId,
            targetBlockMountId,
            availableNodes: currentNodes.map(n => ({
              id: n.id,
              type: n.type,
            })),
          }
        );
        return null;
      }

      // ⚠️ Schema Change: edges now use blockMountId (React Flow node ID)
      // No need to extract blockId from node.data anymore

      const validatedRequest = validateCreateRequest(
        sourceBlockMountId,
        targetBlockMountId,
        edgeShape,
        sourceHandle,
        targetHandle
      );
      if (!validatedRequest) {
        console.error(
          '❌ [createEdge] Request validation failed. Check console for validation errors.'
        );
        return null;
      }

      // 3. Optimistic Edge 생성
      const optimisticEdgeId = `optimistic-edge-${Date.now()}-${Math.random()}`;
      const optimisticEdge = createOptimisticEdge(
        sourceBlockMountId,
        targetBlockMountId,
        edgeShape,
        optimisticEdgeId,
        sourceHandle,
        targetHandle
      );

      // 4. 즉시 React Flow Store에 추가
      const edgesBeforeOptimistic = getEdges();
      setEdges([...edgesBeforeOptimistic, optimisticEdge]);

      try {
        // 5. Server Action 호출
        const result = await createEdgeAction(validatedRequest);

        // 6. 결과 처리
        if (result.success) {
          // ⚠️ 중요: optimistic edge가 추가된 후의 edges 상태를 전달해야 함!
          const currentEdgesWithOptimistic = getEdges();

          handleCreateEdgeSuccess(
            optimisticEdgeId,
            result.data,
            sourceBlockMountId,
            targetBlockMountId,
            currentEdgesWithOptimistic // ✅ optimistic edge가 포함된 최신 상태
          );
          return result.data;
        } else {
          console.error(
            '❌ [createEdge] Server action failed:',
            result.error,
            result
          );
          const currentEdgesForFailure = getEdges();
          handleCreateEdgeFailure(
            optimisticEdgeId,
            result,
            currentEdgesForFailure
          );
          return null;
        }
      } catch (error) {
        // 예외 발생 시 처리
        console.error('❌ [createEdge] Exception occurred:', error);
        const currentEdgesForFailure = getEdges();
        handleCreateEdgeFailure(
          optimisticEdgeId,
          error as Error,
          currentEdgesForFailure
        );
        return null;
      }
    },
    [
      getNodes,
      validateCreateRequest,
      createOptimisticEdge,
      handleCreateEdgeSuccess,
      handleCreateEdgeFailure,
      getEdges,
      setEdges,
    ]
  );

  /**
   * 엣지 삭제 요청 검증
   */
  const validateDeleteRequest = useCallback(
    (edgeId: string) => {
      const rawRequest: DeleteEdgeRequestInput = {
        edgeId,
        workspaceId,
        orgId,
      };

      const parseResult = DeleteEdgeRequestSchema.safeParse(rawRequest);

      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        console.error('[Frontend Validation] Invalid edge delete data:', {
          message: firstError?.message || 'Invalid edge delete data',
          issues: parseResult.error.issues,
        });
        // TODO: toast.error로 사용자에게 피드백
        return null;
      }

      return parseResult.data;
    },
    [orgId, workspaceId]
  );

  /**
   * Optimistic UI: 엣지 삭제
   * 즉시 React Flow Store에서 제거 → 서버 호출 → 실패 시 복원
   */
  const deleteEdge = useCallback(
    async (edgeId: string): Promise<boolean> => {
      // 1. 요청 검증
      const validatedRequest = validateDeleteRequest(edgeId);
      if (!validatedRequest) {
        return false;
      }

      // 2. 현재 엣지 목록 백업
      const currentEdges = getEdges();
      const edgeToDelete = currentEdges.find(edge => edge.id === edgeId);

      if (!edgeToDelete) {
        console.warn('⚠️ [useCanvasEdgeManagement] Edge not found:', edgeId);
        return false;
      }

      // 3. 즉시 React Flow Store에서 제거
      setEdges(currentEdges.filter(edge => edge.id !== edgeId));

      try {
        // 4. Server Action 호출
        const result = await deleteEdgeAction(validatedRequest);

        if (!result.success) {
          console.error(
            '❌ [useCanvasEdgeManagement] Edge deletion failed:',
            result.error
          );

          // 5. 실패 시 복원
          setEdges(currentEdges);
          return false;
        }

        // 6. 성공
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
    [validateDeleteRequest, getEdges, setEdges]
  );

  /**
   * 엣지 모양 업데이트 요청 검증
   */
  const validateUpdateShapeRequest = useCallback(
    (edgeId: string, newShape: string) => {
      const rawRequest: UpdateEdgeShapeRequestInput = {
        edgeId,
        newShape,
        workspaceId,
        orgId,
      };

      const parseResult = UpdateEdgeShapeRequestSchema.safeParse(rawRequest);

      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        console.error('[Frontend Validation] Invalid edge shape update data:', {
          message: firstError?.message || 'Invalid edge shape update data',
          issues: parseResult.error.issues,
        });
        // TODO: toast.error로 사용자에게 피드백
        return null;
      }

      return parseResult.data;
    },
    [orgId, workspaceId]
  );

  /**
   * Optimistic UI: 엣지 모양 변경
   * 즉시 React Flow Store에서 변경 → 서버 호출 → 실패 시 롤백
   */
  const updateEdgeShape = useCallback(
    async (edgeId: string, newShape: string): Promise<boolean> => {
      // 1. 요청 검증
      const validatedRequest = validateUpdateShapeRequest(edgeId, newShape);
      if (!validatedRequest) {
        return false;
      }

      // 2. 현재 엣지 목록 백업
      const currentEdges = getEdges();
      const edgeToUpdate = currentEdges.find(edge => edge.id === edgeId);

      if (!edgeToUpdate) {
        console.warn('⚠️ [useCanvasEdgeManagement] Edge not found:', edgeId);
        return false;
      }

      // 3. 즉시 React Flow Store에서 모양 변경 (data.actualEdgeShape 업데이트)
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
        // 4. Server Action 호출
        const result = await updateEdgeShapeAction(validatedRequest);

        if (!result.success) {
          console.error(
            '❌ [useCanvasEdgeManagement] Edge shape update failed:',
            result.error
          );

          // 5. 실패 시 롤백
          setEdges(currentEdges);
          return false;
        }

        // 6. 성공
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
    [validateUpdateShapeRequest, getEdges, setEdges]
  );

  /**
   * 엣지 라벨 업데이트 요청 검증
   */
  const validateUpdateLabelRequest = useCallback(
    (edgeId: string, newLabel: string) => {
      const rawRequest: UpdateEdgeLabelRequestInput = {
        edgeId,
        newLabel,
        workspaceId,
        orgId,
      };

      const parseResult = UpdateEdgeLabelRequestSchema.safeParse(rawRequest);

      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        console.error('[Frontend Validation] Invalid edge label update data:', {
          message: firstError?.message || 'Invalid edge label update data',
          issues: parseResult.error.issues,
        });
        // TODO: toast.error로 사용자에게 피드백
        return null;
      }

      return parseResult.data;
    },
    [orgId, workspaceId]
  );

  /**
   * Optimistic UI: 엣지 라벨 변경
   * 즉시 React Flow Store에서 변경 → 서버 호출 → 실패 시 롤백
   */
  const updateEdgeLabel = useCallback(
    async (edgeId: string, newLabel: string): Promise<boolean> => {
      // 1. 요청 검증
      const validatedRequest = validateUpdateLabelRequest(edgeId, newLabel);
      if (!validatedRequest) {
        return false;
      }

      // 2. 현재 엣지 목록 백업
      const currentEdges = getEdges();
      const edgeToUpdate = currentEdges.find(edge => edge.id === edgeId);

      if (!edgeToUpdate) {
        console.warn('⚠️ [useCanvasEdgeManagement] Edge not found:', edgeId);
        return false;
      }

      // 3. 즉시 React Flow Store에서 라벨 변경
      setEdges(
        currentEdges.map(edge =>
          edge.id === edgeId ? { ...edge, label: newLabel } : edge
        )
      );

      try {
        // 4. Server Action 호출
        const result = await updateEdgeLabelAction(validatedRequest);

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
    [validateUpdateLabelRequest, getEdges, setEdges]
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
   * 엣지 재연결 (reconnect)
   *
   * 기존 엣지의 source 또는 target을 변경하여 다른 노드에 재연결
   * - Optimistic UI로 즉시 반영
   * - 서버에 변경사항 저장
   * - 실패 시 롤백
   */
  const reconnectEdge = useCallback(
    async (
      edgeId: string,
      newSourceBlockMountId: string,
      newTargetBlockMountId: string,
      sourceHandle?: string | null,
      targetHandle?: string | null
    ): Promise<boolean> => {
      // 1. 현재 엣지 정보 가져오기
      const currentEdges = getEdges();
      const oldEdge = currentEdges.find(e => e.id === edgeId);

      if (!oldEdge) {
        console.error('❌ [reconnectEdge] Edge not found:', edgeId);
        return false;
      }

      // 2. Optimistic Update: 즉시 React Flow Store 반영
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

      try {
        // 3. 기존 엣지 삭제
        const deleteResult = await deleteEdgeAction({
          edgeId,
          pageId,
          workspaceId,
          orgId,
        });

        if (!deleteResult.success) {
          console.error(
            '❌ [reconnectEdge] Failed to delete old edge:',
            deleteResult.error
          );
          // 롤백
          setEdges(currentEdges);
          return false;
        }

        // 4. 새 엣지 생성 (기존 엣지의 속성 유지)
        const createResult = await createEdgeAction({
          pageId,
          sourceBlockMountId: newSourceBlockMountId,
          targetBlockMountId: newTargetBlockMountId,
          sourceHandle: sourceHandle || undefined,
          targetHandle: targetHandle || undefined,
          edgeShape: (oldEdge.data?.actualEdgeShape as string) || 'default',
          workspaceId,
          orgId,
        });

        if (!createResult.success) {
          console.error(
            '❌ [reconnectEdge] Failed to create new edge:',
            createResult.error
          );
          // 롤백
          setEdges(currentEdges);
          return false;
        }

        // 5. 새로 생성된 엣지 ID로 업데이트
        const newEdgeId = createResult.data.edgeId;
        const finalEdge = {
          ...updatedEdge,
          id: newEdgeId,
          data: {
            ...updatedEdge.data,
            edgeId: newEdgeId,
            pageId,
            orgId,
            workspaceId,
          },
        };

        setEdges(
          getEdges().map(edge => (edge.id === edgeId ? finalEdge : edge))
        );

        return true;
      } catch (error) {
        console.error('❌ [reconnectEdge] Exception:', error);
        // 롤백
        setEdges(currentEdges);
        return false;
      }
    },
    [pageId, orgId, workspaceId, getEdges, setEdges]
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
  };
}
