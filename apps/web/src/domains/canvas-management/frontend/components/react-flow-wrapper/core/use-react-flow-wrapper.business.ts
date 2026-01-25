import { useCallback, useRef } from 'react';

import type { Edge, Node, OnConnect, OnReconnect } from '@xyflow/react';

import { useClipboardPaste } from '@/domains/canvas-management/frontend/components/clipboard/hooks/use-clipboard-paste';
import {
  useSyncEdgeDelete,
  useSyncNodeDelete,
} from '@/domains/canvas-management/frontend/hooks/react-flow-sync';

import type {
  BlockLifecycleDependencies,
  CanvasSelectionDependencies,
  EdgeLifecycleDependencies,
  ReactFlowDependencies,
} from './types';

/**
 * Business Logic Hook for React Flow Wrapper
 *
 * 비즈니스 로직 및 서버 액션 호출
 */
export interface ReactFlowWrapperBusinessLogic {
  // Edge 관련
  onConnectStart: (
    event: MouseEvent | TouchEvent,
    params: { nodeId: string | null; handleId: string | null }
  ) => void;
  onConnect: OnConnect;
  onReconnect: OnReconnect;
  onReconnectStart: () => void;
  onReconnectEnd: (event: MouseEvent | TouchEvent, edge: Edge) => Promise<void>;

  // Delete 관련
  onNodesDelete: (deletedNodes: Node[]) => Promise<void>;
  onEdgesDelete: (deletedEdges: Edge[]) => Promise<void>;

  // Keyboard 관련 (실제 동작만 수행)
  handlePaste: () => void;
  handleDuplicate: () => Promise<void>;

  // Resize 관련
  handleNodeResize: (
    nodeId: string,
    newWidth: number,
    newHeight: number
  ) => Promise<void>;
}

export interface ReactFlowWrapperBusinessDependencies {
  pageId: string;
  canvasSelection: CanvasSelectionDependencies;
  edgeLifecycle: {
    createEdge: EdgeLifecycleDependencies['createEdge'];
    reconnectEdge: EdgeLifecycleDependencies['reconnectEdge'];
    deleteEdge: EdgeLifecycleDependencies['deleteEdge'];
  };
  blockLifecycle: {
    createAndMountBlock: BlockLifecycleDependencies['createAndMountBlock'];
    softDeleteBlockMounts: BlockLifecycleDependencies['softDeleteBlockMounts'];
    duplicateBlockAndMount: BlockLifecycleDependencies['duplicateBlockAndMount'];
  };
  reactFlow: ReactFlowDependencies;
  updateBlockSize: (input: {
    blockMountId: string;
    newSize: { width: number; height: number };
  }) => Promise<any>;
}

