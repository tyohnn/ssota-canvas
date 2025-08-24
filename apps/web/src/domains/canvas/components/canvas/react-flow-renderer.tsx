"use client";

import React from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  useNodesState,
  MiniMap,
  useEdgesState,
} from "@xyflow/react";
import type { ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Edge as DbEdge } from "@/db/schema";
import {
  BasicTextNode,
  ShapeNode,
  FileNode,
  MathFormulaNode,
  YoutubeNode,
  VideoNode,
  ImageNode,
  WebviewNode,
  TwitterPreviewNode,
} from "@/domains/canvas/components/react-flow-nodes";
import { useReactFlowHandler } from "@/domains/canvas/handlers/useReactFlowHandler";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { useUiLayout } from "@/domains/canvas/contexts/UiLayoutContext";
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import { useEditorControlContext } from "@/domains/canvas/contexts/EditorControlContext";
import { useReactFlowViewModel } from "@/domains/canvas/view-models/useReactFlowViewModel";
import { usePagePositionCache } from "@/domains/canvas/hooks/usePagePositionCache";
import { useReactFlowCanvasControl } from "@/domains/canvas/hooks/useReactFlowCanvasControl";
import {
  CanvasToolbar,
  type CanvasToolMode,
} from "@/domains/canvas/components/canvas/canvas-toolbar";
import { ComponentCanvasToolbar } from "@/domains/canvas/components/canvas/component-canvas-toolbar";
import { CanvasViewToolbar } from "@/domains/canvas/components/canvas/canvas-view-toolbar";

// ============================================================================
// Node Types Configuration
// ============================================================================
const nodeTypes: Record<string, React.ComponentType<any>> = {
  shape: ShapeNode,
  basic_text: BasicTextNode, // backward compatibility
  image: ImageNode,
  webview: WebviewNode,
  twitter_preview: TwitterPreviewNode,
  video: VideoNode,
  math_formula: MathFormulaNode,
  file: FileNode,
  youtube: YoutubeNode,
  // map
  // db schema
  // graph 여러개 종류
};

