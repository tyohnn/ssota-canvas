import { useState, useCallback } from "react";

/**
 * 🎯 CANVAS UI STATE HOOK
 * ========================
 *
 * 📋 역할: 캔버스 UI 관련 상태만 관리
 * - 패널 열기/닫기
 * - 모달 상태
 * - UI 인터랙션 상태
 *
 * 🔧 설계 원칙:
 * - UI 상태만 관리
 * - 비즈니스 로직은 포함하지 않음
 * - 재사용 가능한 UI 상태 관리
 */

export type ActiveLeftTab = "pages" | "layers";

// Viewport 액션 타입
export type ViewportAction = "center" | "select" | "none";

export function useCanvasUIState() {
  // Panel states
  const [showBlockExplorer, setShowBlockExplorer] = useState(true);
  const [showEditorPanel, setShowEditorPanel] = useState(false);
  const [showPageBlockInsertPanel, setShowPageBlockInsertPanel] =
    useState(false);
  const [showBlockInsertPanel, setShowBlockInsertPanel] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<ActiveLeftTab>("pages");

  // UI display states
  const [showGrid, setShowGrid] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Page and component states

  const [viewportAction, setViewportAction] = useState<ViewportAction>("none");

  // Panel management functions
  const openPageBlockInsertPanel = useCallback(() => {
    setShowEditorPanel(false);
    setShowBlockInsertPanel(false);
    setShowPageBlockInsertPanel(true);
  }, []);

  const openBlockInsertPanel = useCallback(() => {
    setShowEditorPanel(false);
    setShowPageBlockInsertPanel(false);
    setShowBlockInsertPanel(true);
  }, []);

  const closeAllPanels = useCallback(() => {
    setShowEditorPanel(false);
    setShowPageBlockInsertPanel(false);
    setShowBlockInsertPanel(false);
  }, []);

  // UI state setters only - no business logic
  const setShowBlockExplorerState = useCallback((show: boolean) => {
    setShowBlockExplorer(show);
  }, []);

  const setShowEditorPanelState = useCallback((show: boolean) => {
    setShowEditorPanel(show);
  }, []);

  const closeEditorPanel = useCallback(() => {
    setShowEditorPanel(false);
  }, []);

  const setShowGridState = useCallback((show: boolean) => {
    setShowGrid(show);
  }, []);

  const setShowLayersState = useCallback((show: boolean) => {
    setShowLayers(show);
  }, []);

  return {
    // Panel states
    showBlockExplorer,
    showEditorPanel,
    showPageBlockInsertPanel,
    showBlockInsertPanel,

    // UI display states
    showGrid,
    showLayers,
    canUndo,
    canRedo,

    // Page states
    activeLeftTab,

    // Panel management
    openPageBlockInsertPanel,
    openBlockInsertPanel,
    closeAllPanels,

    // UI state setters
    setShowBlockExplorerState,
    setShowEditorPanelState,
    closeEditorPanel,
    setShowGridState,
    setShowLayersState,

    // Page management
    setActiveLeftTab,
    setCanUndo,
    setCanRedo,
    viewportAction,
    setViewportAction,
  };
}