export function useReactFlowWrapperBusiness(
  dependencies: ReactFlowWrapperBusinessDependencies
): ReactFlowWrapperBusinessLogic {
  const {
    pageId,
    canvasSelection,
    edgeLifecycle,
    blockLifecycle,
    reactFlow,
    updateBlockSize,
  } = dependencies;

  // React Flow 콜백용 서버 동기화 훅
  const { syncNodeDelete } = useSyncNodeDelete({ pageId });
  const { syncEdgeDelete } = useSyncEdgeDelete();

  // 엣지 재연결 성공 여부 추적 (공식 문서 패턴)
  const edgeReconnectSuccessful = useRef(true);

  // 연결 시작 정보 저장 (ConnectionMode.Loose에서 source/target 정규화용)
  const connectStartRef = useRef<{
    nodeId: string | null;
    handleId: string | null;
  } | null>(null);

  // Clipboard paste hook - wrap to match expected signature
  const clipboardPaste = useClipboardPaste({
    pageId,
    createAndMountBlock: async (
      blockType,
      position,
      initialProperties,
      initialContent
    ) => {
      await blockLifecycle.createAndMountBlock(
        blockType,
        position,
        initialProperties,
        initialContent
      );
    },
  });

  /**
   * 연결 시작 → 드래그 시작 정보 저장
   * ConnectionMode.Loose에서 source/target 정규화에 사용
   */
  const onConnectStart = useCallback(
    (
      _event: MouseEvent | TouchEvent,
      params: { nodeId: string | null; handleId: string | null }
    ) => {
      connectStartRef.current = {
        nodeId: params.nodeId,
        handleId: params.handleId,
      };
    },
    []
  );

  /**
   * 엣지 연결 → 엣지 생성 및 서버 저장
   *
   * ConnectionMode.Loose에서는 React Flow가 source/target을 임의로 결정할 수 있음.
   * 사용자 의도는 "드래그 시작 노드 → 드래그 끝 노드" 방향이므로,
   * connectStartRef를 사용해 source/target을 정규화함.
   */
  const onConnect: OnConnect = useCallback(
    async connection => {
      // 1. 연결 유효성 확인
      if (!connection.source || !connection.target) {
        console.warn(
          '⚠️ [Canvas] Invalid connection: missing source or target',
          connection
        );
        return;
      }

      // 2. ConnectionMode.Loose에서 source/target 정규화
      // 드래그 시작 노드 = source, 드래그 끝 노드 = target
      const startNodeId = connectStartRef.current?.nodeId;
      const startHandleId = connectStartRef.current?.handleId ?? null;

      let finalSource = connection.source;
      let finalTarget = connection.target;
      let finalSourceHandle = connection.sourceHandle;
      let finalTargetHandle = connection.targetHandle;

      // 드래그 시작 노드가 connection.target과 같으면 swap 필요
      if (startNodeId && startNodeId === connection.target) {
        finalSource = connection.target;
        finalTarget = connection.source;
        finalSourceHandle = startHandleId;
        finalTargetHandle = connection.sourceHandle;
      }

      // 연결 시작 정보 초기화
      connectStartRef.current = null;

      // 3. Optimistic UI로 엣지 생성
      const result = await edgeLifecycle.createEdge({
        sourceBlockMountId: finalSource,
        targetBlockMountId: finalTarget,
        sourceHandle: finalSourceHandle,
        targetHandle: finalTargetHandle,
      });

      if (!result) {
        console.error(
          '❌ [Canvas] Edge creation failed. Check console for details.'
        );
      }
    },
    [edgeLifecycle]
  );

  /**
   * 엣지 재연결 시작
   */
  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  /**
   * 엣지 재연결
   */
  const onReconnect: OnReconnect = useCallback(
    async (oldEdge: Edge, newConnection) => {
      edgeReconnectSuccessful.current = true;

      // 재연결 수행
      const success = await edgeLifecycle.reconnectEdge({
        edgeId: oldEdge.id,
        newSourceBlockMountId: newConnection.source,
        newTargetBlockMountId: newConnection.target,
        sourceHandle: newConnection.sourceHandle,
        targetHandle: newConnection.targetHandle,
      });

      if (!success) {
        edgeReconnectSuccessful.current = false;
      }
    },
    [edgeLifecycle]
  );

  /**
   * 엣지 재연결 종료
   * 재연결에 실패하면 엣지를 삭제 (빈 공간에 드롭한 경우)
   */
  const onReconnectEnd = useCallback(
    async (_event: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        await edgeLifecycle.deleteEdge({ edgeId: edge.id });
      }

      // 다음 재연결을 위해 초기화
      edgeReconnectSuccessful.current = true;
    },
    [edgeLifecycle]
  );

  /**
   * 노드 삭제 → 블럭 마운트 및 연결된 엣지 삭제
   * Story CM-008: Delete 키 또는 Backspace 키로 블럭 삭제
   *
   * 주의: React Flow가 이미 노드를 제거한 후 이 콜백을 호출하므로,
   * UI는 이미 제거된 상태이고 서버 액션만 호출하면 됨
   */
  const onNodesDelete = useCallback(
    async (deletedNodes: Node[]) => {
      await syncNodeDelete(deletedNodes);
    },
    [syncNodeDelete]
  );

  /**
   * 엣지 삭제 → 서버 동기화
   * Delete 키 또는 Backspace 키로 엣지 삭제
   *
   * 주의: React Flow가 이미 엣지를 제거한 후 이 콜백을 호출하므로,
   * UI는 이미 제거된 상태이고 서버 액션만 호출하면 됨
   */
  const onEdgesDelete = useCallback(
    async (deletedEdges: Edge[]) => {
      await syncEdgeDelete(deletedEdges);
    },
    [syncEdgeDelete]
  );

  /**
   * 붙여넣기 동작 (비즈니스 로직)
   * UI 로직에서 키 조합 확인 후 호출
   */
  const handlePaste = useCallback(() => {
    clipboardPaste.handlePaste();
  }, [clipboardPaste]);

  /**
   * 복제 동작 (비즈니스 로직)
   * UI 로직에서 키 조합 확인 후 호출
   */
  const handleDuplicate = useCallback(async () => {
    const selectedBlocks = canvasSelection.getSelectedBlocks();
    if (selectedBlocks.length === 0) {
      return;
    }

    // 선택된 블럭들을 복제
    const currentNodes = reactFlow.getNodes();

    await Promise.all(
      selectedBlocks.map(async blockId => {
        const selectedNode = currentNodes.find(node => node.id === blockId);
        const blockMountId = (selectedNode?.data as any)?.blockMountId;
        if (!blockMountId) {
          return;
        }

        try {
          // 블럭 너비 + 50px 오프셋 계산
          const blockWidth = selectedNode?.width || 200; // 기본 너비 200px
          const offsetX = blockWidth + 50;
          const offsetY = 20; // Y축은 기본 20px

          await blockLifecycle.duplicateBlockAndMount(
            blockMountId,
            offsetX,
            offsetY
          );
        } catch (error) {
          console.error(`Failed to duplicate block ${blockId}:`, error);
        }
      })
    );
  }, [canvasSelection, reactFlow, blockLifecycle]);

  /**
   * 리사이즈 종료 → 크기 서버 저장
   * Note: React Flow의 onNodesChange에서 dimension 변경을 감지하여 처리
   * nodeId는 이미 blockMountId이므로 직접 사용
   */
  const handleNodeResize = useCallback(
    async (nodeId: string, newWidth: number, newHeight: number) => {
      const newSize = {
        width: newWidth,
        height: newHeight,
      };

      await updateBlockSize({ blockMountId: nodeId, newSize });
    },
    [updateBlockSize]
  );

  return {
    onConnectStart,
    onConnect,
    onReconnect,
    onReconnectStart,
    onReconnectEnd,
    onNodesDelete,
    onEdgesDelete,
    handlePaste,
    handleDuplicate,
    handleNodeResize,
  };
}
