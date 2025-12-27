'use client';

import React from 'react';
import {
  ReactFlow,
  Background,
  Panel,
  SelectionMode,
  ConnectionMode,
  type Node,
  type Edge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from 'next-themes';

// Type imports
import type { CustomNodeType } from '../../acl/react-flow.acl';
import {
  BlockType,
  BLOCK_TYPE_SIZES,
} from '@/domains/block-management/shared/types/block-types';

// Canvas Management Hooks
import { useCanvasMode } from '../../hooks/use-canvas-mode';
import { useCanvasSelection } from '../../hooks/use-canvas-selection';
import { useCanvasViewport } from '../../hooks/use-canvas-viewport';
import { useCanvasBlockTransform } from '../../hooks/use-canvas-block-transform';
import { useCanvasSnapGuides } from '../../hooks/use-canvas-snap-guides';
import { useCanvasEdgeManagement } from '../../hooks/use-canvas-edge-management';
import { useCanvasBlockLifecycle } from '../../hooks/use-canvas-block-lifecycle';
import { useCanvasCallbacks } from '../../hooks/use-canvas-callbacks';

// Canvas Storage
import {
  getViewportStateFromStorage,
  setViewportStateToStorage,
} from '../../utils/canvas-storage';

// Canvas Management Components
import { CanvasToolbar } from './canvas-toolbar';
import { ViewportControls } from './viewport-controls';
import { ShadowBlockContainer } from '../shadow-block/shadow-block-container';
import { BlockAddDialog } from './block-add-dialog';
// Shared node types config
import { CANVAS_NODE_TYPES } from '../../config/node-types.config';
import { SnapGuidelines } from '../canvas/components/snap/snap-guidelines';
import { MultiSelectionToolbar } from '../canvas/components/multi-select/multi-selection-toolbar';
import { BlockMountToolbar } from '@/domains/block-management/frontend/components/block/block-mount-toolbar';
import { SelectionBoundingBox } from '../canvas/components/multi-select/selection-bounding-box';
import { CustomEdge } from '../canvas/components/edge/custom-edge';

// AI Management Components
import { AIAgentRunner } from '@/domains/ai-management/frontend/components/ai-agent-runner';
import { PdfBlock } from '@/domains/block-management/frontend/components/block/block-type/pdf';

interface CanvasReactFlowWrapperProps {
  pageId: string;
  orgId: string;
  workspaceId: string;
  initialNodes: CustomNodeType[];
  initialEdges: Edge[];
}

/**
 * Canvas React Flow Wrapper (React Flow SSOT)
 *
 * React Flow를 직접 사용하여 캔버스를 렌더링하는 컴포넌트
 * - React Flow State가 SSOT (단일 진실 공급원)
 * - Hook에서 서버 액션 래핑 메서드 제공
 * - 콜백에서 DB 저장만 담당
 */
export function CanvasReactFlowWrapper({
  pageId,
  orgId,
  workspaceId,
  initialNodes,
  initialEdges,
}: CanvasReactFlowWrapperProps) {
  // 노드 데이터에 pageId, orgId, workspaceId 추가
  const enrichedNodes = React.useMemo(
    () =>
      initialNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          pageId,
          orgId,
          workspaceId,
        },
      })),
    [initialNodes, pageId, orgId, workspaceId]
  );

  // 엣지 데이터에 pageId, orgId, workspaceId 추가 (EdgeToolbar에서 사용)
  const enrichedEdges = React.useMemo(
    () =>
      initialEdges.map(edge => ({
        ...edge,
        type: 'custom', // 모든 엣지를 커스텀 엣지로 설정
        data: {
          ...edge.data,
          pageId,
          orgId,
          workspaceId,
          actualEdgeType: edge.type || 'default', // 실제 엣지 타입 저장
        },
      })),
    [initialEdges, pageId, orgId, workspaceId]
  );

  // Theme for React Flow colorMode
  const { theme } = useTheme();

  // React Flow 상태 관리 (SSOT)
  const [nodes, setNode, onNodesChange] = useNodesState(enrichedNodes);
  const [edges, setEdge, onEdgesChange] = useEdgesState(enrichedEdges);
  const reactFlowInstance = useReactFlow();

  // Canvas Management Hooks
  const canvasMode = useCanvasMode();
  const canvasSelection = useCanvasSelection();
  const canvasViewport = useCanvasViewport();

  // PanOnScroll 동적 제어: textarea 편집 중에는 비활성화
  const panOnScrollEnabled = !canvasMode.isTextareaEditing;
  // PanOnDrag 동적 제어: 패닝 모드에서는 드래그로 패닝 가능
  const panOnDragEnabled = canvasMode.isPanningMode();
  // 🎨 블록 생성 모드 확인
  const isBlockCreationMode = canvasMode.isBlockCreationMode();
  const blockTransform = useCanvasBlockTransform({
    orgId,
    workspaceId,
  });
  const snapGuides = useCanvasSnapGuides();
  const edgeManagement = useCanvasEdgeManagement({
    pageId,
    orgId,
    workspaceId,
  });
  const blockLifecycle = useCanvasBlockLifecycle({
    pageId,
    orgId,
    workspaceId,
  });

  // React Flow Callbacks Hook
  const canvasCallbacks = useCanvasCallbacks({
    pageId,
    orgId,
    workspaceId,
    canvasMode,
    canvasSelection,
    blockTransform,
    snapGuides,
    edgeManagement,
    blockLifecycle,
  });

  // BlockAddDialog 상태 관리
  const [showAddDialog, setShowAddDialog] = React.useState(false);

  // 노드 타입 정의 - 공통 config 사용 + PDF 추가
  const nodeTypes = React.useMemo(
    () => ({
      ...CANVAS_NODE_TYPES,
      [BlockType.PDF]: PdfBlock, // Dynamic import로 추가
    }),
    []
  );

  // 엣지 타입 정의
  const edgeTypes = React.useMemo(
    () => ({
      custom: CustomEdge,
      // 다른 엣지 타입들도 여기에 추가 가능
    }),
    []
  );

  // 블럭 타입 선택 핸들러
  const handleSelectBlockType = React.useCallback(
    (blockType: BlockType) => {
      setShowAddDialog(false);
      // useCanvasCallbacks 훅의 핸들러 사용
      canvasCallbacks.handleSelectBlockType(blockType);
    },
    [canvasCallbacks.handleSelectBlockType]
  );

  // ✅ 블록 생성 모드용 onPaneClick override
  const handlePaneClick = React.useCallback(
    (event: React.MouseEvent) => {
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
      canvasCallbacks.onPaneClick(event);
    },
    [
      isBlockCreationMode,
      canvasMode,
      blockLifecycle,
      reactFlowInstance,
      canvasCallbacks.onPaneClick,
    ]
  );

  // ✅ 블록 생성 모드용 onNodeClick override
  const handleNodeClick = React.useCallback(
    (event: React.MouseEvent, node: Node) => {
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
      canvasCallbacks.onNodeClick(event, node);
    },
    [
      isBlockCreationMode,
      canvasMode,
      blockLifecycle,
      reactFlowInstance,
      canvasCallbacks.onNodeClick,
    ]
  );

  // 전역 키보드 이벤트 리스너 (React Flow 포커스 문제 우회)
  React.useEffect(() => {
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

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Cmd+V: 붙여넣기
      if (isCtrlOrCmd && event.key === 'v') {
        event.preventDefault();
        // globalThis.KeyboardEvent를 React Flow의 KeyboardEvent로 타입 캐스팅
        canvasCallbacks.onKeyDown(event as unknown as KeyboardEvent);
      }

      // Cmd+D: 복제
      if (isCtrlOrCmd && event.key === 'd') {
        event.preventDefault();
        // globalThis.KeyboardEvent를 React Flow의 KeyboardEvent로 타입 캐스팅
        canvasCallbacks.onKeyDown(event as unknown as KeyboardEvent);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [canvasCallbacks]);

  // 페이지별 초기 viewport 로드 여부 추적
  const lastLoadedPageIdRef = React.useRef<string | null>(null);

  // 초기 viewport 설정 (깜빡임 방지)
  const defaultViewport = React.useMemo(() => {
    const savedViewport = getViewportStateFromStorage(pageId);
    if (savedViewport) {
      return {
        x: savedViewport.x,
        y: savedViewport.y,
        zoom: savedViewport.zoom,
      };
    }
    // 저장된 viewport가 없으면 기본값 (fitView는 나중에 실행)
    return { x: 0, y: 0, zoom: 1 };
  }, [pageId]);

  // 페이지 변경 시 viewport 복원 또는 fitView (한 번만, 애니메이션 포함)
  React.useEffect(() => {
    // 이미 로드된 페이지면 스킵
    if (lastLoadedPageIdRef.current === pageId) {
      return;
    }

    // React Flow가 준비될 때까지 대기
    const timer = setTimeout(() => {
      const savedViewport = getViewportStateFromStorage(pageId);

      if (savedViewport) {
        // 저장된 viewport가 있으면 애니메이션과 함께 복원
        reactFlowInstance.setViewport(
          {
            x: savedViewport.x,
            y: savedViewport.y,
            zoom: savedViewport.zoom,
          },
          { duration: 400 }
        );
      } else {
        // 저장된 viewport가 없으면 fitView 실행 (애니메이션 포함)
        canvasViewport.fitToScreen();
      }

      // 로드 완료 표시
      lastLoadedPageIdRef.current = pageId;
    }, 100); // React Flow 초기화 대기

    return () => clearTimeout(timer);
  }, [pageId, reactFlowInstance, canvasViewport.fitToScreen]);

  // Viewport 변경 시 저장 (debounced)
  const handleViewportChange = React.useCallback(
    (viewport: { x: number; y: number; zoom: number }) => {
      // Storage에 저장
      setViewportStateToStorage(pageId, {
        x: viewport.x,
        y: viewport.y,
        zoom: viewport.zoom,
      });
    },
    [pageId]
  );

  // Debounce 타이머 관리
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMove = React.useCallback(
    (_event: unknown, viewport: { x: number; y: number; zoom: number }) => {
      // 기존 타이머 취소
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 500ms 후에 저장
      debounceTimerRef.current = setTimeout(() => {
        handleViewportChange(viewport);
      }, 500);
    },
    [handleViewportChange]
  );

  // 컴포넌트 언마운트 시 타이머 정리
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 트랙패드 제스처 최적화 설정 (피그마 스타일)
  // - 핀치 제스처: 줌인/줌아웃
  // - 두 손가락 스크롤: 캔버스 패닝

  // 플랫폼 감지 (Windows vs Mac)
  const isWindows = React.useMemo(() => {
    if (typeof window === 'undefined') return false;

    // 최신 방법: navigator.userAgentData 사용 (Chrome/Edge)
    if ('userAgentData' in navigator) {
      const uaData = navigator.userAgentData as { platform?: string };
      return uaData.platform?.toLowerCase().includes('win') ?? false;
    }

    // Fallback: navigator.userAgent 사용
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('win') || userAgent.includes('windows');
  }, []);

  // 플랫폼별 줌 감도 설정
  // Windows: 더 높은 감도 (0.15-0.2), Mac: 기본 감도 (0.1)
  const zoomMultiplier = React.useMemo(() => {
    return isWindows ? 0.18 : 0.1;
  }, [isWindows]);

  // 커스텀 wheel 이벤트 핸들러 (Ctrl/Cmd + Wheel로 줌)
  const handleWheel = React.useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      // Ctrl (Windows) 또는 Cmd (Mac) 키가 눌려있을 때만 줌 활성화
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Ctrl/Cmd가 눌려있지 않으면 기본 동작 (패닝) 허용
      if (!isCtrlOrCmd) {
        return;
      }

      // Input, Textarea, ContentEditable에서는 무시
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // 줌 동작 수행
      event.preventDefault();
      event.stopPropagation();

      const currentViewport = reactFlowInstance.getViewport();
      const currentZoom = currentViewport.zoom;
      const deltaY = event.deltaY;

      // deltaY가 음수면 줌인, 양수면 줌아웃
      // zoomDelta를 플랫폼별 감도로 조절
      let newZoom: number;
      if (deltaY < 0) {
        // 줌인: zoomDelta를 플랫폼별 감도로 조절
        newZoom = Math.min(currentZoom + zoomMultiplier, 2); // maxZoom
      } else {
        // 줌아웃: zoomDelta를 플랫폼별 감도로 조절
        newZoom = Math.max(currentZoom - zoomMultiplier, 0.1); // minZoom
      }

      // viewport 업데이트 (duration: 0으로 즉시 적용)
      reactFlowInstance.setViewport(
        {
          x: currentViewport.x,
          y: currentViewport.y,
          zoom: newZoom,
        },
        { duration: 0 }
      );
    },
    [reactFlowInstance, zoomMultiplier]
  );

  return (
    <div className="h-full w-full relative" onWheel={handleWheel}>
      {/* React Flow 기본 선택 박스 스타일링 */}
      <style jsx global>{`
        /* React Flow 기본 배경색 */
        .react-flow {
          background-color: hsl(var(--background)) !important;
        }

        /* React Flow Pane (캔버스 영역) */
        .react-flow__pane {
          background-color: transparent !important;
        }

        /* 선택 드래그 프리뷰 박스 (파란색 반투명) */
        .react-flow__selection {
          background: rgba(59, 130, 246, 0.08) !important;
          border: 1px dashed rgb(59, 130, 246) !important;
        }

        /* 다크모드: 선택 드래그 프리뷰 박스 */
        .dark .react-flow__selection {
          background: rgba(59, 130, 246, 0.15) !important;
          border: 1px dashed rgb(96, 165, 250) !important;
        }

        /* 선택된 노드들을 감싸는 박스는 우리 커스텀 컴포넌트 사용 */
        .react-flow__nodesselection {
          display: none !important;
        }

        /* React Flow 기본 선택 스타일 제거 (우리 커스텀 스타일 사용) */
        .react-flow__node.selected,
        .react-flow__node.selectable:focus,
        .react-flow__node.selectable:focus-visible {
          outline: none !important;
        }

        /* React Flow 기본 호버 스타일 제거 */
        .react-flow__node:hover {
          /* 우리 커스텀 호버 스타일 사용 */
        }

        /* React Flow Background 다크모드 */
        .dark .react-flow__background-pattern {
          stroke: rgba(255, 255, 255, 0.05) !important;
        }

        /* React Flow Background 라이트모드 */
        .react-flow__background-pattern {
          stroke: rgba(0, 0, 0, 0.1) !important;
        }

        /* 패닝 모드: 커서를 grab/grabbing으로 변경 */
        .react-flow.panning-mode {
          cursor: grab !important;
        }
        .react-flow.panning-mode:active {
          cursor: grabbing !important;
        }
        .react-flow.panning-mode .react-flow__node {
          cursor: grab !important;
        }
        .react-flow.panning-mode .react-flow__pane {
          cursor: grab !important;
        }
        .react-flow.panning-mode .react-flow__pane:active {
          cursor: grabbing !important;
        }

        /* 기본 모드: 커서를 default로 명시적으로 설정 (패닝 모드 해제 후 커서 복원) */
        .react-flow:not(.panning-mode):not(.block-creation-mode) {
          cursor: default !important;
        }
        .react-flow:not(.panning-mode):not(.block-creation-mode)
          .react-flow__pane {
          cursor: default !important;
        }

        /* 🎨 블록 생성 모드: 기존 블록들을 반투명하게 만들고 상호작용 차단 */
        .react-flow.block-creation-mode .react-flow__node {
          opacity: 0.4 !important;
          transition: opacity 0.2s ease !important;
          /* ✅ 노드 자체는 pointer-events 유지 (클릭 통과) */
          pointer-events: auto !important;
        }

        /* 블록 생성 모드: 블록 내부의 모든 요소만 pointer-events 차단 */
        .react-flow.block-creation-mode .react-flow__node > * {
          pointer-events: none !important;
        }

        /* 블록 생성 모드: 호버 효과 차단 */
        .react-flow.block-creation-mode .react-flow__node:hover {
          opacity: 0.4 !important;
        }

        /* 블록 생성 모드: 블록의 호버 border/outline 제거 */
        .react-flow.block-creation-mode .react-flow__node:hover > * {
          border-color: transparent !important;
          outline: none !important;
        }

        /* 블록 생성 모드: 캔버스 전체에 crosshair 커서 */
        .react-flow.block-creation-mode,
        .react-flow.block-creation-mode .react-flow__pane,
        .react-flow.block-creation-mode .react-flow__node,
        .react-flow.block-creation-mode .react-flow__node * {
          cursor: crosshair !important;
        }

        /* 블록 생성 모드: 엣지도 투명하게 */
        .react-flow.block-creation-mode .react-flow__edge {
          opacity: 0.3 !important;
          pointer-events: none !important;
        }
      `}</style>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // 기본 설정
        defaultViewport={defaultViewport}
        minZoom={0.1}
        maxZoom={2}
        // 테마 설정
        colorMode={theme === 'dark' ? 'dark' : 'light'}
        // 상호작용 설정
        nodesDraggable={!panOnDragEnabled && !isBlockCreationMode} // 블록 생성 모드에서도 드래그 비활성화
        nodesConnectable={!panOnDragEnabled && !isBlockCreationMode} // 블록 생성 모드에서도 연결 비활성화
        elementsSelectable={!panOnDragEnabled && !isBlockCreationMode} // 블록 생성 모드에서도 선택 비활성화
        selectionOnDrag={!panOnDragEnabled && !isBlockCreationMode} // 블록 생성 모드에서도 선택 박스 비활성화
        selectionMode={SelectionMode.Partial}
        connectionMode={ConnectionMode.Loose} // source/target 구분 없이 양방향 연결 허용
        // 트랙패드 제스처 설정 (피그마 스타일)
        panOnDrag={panOnDragEnabled} // 패닝 모드에서는 드래그로 패닝
        panOnScroll={panOnScrollEnabled} // 두 손가락 스크롤로 패닝 (textarea 편집 중 비활성화)
        zoomOnScroll={false} // 스크롤로 줌 비활성화
        zoomOnPinch={true} // 핀치 제스처로 줌 활성화
        // 이벤트 핸들러 (CM-003, CM-007 추가) - 블록 생성 모드용 override
        onNodeClick={handleNodeClick}
        onSelectionChange={canvasCallbacks.onSelectionChange}
        onPaneClick={handlePaneClick}
        onNodeDragStart={canvasCallbacks.onNodeDragStart}
        onNodeDrag={canvasCallbacks.onNodeDrag}
        onNodeDragStop={canvasCallbacks.onNodeDragStop}
        onConnect={canvasCallbacks.onConnect}
        onReconnect={canvasCallbacks.onReconnect}
        onReconnectStart={canvasCallbacks.onReconnectStart}
        onReconnectEnd={canvasCallbacks.onReconnectEnd}
        onNodesDelete={canvasCallbacks.onNodesDelete}
        onMove={handleMove}
        // onKeyDown은 전역 리스너로 처리 (포커스 문제 우회)
        deleteKeyCode={['Delete', 'Backspace']}
        className={`bg-muted/30 ${panOnDragEnabled ? 'panning-mode' : ''} ${isBlockCreationMode ? 'block-creation-mode' : ''}`}
      >
        <Background />

        {/* 캔버스 상단 툴바 - Panel로 ReactFlow 내부로 이동 */}
        {/* z-index: 블럭(0) < canvas-toolbar(10) < multi-selection-toolbar(50) */}
        <Panel
          position="center-left"
          className="m-0! ml-4! pointer-events-auto! z-10"
        >
          <CanvasToolbar
            pageId={pageId}
            onAddBlockClick={() => setShowAddDialog(true)}
          />
        </Panel>

        {/* 모드별 컴포넌트 렌더링 */}
        {canvasMode.isBlockCreationMode() && (
          <ShadowBlockContainer
            pageId={pageId}
            orgId={orgId}
            workspaceId={workspaceId}
          />
        )}

        {canvasMode.isMultiSelectionMode() && (
          <>
            <MultiSelectionToolbar
              pageId={pageId}
              orgId={orgId}
              workspaceId={workspaceId}
            />
            <SelectionBoundingBox orgId={orgId} workspaceId={workspaceId} />
          </>
        )}

        {/* 항상 렌더링하고 내부에서 조건 체크 (상태 업데이트 타이밍 이슈 방지) */}
        <SnapGuidelines guidelines={snapGuides.guidelines} />

        {/* 좌측 하단 AI Agent Runner - Panel로 감싸서 React Flow 이벤트 시스템 통합 */}
        <Panel
          position="bottom-left"
          className="ml-4! mb-4! pointer-events-auto!"
        >
          <AIAgentRunner
            pageId={pageId}
            workspaceId={workspaceId}
            organizationId={orgId}
          />
        </Panel>

        {/* 우측 하단 뷰포트 컨트롤 - Panel로 감싸서 React Flow 이벤트 시스템 통합 */}
        <Panel
          position="bottom-right"
          className="mr-4! mb-4! pointer-events-auto!"
        >
          <ViewportControls />
        </Panel>
      </ReactFlow>

      {/* Block Add Dialog (캔버스 밖에 위치) */}
      <BlockAddDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSelectBlockType={handleSelectBlockType}
        workspaceId={workspaceId}
      />
    </div>
  );
}
