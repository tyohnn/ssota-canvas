import React, { useCallback, useEffect, useMemo } from 'react';

import { useTheme } from 'next-themes';

import type { Edge, Node } from '@xyflow/react';
import { useEdgesState, useNodesState, useReactFlow } from '@xyflow/react';

import {
  BLOCK_TYPE_SIZES,
  BlockType,
} from '@/domains/block-management/shared/types/block-types';
import { CANVAS_NODE_TYPES } from '@/domains/canvas-management/frontend/config/node-types.config';
import {
  CanvasMetadata,
  useCanvasMetadata,
} from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import { useCanvasSnapGuides } from '@/domains/canvas-management/frontend/hooks/control/use-canvas-snap-guides';
import { useGroupCollision } from '@/domains/canvas-management/frontend/hooks/group';
import { useCanvasBlockLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import { useCanvasEdgeLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-edge-lifecycle';
import { useCanvasSelection } from '@/domains/canvas-management/frontend/hooks/use-canvas-selection';
import { useCanvasTransform } from '@/domains/canvas-management/frontend/hooks/use-canvas-transform';
import { useCanvasViewport } from '@/domains/canvas-management/frontend/hooks/use-canvas-viewport';

import { CustomEdge } from '../components/custom-edge';
import {
  type ReactFlowWrapperBusinessLogic,
  useReactFlowWrapperBusiness,
} from './use-react-flow-wrapper.business';
import {
  type ReactFlowWrapperUIState,
  useReactFlowWrapperUI,
} from './use-react-flow-wrapper.ui';

/**
 * Combined Hook: UI + Business Logic
 *
 * This hook serves as the single point of entry for all external dependencies
 * and manages all component logic.
 */
export interface UseReactFlowWrapperProps {
  initialNodes: Node[];
  initialEdges: Edge[];
}

export interface UseReactFlowWrapperReturn
  extends
  Omit<ReactFlowWrapperUIState, 'handleNodeDragStopUI'>,
  ReactFlowWrapperBusinessLogic {
  // React Flow State (SSOT)
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  nodeTypes: Record<string, React.ComponentType<any>>;
  edgeTypes: Record<string, React.ComponentType<any>>;

  // Theme
  colorMode: 'light' | 'dark';

  // Interaction settings
  panOnScrollEnabled: boolean;
  panOnDragEnabled: boolean;
  isBlockCreationMode: boolean;
  isPanningMode: boolean; // Used for key prop to force re-render

  // Viewport
  defaultViewport: { x: number; y: number; zoom: number };
  onMove: (
    event: unknown,
    viewport: { x: number; y: number; zoom: number }
  ) => void;

  // Drag callbacks (override UI State)
  onNodeDrag: (
    event: React.MouseEvent,
    node: Node,
    draggedNodes: Node[]
  ) => void;
  onNodeDragStop: (
    event: React.MouseEvent,
    node: Node,
    draggedNodes: Node[]
  ) => Promise<void>;

  // Custom handlers (with block creation mode override)
  handlePaneClick: (event: React.MouseEvent) => void;
  handleNodeClick: (event: React.MouseEvent, node: Node) => void;
  handleSelectBlockType: (blockType: BlockType) => void;
  handleWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  handleWheelCapture: (event: React.WheelEvent<HTMLDivElement>) => void;

  // Additional state from wrapper
  guidelines: any[];

  // Feature flags (readonly에 따라 자동 처리)
  showAIAgent: boolean;
  showBlockCreation: boolean;
}

export function useReactFlowWrapper(
  props: UseReactFlowWrapperProps,
  canvasMetadataOverride?: CanvasMetadata
): UseReactFlowWrapperReturn {
  // =========================================================================
  // 1. Gather External Dependencies and canvas metadata
  // =========================================================================
  const { initialNodes, initialEdges } = props;
  const { pageId } = useCanvasMetadata(canvasMetadataOverride);
  const { readonly } = useCanvasReadOnly();

  // =========================================================================
  // 2. React Flow State Management (SSOT)
  // =========================================================================
  const [nodes, setNode, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdge, onEdgesChange] = useEdgesState(initialEdges);

  const reactFlowInstance = useReactFlow();


  // =========================================================================
  // 3. Theme
  // =========================================================================
  const { theme } = useTheme();
  const colorMode = theme === 'dark' ? 'dark' : 'light';

  // =========================================================================
  // 4. Domain / Service Hooks (External Dependencies)
  // =========================================================================
  const canvasMode = useCanvasModeContext();
  const canvasSelection = useCanvasSelection();
  const snapGuides = useCanvasSnapGuides();

  const blockTransform = useCanvasTransform({
    pageId,
  });

  const edgeLifecycle = useCanvasEdgeLifecycle({
    pageId,
  });

  const blockLifecycle = useCanvasBlockLifecycle({
    pageId,
  });

  const canvasViewport = useCanvasViewport({
    pageId,
  });

  // Group collision detection (의존성 주입)
  const groupCollision = useGroupCollision({
    pageId,
    reactFlow: {
      getNodes: () => reactFlowInstance.getNodes(),
      setNodes: reactFlowInstance.setNodes,
    },
    groupActions: {
      addNodeToGroup: blockLifecycle.addNodeToGroup,
      removeNodeFromGroup: blockLifecycle.removeNodeFromGroup,
    },
  });

  // =========================================================================
  // 5. Interaction Settings
  // =========================================================================
  // PanOnScroll 동적 제어: textarea 편집 중에는 비활성화
  const panOnScrollEnabled = !canvasMode.isTextareaEditing;
  // PanOnDrag 동적 제어: 패닝 모드에서는 드래그로 패닝 가능, readonly일 때는 항상 패닝 가능
  const panOnDragEnabled = readonly || canvasMode.isPanningMode();
  // 🎨 블록 생성 모드 확인 (readonly일 때는 항상 false)
  const isBlockCreationMode = !readonly && canvasMode.isBlockCreationMode();

  // =========================================================================
  // 6. Node/Edge Types
  // =========================================================================
  // 노드 타입 정의 - 공통 config 사용 + PDF 추가
  const nodeTypes = useMemo(
    () => ({
      ...CANVAS_NODE_TYPES,
    }),
    []
  );

  // 엣지 타입 정의
  const edgeTypes = useMemo(
    () => ({
      custom: CustomEdge,
      // 다른 엣지 타입들도 여기에 추가 가능
    }),
    []
  );

  // =========================================================================
  // 7. Bundle Dependencies for UI/Business Hooks
  // =========================================================================
  const uiDependencies = useMemo(
    () => ({
      canvasMode,
      reactFlow: {
        getNodes: reactFlowInstance.getNodes,
        setNodes: reactFlowInstance.setNodes,
        getViewport: reactFlowInstance.getViewport,
        setViewport: reactFlowInstance.setViewport,
        screenToFlowPosition: reactFlowInstance.screenToFlowPosition,
      },
      snapGuides,
    }),
    [
      canvasMode,
      reactFlowInstance.getNodes,
      reactFlowInstance.setNodes,
      reactFlowInstance.getViewport,
      reactFlowInstance.setViewport,
      reactFlowInstance.screenToFlowPosition,
      snapGuides,
    ]
  );

  const businessDependencies = useMemo(
    () => ({
      pageId,
      canvasSelection,
      edgeLifecycle,
      blockLifecycle,
      reactFlow: {
        getNodes: reactFlowInstance.getNodes,
        setNodes: reactFlowInstance.setNodes,
        getViewport: reactFlowInstance.getViewport,
        setViewport: reactFlowInstance.setViewport,
        screenToFlowPosition: reactFlowInstance.screenToFlowPosition,
      },
      updateBlockSize: blockTransform.updateBlockSize,
    }),
    [
      pageId,
      canvasSelection,
      edgeLifecycle,
      blockLifecycle,
      reactFlowInstance.getNodes,
      reactFlowInstance.setNodes,
      reactFlowInstance.getViewport,
      reactFlowInstance.setViewport,
      reactFlowInstance.screenToFlowPosition,
      blockTransform.updateBlockSize,
    ]
  );

  // =========================================================================
  // 8. Inject into UI State Hook and Business Logic Hook
  // =========================================================================
  const uiState = useReactFlowWrapperUI(uiDependencies);
  const businessLogic = useReactFlowWrapperBusiness(businessDependencies);

  // =========================================================================
  // 9. Viewport Management
  // =========================================================================
  // Viewport 생명주기는 use-canvas-viewport.ts에서 완전히 관리
  const { defaultViewport, handleViewportChange, flushViewportSave } =
    canvasViewport;

  const onMove = useCallback(
    (_event: unknown, viewport: { x: number; y: number; zoom: number }) => {
      handleViewportChange(viewport);
    },
    [handleViewportChange]
  );

  // =========================================================================
  // 10. Custom Handlers (Block Creation Mode Override)
  // =========================================================================
  // 블럭 타입 선택 핸들러 (다이얼로그 닫기 + 블록 생성 모드 진입)
  const handleSelectBlockType = useCallback(
    (blockType: BlockType) => {
      // UI 상태: 다이얼로그 닫기
      uiState.setShowAddDialog(false);
      // 비즈니스 로직: 블록 생성 모드 진입
      canvasMode.enterBlockCreationMode(blockType);
    },
    [uiState, canvasMode]
  );

  // ✅ 블록 생성 모드용 onPaneClick override
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      // readonly일 때는 블록 생성 모드가 아니므로 일반 모드 처리
      if (readonly) {
        uiState.onPaneClick(event);
        return;
      }

      if (isBlockCreationMode) {
        const currentMode = canvasMode.getCurrentMode();
        if (currentMode.type !== 'block-creation' || !currentMode.blockType) {
          return;
        }

        const blockType = currentMode.blockType;
        const blockSize =
          BLOCK_TYPE_SIZES[blockType] ?? BLOCK_TYPE_SIZES['text'];

        const mouseFlowPosition = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const adjustedPosition = {
          x: mouseFlowPosition.x - (blockSize?.width ?? 200) / 2,
          y: mouseFlowPosition.y - (blockSize?.height ?? 150) / 2,
        };

        blockLifecycle.createAndMountBlock(blockType, adjustedPosition);
        canvasMode.exitToDefaultMode();
        return;
      }

      // 일반 모드는 기존 콜백 사용
      uiState.onPaneClick(event);
    },
    [
      readonly,
      isBlockCreationMode,
      canvasMode,
      blockLifecycle.createAndMountBlock,
      reactFlowInstance,
      uiState,
    ]
  );

  // ✅ 블록 생성 모드용 onNodeClick override
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // readonly일 때는 블록 생성 모드가 아니므로 일반 모드 처리
      if (readonly) {
        uiState.onNodeClick(event, node);
        return;
      }

      if (isBlockCreationMode) {
        const currentMode = canvasMode.getCurrentMode();
        if (currentMode.type !== 'block-creation' || !currentMode.blockType) {
          return;
        }

        const blockType = currentMode.blockType;
        const blockSize =
          BLOCK_TYPE_SIZES[blockType] ?? BLOCK_TYPE_SIZES['text'];

        const mouseFlowPosition = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const adjustedPosition = {
          x: mouseFlowPosition.x - (blockSize?.width ?? 200) / 2,
          y: mouseFlowPosition.y - (blockSize?.height ?? 150) / 2,
        };

        blockLifecycle.createAndMountBlock(blockType, adjustedPosition);
        canvasMode.exitToDefaultMode();
        return;
      }

      // 일반 모드는 기존 콜백 사용 (UI State에서)
      uiState.onNodeClick(event, node);
    },
    [
      readonly,
      isBlockCreationMode,
      canvasMode,
      blockLifecycle.createAndMountBlock,
      reactFlowInstance,
      uiState,
    ]
  );

  // =========================================================================
  // 11. Global Keyboard Event Listener (React Flow Focus Workaround)
  // =========================================================================
  useEffect(() => {
    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      // Input, Textarea, ContentEditable에서는 무시
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // 플랫폼 감지 (최신 방법)
      let isMac = false;
      if (typeof navigator !== 'undefined') {
        if ('userAgentData' in navigator) {
          const uaData = navigator.userAgentData as { platform?: string };
          isMac = uaData.platform?.toLowerCase().includes('mac') ?? false;
        } else {
          // Fallback: navigator.userAgent 사용
          const userAgent = navigator.userAgent.toLowerCase();
          isMac = userAgent.includes('mac');
        }
      }
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // readonly일 때는 편집 단축키 비활성화
      if (readonly) {
        return;
      }

      // Cmd+V: 붙여넣기
      if (isCtrlOrCmd && event.key === 'v') {
        event.preventDefault();
        businessLogic.handlePaste();
      }

      // Cmd+D: 복제
      if (isCtrlOrCmd && event.key === 'd') {
        event.preventDefault();
        businessLogic.handleDuplicate();
      }
    };

    const handleGlobalKeyUp = (event: globalThis.KeyboardEvent) => {
      // Input, Textarea, ContentEditable에서는 무시
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Space keyup: viewport 즉시 저장
      // isPanningMode 체크를 제거 (use-canvas-toolbar에서 mode를 먼저 변경할 수 있음)
      if (event.code === 'Space') {
        // 현재 viewport를 즉시 저장 (debounce flush)
        flushViewportSave();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('keyup', handleGlobalKeyUp);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('keyup', handleGlobalKeyUp);
    };
  }, [readonly, businessLogic, canvasMode, flushViewportSave]);

  // =========================================================================
  // 12. Wrap UI Handlers with Business Logic
  // =========================================================================

  // onNodeDrag: 스냅 가이드라인 + 그룹 collision 시각 피드백
  const onNodeDrag = useCallback(
    (event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
      if (readonly) return;

      // 1. 기존 UI 로직 실행 (스냅 가이드라인 표시)
      uiState.onNodeDrag(event, node, draggedNodes);

      // 2. 그룹 collision 시각 피드백
      const allNodes = reactFlowInstance.getNodes();
      const groupNodes = allNodes.filter(n => n.type === 'group' && !draggedNodes.some(d => d.id === n.id));

      // 드래그 중인 노드가 그룹인 경우는 collision 표시 안 함
      const isDraggingGroup = draggedNodes.some(n => n.type === 'group');
      if (isDraggingGroup) {
        // 모든 그룹의 collision 상태 제거
        reactFlowInstance.setNodes(prev =>
          prev.map(n =>
            n.type === 'group' && (n.data as any)?.isCollisionTarget
              ? { ...n, data: { ...n.data, isCollisionTarget: false } }
              : n
          )
        );
        return;
      }

      // 중심점 계산 (useGroupCollision의 유틸리티 함수 사용)
      const checkPoint = groupCollision.calculateCentroid(draggedNodes);

      // 충돌하는 그룹 찾기 (useGroupCollision의 유틸리티 함수 사용)
      let collidingGroupId: string | null = null;
      for (const g of groupNodes) {
        if (groupCollision.isPointInsideGroup(checkPoint, g)) {
          collidingGroupId = g.id;
          break;
        }
      }

      // 그룹 노드들의 isCollisionTarget 상태 업데이트
      reactFlowInstance.setNodes(prev =>
        prev.map(n => {
          if (n.type !== 'group') return n;
          const shouldHighlight = n.id === collidingGroupId;
          const currentHighlight = (n.data as any)?.isCollisionTarget === true;
          if (shouldHighlight !== currentHighlight) {
            return { ...n, data: { ...n.data, isCollisionTarget: shouldHighlight } };
          }
          return n;
        })
      );
    },
    [readonly, uiState, reactFlowInstance, groupCollision]
  );

  // onNodeDragStop: UI 로직(스냅, 가이드라인) + Collision 감지 + 서버 저장
  const onNodeDragStop = useCallback(
    async (
      event: React.MouseEvent,
      node: Node,
      draggedNodes: Node[]
    ): Promise<void> => {
      // readonly일 때는 드래그 중지 처리하지 않음
      if (readonly) {
        return;
      }

      // 1. UI 로직 먼저 실행 (스냅 적용, 가이드라인 숨김, 모드 변경)
      uiState.handleNodeDragStopUI(event, node, draggedNodes);

      // 2. 모든 그룹의 collision 하이라이트 제거
      reactFlowInstance.setNodes(prev =>
        prev.map(n =>
          n.type === 'group' && (n.data as any)?.isCollisionTarget
            ? { ...n, data: { ...n.data, isCollisionTarget: false } }
            : n
        )
      );

      // 3. Collision Detection (다중 선택의 중심점 기준으로 처리)
      const collisionHandled = await groupCollision.handleNodeDragStop(draggedNodes);

      // 4. 서버 저장 (collision이 처리되지 않은 경우만)
      if (!collisionHandled) {
        const blockPositions = draggedNodes.map(draggedNode => ({
          blockMountId: draggedNode.id,
          position: draggedNode.position,
        }));

        await blockTransform.updateBlockPosition({ blockPositions });
      }
    },
    [readonly, uiState, blockTransform, groupCollision, reactFlowInstance]
  );

  // readonly일 때 편집 관련 핸들러를 no-op으로 처리
  const readonlyOnNodesDelete = useCallback(
    async (_deletedNodes: Node[]) => {
      // readonly일 때는 삭제하지 않음
    },
    []
  );

  const readonlyOnEdgesDelete = useCallback(
    async (_deletedEdges: Edge[]) => {
      // readonly일 때는 삭제하지 않음
    },
    []
  );

  const readonlyOnConnect = useCallback(() => {
    // readonly일 때는 연결하지 않음
  }, []);

  const readonlyOnReconnect = useCallback(() => {
    // readonly일 때는 재연결하지 않음
    return Promise.resolve(false);
  }, []);

  const readonlyOnReconnectStart = useCallback(() => {
    // readonly일 때는 재연결 시작하지 않음
  }, []);

  const readonlyOnReconnectEnd = useCallback(async () => {
    // readonly일 때는 재연결 종료하지 않음
  }, []);

  // =========================================================================
  // 13. Feature Flags (readonly에 따라 자동 처리)
  // =========================================================================
  // readonly일 때 편집 전용 기능 비활성화
  const showAIAgent = false; // !readonly;
  const showBlockCreation = !readonly;

  // =========================================================================
  // 14. Compose and Return
  // =========================================================================

  return {
    // =========================================================================
    // State
    // =========================================================================
    // React Flow State
    nodes,
    edges,
    nodeTypes,
    edgeTypes,

    // Theme
    colorMode,

    // Interaction settings
    panOnScrollEnabled,
    panOnDragEnabled,
    isBlockCreationMode,
    isPanningMode: canvasMode.isPanningMode(), // Used for key prop to force re-render

    // Viewport
    defaultViewport,

    // UI State
    showAddDialog: uiState.showAddDialog,
    guidelines: snapGuides.guidelines,

    // =========================================================================
    // Callbacks
    // =========================================================================
    // React Flow callbacks
    onNodesChange,
    onEdgesChange,
    onMove,

    // Drag callbacks
    onNodeDragStart: uiState.onNodeDragStart,
    onNodeDrag, // collision 시각 피드백 포함
    onNodeDragStop, // 래핑된 버전 사용

    // Selection callbacks
    onNodeClick: uiState.onNodeClick,
    onSelectionChange: uiState.onSelectionChange,
    onPaneClick: uiState.onPaneClick,
    onWheel: uiState.onWheel,
    onWheelCapture: uiState.onWheelCapture,

    // Business Logic callbacks (readonly일 때는 no-op)
    onConnectStart: readonly ? () => { } : businessLogic.onConnectStart,
    onConnect: readonly ? readonlyOnConnect : businessLogic.onConnect,
    onReconnect: readonly
      ? readonlyOnReconnect
      : businessLogic.onReconnect,
    onReconnectStart: readonly
      ? readonlyOnReconnectStart
      : businessLogic.onReconnectStart,
    onReconnectEnd: readonly
      ? readonlyOnReconnectEnd
      : businessLogic.onReconnectEnd,
    onNodesDelete: readonly
      ? readonlyOnNodesDelete
      : businessLogic.onNodesDelete,
    onEdgesDelete: readonly
      ? readonlyOnEdgesDelete
      : businessLogic.onEdgesDelete,

    // =========================================================================
    // Custom Handlers
    // =========================================================================
    handlePaneClick,
    handleNodeClick,
    handleSelectBlockType,
    handleWheel: uiState.onWheel,
    handleWheelCapture: uiState.onWheelCapture,
    setShowAddDialog: uiState.setShowAddDialog,
    handlePaste: businessLogic.handlePaste,
    handleDuplicate: businessLogic.handleDuplicate,
    handleNodeResize: businessLogic.handleNodeResize,

    // Feature flags
    showAIAgent,
    showBlockCreation,
  };
}
