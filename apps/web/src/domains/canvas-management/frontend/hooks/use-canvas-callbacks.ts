import { useCallback, useMemo, useRef } from 'react';
import {
  type Node,
  type Edge,
  type OnConnect,
  type OnReconnect,
  useReactFlow,
} from '@xyflow/react';
import { isFailure } from '@/lib/action-result';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import type { EdgeView } from '../../shared/dtos';
import { useCanvasBlockLifecycle } from './use-canvas-block-lifecycle';
import { useClipboardPaste } from '../clipboard/hooks/use-clipboard-paste';

interface UseCanvasCallbacksProps {
  pageId: string;
  orgId: string;
  workspaceId: string;
  canvasMode: {
    enterDraggingMode: (draggedIds: string[]) => void;
    enterSingleSelectionMode: (nodeId: string) => void;
    enterMultiSelectionMode: (nodeIds: string[]) => void;
    enterBlockCreationMode: (blockType: BlockType) => void;
    enterBlockEditingMode: (blockId: string) => void;
    exitToDefaultMode: () => void;
    isBlockCreationMode: () => boolean;
    isMultiSelectionMode: () => boolean;
    isSingleSelectionMode: () => boolean;
  };
  canvasSelection: {
    getSelectedBlocks: () => string[];
  };
  blockTransform: {
    saveBlockPositions: (
      blockPositions:
        | Array<{ blockId: string; position: { x: number; y: number } }>
        | { blockId: string; position: { x: number; y: number } }
    ) => Promise<any>;
    saveBlockSize: (
      nodeId: string,
      size: { width: number; height: number }
    ) => Promise<void>;
  };
  snapGuides: {
    calculateSnapGuides: (
      nodeId: string,
      position: { x: number; y: number },
      currentNodes: Node[]
    ) => { position: { x: number; y: number } };
    hideGuidelines: () => void;
  };
  edgeManagement: {
    createEdge: (
      sourceBlockMountId: string,
      targetBlockMountId: string,
      edgeShape?: string,
      sourceHandle?: string,
      targetHandle?: string
    ) => Promise<EdgeView | null>;
    reconnectEdge: (
      edgeId: string,
      newSourceBlockMountId: string,
      newTargetBlockMountId: string,
      sourceHandle?: string | null,
      targetHandle?: string | null
    ) => Promise<boolean>;
    deleteEdge: (edgeId: string) => Promise<boolean>;
  };
  blockLifecycle: {
    duplicateBlockAndMount: (
      blockMountId: string,
      offsetX?: number,
      offsetY?: number
    ) => Promise<void>;
  };
}

interface BlockNodeData {
  blockId: string;
  blockType: string;
  // ... other properties
}

/**
 * React Flow 콜백 함수들을 관리하는 커스텀 훅
 *
 * React Flow와 관련된 모든 이벤트 핸들러를 중앙에서 관리하여
 * 컴포넌트 파일을 간결하게 유지합니다.
 */
