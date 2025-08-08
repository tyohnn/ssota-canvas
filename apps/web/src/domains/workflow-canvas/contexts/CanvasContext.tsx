"use client";

import React, { createContext, useContext, ReactNode } from "react";
import {
  Node as ReactFlowBlock,
  Edge as ReactFlowEdge,
  Connection,
} from "@xyflow/react";
import { Edge as DbEdge, BlockPosition as DbBlockPosition } from "@/db/schema";
import {
  PageBlockType,
  DbBlock,
} from "@/domains/workflow-canvas/policy/block-definition-policy";
import {
  ActiveLeftTab,
  ViewportAction,
} from "@/domains/workflow-canvas/hooks/state/useCanvasUIState";
import { useCanvasEventHandler } from "@/domains/workflow-canvas/hooks/component/useCanvasHandler";

/**
 * 🎯 CANVAS CONTEXT
 * =================
 *
 * 📋 역할: Canvas 관련 상태와 이벤트 핸들러를 전역적으로 제공
 * - Props drilling 문제 해결
 * - 컴포넌트 간 상태 공유
 * - 이벤트 핸들러 재사용
 *
 * 🔧 사용법:
 * ```tsx
 * // Provider로 감싸기
 * <CanvasProvider workspaceId="123">
 *   <CanvasPage />
 * </CanvasProvider>
 *
 * // 컴포넌트에서 사용
 * const { handlePageBlockSelect, displayBlocks } = useCanvas();
 * ```
 */

interface CanvasContextValue {
  // DB 상태 (Single Source of Truth)
  dbBlocks: DbBlock[]; // Page Explorer용 순수 DB 블록들
  dbEdges: DbEdge[];
  dbBlockPositions: DbBlockPosition[];
  selectedPageBlock: DbBlock | null;

  // Canvas 상태 (React Flow)
  displayBlocks: ReactFlowBlock[];
  displayEdges: ReactFlowEdge[];
  selectedBlocks: string[];
  selectedEdges: string[];
  loading: boolean;
  error: string | null;

  // UI 상태
  showBlockExplorer: boolean;
  showEditorPanel: boolean;
  showPageBlockInsertPanel: boolean;
  showBlockInsertPanel: boolean;
  showGrid: boolean;
  showLayers: boolean;
  activeLeftTab: ActiveLeftTab;
  viewportAction: ViewportAction;
  setViewportAction: (action: ViewportAction) => void;
  zoom: number;

  // React Flow 이벤트 핸들러
  onBlockClick: (event: React.MouseEvent, node: ReactFlowBlock) => void;
  onEdgeClick: (event: React.MouseEvent, edge: ReactFlowEdge) => void;
  onPaneClick: () => void;
  onConnect: (connection: Connection) => void;
  onBlockDragStart: () => void;
  onBlockDragStop: (event: React.MouseEvent, node: ReactFlowBlock) => void;
  onBlockDoubleClick: (event: React.MouseEvent, node: ReactFlowBlock) => void;
  onEdgeDoubleClick: (event: React.MouseEvent, edge: ReactFlowEdge) => void;
  onBlocksDelete: (deletedBlocks: ReactFlowBlock[]) => void;
  onEdgesDelete: (deletedEdges: ReactFlowEdge[]) => void;
  // onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
  onConnectStart: () => void;
  onConnectEnd: () => void;