export function ReactFlowRenderer() {
  // ============================================================================
  // 1. Context & Data Hooks (도메인 데이터 및 상태 관리)
  // ============================================================================
  const { blocksById } = useCanvasData();
  const sel = useCanvasSelection();
  const ui = useUiLayout();
  const commands = useCanvasCommandsContext();
  const { togglePageEditor, toggleEditor } = useEditorControlContext();
  const data = useCanvasData();
  const { getPageData, loadPageData } = usePagePositionCache({
    setPagePositions: data.setPagePositions,
    accessPage: data.accessPage,
    clearPageCache: data.clearPageCache,
    getPositionsForContext: data.getPositionsForContext,
    upsertBlocks: data.upsertBlocks,
    // edges cache
    edgesById: data.edgesById,
    setContextEdges: data.setContextEdges,
    accessContextEdges: data.accessContextEdges,
    clearContextEdges: data.clearContextEdges,
    getEdgesForContext: data.getEdgesForContext,
  });

  // ============================================================================
  // 2. Context ID & Mode Resolution (컨텍스트 식별 및 모드 결정)
  // ============================================================================
  // Get selected page and component blocks from data
  const selectedPageBlock = sel.pageId ? blocksById[sel.pageId] : null;
  const selectedComponentBlock = sel.componentId
    ? blocksById[sel.componentId]
    : null;

  // Get canvas mode from selection context
  const { canvasMode } = sel;

  // Unified context id for both modes
  const contextId = React.useMemo(
    () => (canvasMode === "component" ? sel.componentId : sel.pageId) || null,
    [canvasMode, sel.pageId, sel.componentId]
  );

  // ============================================================================
  // 3. Data Loading & Caching (데이터 로딩 및 캐싱)
  // ============================================================================
  // Unified page position and edge cache
  const { positionsArray, edgesArray } = React.useMemo(() => {
    if (!contextId) {
      return { positionsArray: [], edgesArray: [] };
    }

    const cachedData = getPageData(contextId);
    if (cachedData) {
      return {
        positionsArray: cachedData.positions,
        edgesArray: cachedData.edges,
      };
    }

    return { positionsArray: [], edgesArray: [] };
  }, [contextId, getPageData]);

  // ============================================================================
  // 4. View Model Transformation (도메인 데이터 → React Flow 데이터)
  // ============================================================================
  const { nodes, edges } = useReactFlowViewModel(
    blocksById,
    positionsArray,
    contextId,
    edgesArray,
    sel.nodeIds
  );

  // ============================================================================
  // 5. React Flow State Management (React Flow 내부 상태 관리)
  // ============================================================================
  const [rfNodes, setRfNodes, onLocalNodesChange] = useNodesState(nodes);
  const [rfEdges, setRfEdges, onLocalEdgesChange] = useEdgesState(edges);
  const rfInstanceRef = React.useRef<ReactFlowInstance | null>(null);

  // ============================================================================
  // 6. Data Loading Effects (데이터 로딩 사이드 이펙트)
  // ============================================================================
  const lastLoadedContextRef = React.useRef<string | null>(null);

  // Lazy-load page data when context changes
  React.useEffect(() => {
    if (!contextId) return;
    if (getPageData(contextId)) return; // cache hit
    if (lastLoadedContextRef.current === contextId) return; // already requested
    lastLoadedContextRef.current = contextId;
    loadPageData(contextId).catch(() => {});
  }, [contextId, getPageData, loadPageData]);

  // Sync local React Flow state with view model changes
  React.useEffect(() => {
    setRfNodes(nodes);
  }, [nodes, setRfNodes]);

  React.useEffect(() => {
    setRfEdges(edges);
  }, [edges, setRfEdges]);

  // ============================================================================
  // 7. Canvas Control & Interaction (캔버스 조작 및 상호작용)
  // ============================================================================
  // Canvas control hook (tool mode, zoom, viewport adjustment)
  const {
    toolMode,
    setToolMode,
    showMiniMap,
    setShowMiniMap,
    zoomPercent,
    setZoomPercent,
    panOnDrag,
    nodesDraggable,
    elementsSelectable,
    selectionOnDrag,
    handleFitToView,
    fitViewWithPadding,
    fitViewToSelection,
    toggleMiniMap,
    onZoomPercentChange,
    onInit,
    onMove,
  } = useReactFlowCanvasControl({
    rfInstanceRef,
    showEditorPanel: ui.showEditorPanel,
    rfNodes,
    selectedNodeIds: sel.nodeIds,
    onEscape: () => {
      // ESC 키: 선택 해제 + 에디터 패널 닫기 (fit to view 비활성화)
      sel.setNodeSelection([]);
      if (ui.showEditorPanel) {
        ui.closeEditorPanel();
        // fit to view 비활성화
        // const timer = setTimeout(() => {
        //   fitViewToSelection(0.2, 600);
        // }, 100);
        // return () => clearTimeout(timer);
      }
      // fit to view 비활성화
      // else {
      //   // 에디터 패널이 이미 닫혀있으면 바로 fit to view
      //   fitViewToSelection(0.2, 600);
      // }
    },
  });

  // ============================================================================
  // 8. Event Handlers & Business Logic (이벤트 핸들러 및 비즈니스 로직)
  // ============================================================================
  // React Flow event handlers (도메인 로직)
  const handlers = useReactFlowHandler();

  // UI state and toggle handlers (UI 로직)
  const isAddOpen = ui.showBlockInsertPanel;
  const isEditOpen = ui.showEditorPanel;
  const toggleAdd = React.useCallback(() => {
    if (ui.showBlockInsertPanel) ui.closeBlockInsertPanel();
    else ui.openBlockInsertPanel();
  }, [
    ui.showBlockInsertPanel,
    ui.closeBlockInsertPanel,
    ui.openBlockInsertPanel,
  ]);

  // 공통 toggleEdit 함수 - 페이지 블록 전용 토글 사용
  const toggleEdit = React.useCallback(() => {
    togglePageEditor();
  }, [togglePageEditor]);

  // Selection change handler (React Flow → 도메인 동기화)
  const onSelectionChange = React.useCallback(
    ({ nodes }: { nodes: any[] }) => {
      const selectedIds = nodes
        .filter((node) => node.selected)
        .map((node) => node.id);
      sel.setNodeSelection(selectedIds);
    },
    [sel.setNodeSelection]
  );

  // Node and edge change handlers (도메인 로직 위임)
  const handleNodesChange = React.useCallback(
    (changes: any[]) => {
      onLocalNodesChange(changes);
      handlers._onNodesChange(changes);
    },
    [onLocalNodesChange, handlers]
  );

  const handleEdgesChange = React.useCallback(
    (changes: any[]) => {
      onLocalEdgesChange(changes);
      handlers.onEdgesChange(changes);
    },
    [onLocalEdgesChange, handlers]
  );

  // ============================================================================
  // 9. UI State & Effects (UI 상태 및 사이드 이펙트)
  // ============================================================================
  // Context menu state
  const [menu, setMenu] = React.useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  // Manual toggle state to track user's manual toggle actions

  // Auto fit to view when canvas mode changes - 활성화 (더 많은 영역 표시)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fitViewWithPadding(0.2, 600); // padding을 0.1에서 0.2로 증가
    }, 100); // Small delay to ensure nodes are rendered

    return () => clearTimeout(timer);
  }, [canvasMode, contextId, fitViewWithPadding]); // Trigger when mode or context changes

  // Auto fit to view when node selection is cleared (for editor close buttons) - 비활성화
  // React.useEffect(() => {
  //   if (sel.nodeIds.length === 0 && !ui.showEditorPanel) {
  //     // 노드 선택이 해제되고 에디터 패널이 닫혀있을 때 fitView 실행
  //     const timer = setTimeout(() => {
  //       fitViewToSelection(0.2, 600);
  //     }, 100);
  //     return () => clearTimeout(timer);
  //   }
  // }, [sel.nodeIds, ui.showEditorPanel, fitViewToSelection]);

  // Open editor panel when a node is selected - 이 useEffect는 useEditorControl에서 처리됨
  // React.useEffect(() => {
  //   if (sel.nodeIds.length > 0 && !ui.showEditorPanel && !manualToggle) {
  //     const selectedId = sel.nodeIds[0];
  //     ui.openEditorPanel(selectedId);
  //   }
  //   if (sel.nodeIds.length === 0) {
  //     setManualToggle(false);
  //   }
  // }, [sel.nodeIds, ui.showEditorPanel, manualToggle, ui.openEditorPanel]);

  // ============================================================================
  // 10. UI Event Handlers (UI 이벤트 핸들러)
  // ============================================================================
  // Context menu handler (UI 로직)
  const onNodeContextMenu = React.useCallback(
    (evt: React.MouseEvent, node: any) => {
      evt.preventDefault();
      setMenu({ id: node.id, x: evt.clientX, y: evt.clientY });
    },
    []
  );

  // Pane click handler (도메인 로직 + UI 로직 조합)
  const handlePaneClick = React.useCallback(
    (event: React.MouseEvent) => {
      // 1. 도메인 로직 실행 (선택 해제)
      handlers.onPaneClick();

      // 2. UI 로직 실행 (메뉴 닫기, 패널 제어)
      setMenu(null);

      // 패널이 열려있을 때만 닫고 fitToView 실행
      if (ui.showEditorPanel) {
        ui.closeEditorPanel();
        const timer = setTimeout(() => {
          fitViewToSelection(0.2, 600);
        }, 100);

        return () => clearTimeout(timer);
      }
    },
    [handlers, ui, fitViewToSelection]
  );

  // Drag and drop handlers (UI 로직)
  const onDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = React.useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData("application/x-canvas-kind");
      if (!kind) return;
      let x = 100,
        y = 100;
      try {
        const inst = rfInstanceRef.current;
        if (inst?.screenToFlowPosition) {
          const p = inst.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
          x = p.x;
          y = p.y;
        }
      } catch {}
      const pageId = selectedPageBlock?.id as string | undefined;
      if (!pageId) return;
      await commands.createBlockInPage(pageId, kind, { x, y });
    },
    [selectedPageBlock, commands]
  );

  // ============================================================================
  // 11. Render (렌더링)
  // ============================================================================
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          selectionOnDrag={selectionOnDrag}
          nodesDraggable={nodesDraggable}
          elementsSelectable={elementsSelectable}
          panOnDrag={panOnDrag as any}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onSelectionChange={onSelectionChange}
          onNodeClick={handlers.onNodeClick}
          onEdgeClick={handlers.onEdgeClick}
          onPaneClick={handlePaneClick}
          onNodeContextMenu={onNodeContextMenu}
          onConnect={handlers.onConnect}
          onNodeDragStart={handlers.onNodeDragStart}
          onNodeDragStop={handlers.onNodeDragStop}
          onNodeDoubleClick={handlers.onNodeDoubleClick}
          onEdgeDoubleClick={handlers.onEdgeDoubleClick}
          onNodesDelete={handlers.onNodesDelete}
          onEdgesDelete={handlers.onEdgesDelete}
          onConnectStart={handlers.onConnectStart}
          onConnectEnd={handlers.onConnectEnd}
          onInit={onInit}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onMove={onMove}
        >
          {canvasMode === "page" && selectedPageBlock ? (
            <CanvasToolbar
              mode={toolMode}
              setMode={setToolMode}
              isAddOpen={isAddOpen}
              toggleAdd={toggleAdd}
              isEditOpen={isEditOpen}
              toggleEdit={toggleEdit}
              onFitToView={handleFitToView}
              isPageSelected={!!selectedPageBlock}
              isPageEditorOpen={
                isEditOpen &&
                ui.selectedBlockIdForEditor === selectedPageBlock.id
              }
            />
          ) : null}
          {canvasMode === "component" && selectedComponentBlock ? (
            <ComponentCanvasToolbar
              onBackToPage={() => {
                // leave component mode
                try {
                  sel.selectComponent(null);
                } catch {}
              }}
              isEditOpen={isEditOpen}
              toggleEdit={() => toggleEditor(selectedComponentBlock.id)}
              componentName={selectedComponentBlock.name}
              toolMode={toolMode}
              setToolMode={setToolMode}
              onFitToView={handleFitToView}
            />
          ) : null}
          {/* Bottom-right view toolbar for minimap toggle and zoom control */}
          <CanvasViewToolbar
            showMiniMap={showMiniMap}
            toggleMiniMap={toggleMiniMap}
            zoomPercent={zoomPercent}
            onZoomPercentChange={onZoomPercentChange}
          />
          <Controls />
          <Background />
          {/* MiniMap is now rendered inside CanvasViewToolbar */}
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