export function useCanvasCallbacks({
  pageId,
  orgId,
  workspaceId,
  canvasMode,
  canvasSelection,
  blockTransform,
  snapGuides,
  edgeManagement,
  blockLifecycle,
}: UseCanvasCallbacksProps) {
  const reactFlowInstance = useReactFlow();

  // 엣지 재연결 성공 여부 추적 (공식 문서 패턴)
  const edgeReconnectSuccessful = useRef(true);

  // Block lifecycle hook 사용
  const {
    softDeleteBlockMounts,
    createAndMountBlock: blockLifecycleCreateAndMountBlock,
  } = useCanvasBlockLifecycle({
    pageId,
    orgId,
    workspaceId,
  });

  // Clipboard paste hook - wrap to match expected signature
  const clipboardPaste = useClipboardPaste({
    pageId,
    orgId,
    workspaceId,
    createAndMountBlock: async (
      blockType,
      position,
      initialProperties,
      initialContent
    ) => {
      await blockLifecycleCreateAndMountBlock(
        blockType,
        position,
        initialProperties,
        initialContent
      );
    },
  });

  // 이전 선택 상태 추적 (무한 루프 방지)
  const previousSelectionRef = useRef<{
    count: number;
    blockId?: string;
  }>({ count: 0 });

  /**
   * 드래그 시작 → 드래그 모드 진입 및 이전 가이드라인 초기화
   */
  const onNodeDragStart = useCallback(
    (event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
      const draggedIds = draggedNodes.map(n => n.id);

      // 이전 가이드라인 초기화 (새 블럭 드래그 시 깨끗한 상태로 시작)
      snapGuides.hideGuidelines();

      canvasMode.enterDraggingMode(draggedIds);
    },
    [canvasMode.enterDraggingMode, snapGuides.hideGuidelines]
  );

  /**
   * 드래그 중 → 스냅 가이드라인 실시간 업데이트 (표시만, 스냅은 dragStop에서)
   * React Flow Helper Lines 예제: https://reactflow.dev/examples/interaction/helper-lines
   */
  const onNodeDrag = useCallback(
    (event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
      // 단일 블럭 드래그 시에만 스냅 가이드라인 표시 (스냅은 적용하지 않음)
      if (draggedNodes.length === 1) {
        const currentNodes = reactFlowInstance.getNodes();
        // 가이드라인만 계산하고 표시 (position은 변경하지 않음)
        snapGuides.calculateSnapGuides(node.id, node.position, currentNodes);
      }
    },
    [reactFlowInstance, snapGuides.calculateSnapGuides]
  );

  /**
   * 드래그 종료 → 스냅 적용 및 위치 서버 저장
   */
  const onNodeDragStop = useCallback(
    async (event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
      let finalPosition = node.position;

      // 1. 단일 블럭인 경우 최종 스냅 위치 계산 및 적용
      if (draggedNodes.length === 1) {
        const currentNodes = reactFlowInstance.getNodes();
        const snapResult = snapGuides.calculateSnapGuides(
          node.id,
          node.position,
          currentNodes
        );

        finalPosition = snapResult.position;

        // 스냅된 위치로 노드 업데이트
        if (
          snapResult.position.x !== node.position.x ||
          snapResult.position.y !== node.position.y
        ) {
          reactFlowInstance.setNodes(nodes =>
            nodes.map(n =>
              n.id === node.id ? { ...n, position: snapResult.position } : n
            )
          );
        }
      }

      // 2. 가이드라인 즉시 숨김 (서버 저장보다 먼저!)
      snapGuides.hideGuidelines();

      // 3. 이전 모드로 즉시 복귀 (서버 저장보다 먼저!)
      if (draggedNodes.length === 1) {
        canvasMode.enterSingleSelectionMode(draggedNodes[0]!.id);
      } else {
        canvasMode.enterMultiSelectionMode(draggedNodes.map(n => n.id));
      }

      // 4. 서버 저장 (백그라운드, UI 블로킹 없음)
      // await을 제거하고 Promise를 백그라운드에서 실행
      if (draggedNodes.length === 1) {
        blockTransform
          .saveBlockPositions({ blockId: node.id, position: finalPosition })
          .catch(err => {
            console.error('[Canvas] Failed to save position:', err);
          });
      } else {
        // 다중 선택인 경우 모든 노드의 위치를 한 번에 저장
        const blockPositions = draggedNodes.map(draggedNode => ({
          blockId: draggedNode.id,
          position: draggedNode.position,
        }));
        blockTransform.saveBlockPositions(blockPositions).catch(err => {
          console.error('[Canvas] Failed to save positions:', err);
        });
      }
    },
    [
      reactFlowInstance,
      snapGuides.calculateSnapGuides,
      snapGuides.hideGuidelines,
      canvasMode.enterSingleSelectionMode,
      canvasMode.enterMultiSelectionMode,
      blockTransform.saveBlockPositions,
    ]
  );

  /**
   * 리사이즈 종료 → 크기 서버 저장
   * Note: React Flow의 onNodesChange에서 dimension 변경을 감지하여 처리
   */
  const handleNodeResize = useCallback(
    async (nodeId: string, newWidth: number, newHeight: number) => {
      const newSize = {
        width: newWidth,
        height: newHeight,
      };

      await blockTransform.saveBlockSize(nodeId, newSize);
    },
    [blockTransform.saveBlockSize]
  );

  /**
   * 노드 클릭 → React Flow가 자동으로 선택 처리, 여기서는 로그만
   * 실제 모드 전환은 onSelectionChange에서 처리
   */
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // React Flow가 자동으로 선택 상태를 관리하므로
    // onSelectionChange에서 모드 전환이 처리됨
  }, []);

  /**
   * 선택 변경 → 모드 전환
   * React Flow가 이미 선택 상태를 관리하므로 모드만 전환
   * 이전 선택과 비교해서 실제로 변경된 경우에만 모드 전환 (무한 루프 방지)
   */
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      const currentCount = selectedNodes.length;
      const previousSelection = previousSelectionRef.current;

      if (currentCount > 1) {
        // 다중 선택: 이전과 다른 경우에만 업데이트
        if (previousSelection.count !== currentCount) {
          previousSelectionRef.current = { count: currentCount };
          canvasMode.enterMultiSelectionMode(selectedNodes.map(n => n.id));
        }
      } else if (currentCount === 1) {
        // 단일 선택: blockId가 변경된 경우에만 업데이트
        const node = selectedNodes[0]!;
        const nodeData = node.data as unknown as BlockNodeData;
        const blockId = nodeData?.blockId || node.id;

        // 이전 선택과 같은 blockId면 스킵
        if (previousSelection.blockId !== blockId) {
          previousSelectionRef.current = { count: 1, blockId };
          canvasMode.enterBlockEditingMode(blockId);
        }
      } else {
        // 선택 해제: 이전에 선택이 있었던 경우에만 업데이트
        if (previousSelection.count > 0) {
          previousSelectionRef.current = { count: 0 };
          canvasMode.exitToDefaultMode();
        }
      }
    },
    [canvasMode]
  );

  /**
   * 빈 영역 클릭 → 기본 모드 복귀
   * Note: block-creation 모드일 때는 SkeletonBlock에서 블럭 생성을 처리하므로 여기서는 처리하지 않음
   */
  const onPaneClick = useCallback(() => {
    // block-creation 모드일 때는 SkeletonBlock 컴포넌트에서 처리
    if (canvasMode.isBlockCreationMode()) {
      return;
    }

    // React Flow 선택 상태를 명시적으로 해제
    reactFlowInstance.setNodes(nodes =>
      nodes.map(node => ({ ...node, selected: false }))
    );

    canvasMode.exitToDefaultMode();
  }, [
    canvasMode.isBlockCreationMode,
    canvasMode.exitToDefaultMode,
    reactFlowInstance,
  ]);

  /**
   * 엣지 연결 → 엣지 생성 및 서버 저장
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

      // 2. Optimistic UI로 엣지 생성
      // Hook 내부에서 blockMountId → blockId 변환 처리
      const result = await edgeManagement.createEdge(
        connection.source, // blockMountId (React Flow 노드 ID)
        connection.target, // blockMountId (React Flow 노드 ID)
        'default', // 기본 타입, 나중에 사용자가 변경 가능
        connection.sourceHandle || undefined, // React Flow handle ID
        connection.targetHandle || undefined // React Flow handle ID
      );

      if (!result) {
        console.error(
          '❌ [Canvas] Edge creation failed. Check console for details.'
        );
      } else {
      }
    },
    [edgeManagement.createEdge]
  );

  /**
   * 엣지 재연결 시작
   */
  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
    console.log('🔄 [onReconnectStart] Edge reconnection started');
  }, []);

  /**
   * 엣지 재연결
   */
  const onReconnect: OnReconnect = useCallback(
    async (oldEdge: Edge, newConnection) => {
      console.log('🔄 [onReconnect] Reconnecting edge', {
        oldEdge,
        newConnection,
      });

      edgeReconnectSuccessful.current = true;

      // 재연결 수행
      const success = await edgeManagement.reconnectEdge(
        oldEdge.id,
        newConnection.source,
        newConnection.target,
        newConnection.sourceHandle,
        newConnection.targetHandle
      );

      if (success) {
        console.log('✅ [onReconnect] Edge reconnected successfully');
      } else {
        console.error('❌ [onReconnect] Edge reconnection failed');
        edgeReconnectSuccessful.current = false;
      }
    },
    [edgeManagement]
  );

  /**
   * 엣지 재연결 종료
   * 재연결에 실패하면 엣지를 삭제 (빈 공간에 드롭한 경우)
   */
  const onReconnectEnd = useCallback(
    async (_event: MouseEvent | TouchEvent, edge: Edge) => {
      console.log('🔄 [onReconnectEnd] Edge reconnection ended', {
        success: edgeReconnectSuccessful.current,
        edgeId: edge.id,
      });

      if (!edgeReconnectSuccessful.current) {
        // 재연결 실패 시 엣지 삭제 (빈 공간에 드롭한 경우)
        console.log(
          '🗑️ [onReconnectEnd] Deleting edge due to failed reconnection'
        );
        await edgeManagement.deleteEdge(edge.id);
      }

      // 다음 재연결을 위해 초기화
      edgeReconnectSuccessful.current = true;
    },
    [edgeManagement]
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
      // 삭제할 노드 ID들 추출
      const blockMountIds = deletedNodes.map(node => node.id);

      if (blockMountIds.length === 0) {
        return;
      }

      // softDeleteBlockMounts 훅 사용 (Optimistic 노드 처리 포함)
      await softDeleteBlockMounts(blockMountIds);
    },
    [softDeleteBlockMounts]
  );

  /**
   * 키보드 이벤트 핸들러 (Ctrl+D 복제, Ctrl+V 붙여넣기)
   */
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      console.log('[Canvas] KeyDown event:', {
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
      });

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Ctrl+V 또는 Cmd+V (Mac): 붙여넣기
      if (isCtrlOrCmd && event.key === 'v') {
        console.log('[Canvas] Paste shortcut detected (Cmd/Ctrl+V)');
        event.preventDefault();
        clipboardPaste.handlePaste();
        return;
      }

      // Ctrl+D 또는 Cmd+D (Mac): 복제
      if (isCtrlOrCmd && event.key === 'd') {
        event.preventDefault();

        const selectedBlocks = canvasSelection.getSelectedBlocks();
        if (selectedBlocks.length === 0) {
          return;
        }

        // 선택된 블럭들을 복제
        selectedBlocks.forEach(async blockId => {
          // nodes를 의존성에서 제거하고 내부에서 가져오기
          const currentNodes = reactFlowInstance.getNodes();
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
        });
      }
    },
    [
      clipboardPaste.handlePaste,
      canvasSelection.getSelectedBlocks,
      reactFlowInstance,
      blockLifecycle.duplicateBlockAndMount,
      workspaceId,
    ]
  );

  /**
   * 블럭 타입 선택 핸들러
   */
  const handleSelectBlockType = useCallback(
    (blockType: BlockType) => {
      // 선택된 블럭 타입으로 생성 모드 진입
      canvasMode.enterBlockCreationMode(blockType);
    },
    [canvasMode.enterBlockCreationMode]
  );

  // 반환 객체를 useMemo로 메모이제이션하여 불필요한 리렌더링 방지
  return useMemo(
    () => ({
      // 드래그 관련
      onNodeDragStart,
      onNodeDrag,
      onNodeDragStop,
      // 선택 관련
      onNodeClick,
      onSelectionChange,
      onPaneClick,
      // 엣지 관련
      onConnect,
      onReconnect,
      onReconnectStart,
      onReconnectEnd,
      // 삭제 관련
      onNodesDelete,
      // 키보드 관련
      onKeyDown,
      // 기타
      handleNodeResize,
      handleSelectBlockType,
    }),
    [
      onNodeDragStart,
      onNodeDrag,
      onNodeDragStop,
      onNodeClick,
      onSelectionChange,
      onPaneClick,
      onConnect,
      onReconnect,
      onReconnectStart,
      onReconnectEnd,
      onNodesDelete,
      onKeyDown,
      handleNodeResize,
      handleSelectBlockType,
    ]
  );
}