  // 이벤트 핸들러
  handlePageBlockSelect: (pageId: string) => void;
  handlePageBlockCreate: (pageType: PageBlockType) => Promise<any>;
  handleBlockSelect: (blockId: string) => void;
  handleEdgeInsert: (
    targetBlockId: string,
    targetBlockType: PageBlockType
  ) => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  handleBlockUpdate: (
    blockId: string,
    updates: Partial<DbBlock>
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
  handleBlockDelete: (blockId: string) => Promise<void>;
  handleEdgeSelect: (edgeId: string) => void;
  handleEdgeUpdate: (edgeId: string, updates: any) => Promise<void>;
  handleEdgeDelete: (edgeId: string) => Promise<void>;
  handleClearSelection: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomReset: () => void;
  handleSave: () => void;
  handleExport: () => void;
  handleImport: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleToggleGrid: () => void;
  handleToggleLayers: () => void;
  handleToggleBlockExplorer: () => void;
  handleToggleEditorPanel: () => void;

  // UI 상태 업데이트
  setActiveLeftTab: (value: ActiveLeftTab) => void;
  openPageBlockInsertPanel: () => void;
  openBlockInsertPanel: () => void;
  closeAllPanels: () => void;
  setShowBlockExplorerState: (value: boolean) => void;
  closeEditorPanel: () => void;
  setShowEditorPanelState: (value: boolean) => void;

  // 추가 속성들
  workspaceId: string;
  initialDbBlockPositions: DbBlockPosition[] | undefined;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

interface CanvasProviderProps {
  children: ReactNode;
  workspaceId: string;
  initialDbBlocks?: DbBlock[];
  initialDbEdges?: DbEdge[];
  initialDbBlockPositions?: DbBlockPosition[];
}

export function CanvasProvider({
  children,
  workspaceId,
  initialDbBlocks,
  initialDbEdges,
  initialDbBlockPositions,
}: CanvasProviderProps) {
  // 이벤트 핸들러 (비즈니스 로직 포함)
  const { uiState, canvasState, reactFlowCanvasState, eventHandlers } =
    useCanvasEventHandler(
      workspaceId,
      initialDbBlocks,
      initialDbEdges,
      initialDbBlockPositions
    );

  const contextValue: CanvasContextValue = {
    // DB 상태 (Single Source of Truth)
    dbBlocks: canvasState.dbBlocks,
    dbEdges: canvasState.dbEdges,
    dbBlockPositions: canvasState.dbBlockPositions,
    selectedPageBlock: canvasState.selectedPageBlock,

    // Canvas 상태 (reactFlowCanvasState 가져오기)
    displayBlocks: reactFlowCanvasState.displayBlocks,
    displayEdges: reactFlowCanvasState.displayEdges,
    selectedBlocks: reactFlowCanvasState.selectedBlocks,
    selectedEdges: reactFlowCanvasState.selectedEdges,
    zoom: reactFlowCanvasState.zoom,
    loading: reactFlowCanvasState.loading,
    error: reactFlowCanvasState.error,

    // UI 상태
    showBlockExplorer: uiState.showBlockExplorer,
    showEditorPanel: uiState.showEditorPanel,
    showPageBlockInsertPanel: uiState.showPageBlockInsertPanel,
    showBlockInsertPanel: uiState.showBlockInsertPanel,
    showGrid: uiState.showGrid,
    showLayers: uiState.showLayers,
    activeLeftTab: uiState.activeLeftTab,
    viewportAction: uiState.viewportAction,
    setViewportAction: uiState.setViewportAction,

    // React Flow 이벤트 핸들러
    onBlockClick: eventHandlers.onBlockClick,
    onEdgeClick: eventHandlers.onEdgeClick,
    onPaneClick: eventHandlers.onPaneClick,
    onConnect: eventHandlers.onConnect,
    onBlockDragStart: eventHandlers.onBlockDragStart,
    onBlockDragStop: eventHandlers.onBlockDragStop,
    onBlockDoubleClick: eventHandlers.onBlockDoubleClick,
    onEdgeDoubleClick: eventHandlers.onEdgeDoubleClick,
    onBlocksDelete: eventHandlers.onBlocksDelete,
    onEdgesDelete: eventHandlers.onEdgesDelete,
    // onViewportChange: eventHandlers.onViewportChange,
    onConnectStart: eventHandlers.onConnectStart,
    onConnectEnd: eventHandlers.onConnectEnd,

    // 이벤트 핸들러
    handlePageBlockSelect: eventHandlers.handlePageBlockSelect,
    handlePageBlockCreate: eventHandlers.handlePageBlockCreate,

    handleBlockSelect: eventHandlers.handleBlockSelect,
    handleEdgeInsert: eventHandlers.handleEdgeInsert,
    canUndo: uiState.canUndo,
    canRedo: uiState.canRedo,
    handleBlockUpdate: eventHandlers.handleBlockUpdate,
    handleBlockDelete: eventHandlers.handleBlockDelete,
    handleEdgeSelect: eventHandlers.handleEdgeSelect,
    handleEdgeUpdate: eventHandlers.handleEdgeUpdate,
    handleEdgeDelete: eventHandlers.handleEdgeDelete,
    handleClearSelection: eventHandlers.handleClearSelection,
    handleZoomIn: eventHandlers.handleZoomIn,
    handleZoomOut: eventHandlers.handleZoomOut,
    handleZoomReset: eventHandlers.handleZoomReset,
    handleSave: eventHandlers.handleSave,
    handleExport: eventHandlers.handleExport,
    handleImport: eventHandlers.handleImport,
    handleUndo: eventHandlers.handleUndo,
    handleRedo: eventHandlers.handleRedo,
    handleToggleGrid: eventHandlers.handleToggleGrid,
    handleToggleLayers: eventHandlers.handleToggleLayers,
    handleToggleBlockExplorer: eventHandlers.handleToggleBlockExplorer,
    handleToggleEditorPanel: eventHandlers.handleToggleEditorPanel,

    // UI 상태 업데이트
    setActiveLeftTab: uiState.setActiveLeftTab,
    openPageBlockInsertPanel: uiState.openPageBlockInsertPanel,
    openBlockInsertPanel: uiState.openBlockInsertPanel,
    closeAllPanels: uiState.closeAllPanels,
    setShowBlockExplorerState: uiState.setShowBlockExplorerState,
    closeEditorPanel: uiState.closeEditorPanel,
    setShowEditorPanelState: uiState.setShowEditorPanelState,

    // 추가 속성들
    workspaceId,
    initialDbBlockPositions,
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvas must be used within a CanvasProvider");
  }
  return context;
}
