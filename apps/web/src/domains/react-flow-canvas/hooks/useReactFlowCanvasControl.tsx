"use client";

import React from "react";
import type { ReactFlowInstance, Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { useReactFlowCanvas } from "../contexts/ReactFlowCanvasContext";
import { useControlState, useControlCommands } from "../contexts/ControlContext";
import { useSelectionState, useSelectionCommands } from "../contexts/SelectionContext";
import type { ReactFlowCanvasConfig } from "../types/react-flow-types";
import { updateNodesSelection } from "../utils/node-updater";

export interface UseReactFlowCanvasControlOptions {
  // React Flow 설정
  config?: ReactFlowCanvasConfig;
}

export interface UseReactFlowCanvasControlResult {
  // Tool mode state
  toolMode: 'select' | 'hand' | 'connect';
  setToolMode: (mode: 'select' | 'hand' | 'connect') => void;

  // View toolbar state
  showMiniMap: boolean;
  setShowMiniMap: (show: boolean) => void;
  zoomPercent: number;
  setZoomPercent: (percent: number) => void;

  // Interaction flags
  panOnDrag: number[];
  nodesDraggable: boolean;
  elementsSelectable: boolean;
  selectionOnDrag: boolean;

  // Control handlers
  handleFitToView: () => void;
  fitViewWithPadding: (padding?: number, duration?: number) => void;
  fitViewToSelection: (padding?: number, duration?: number) => void;
  toggleMiniMap: () => void;
  onZoomPercentChange: (percent: number) => void;

  // React Flow event handlers
  onInit: (inst: ReactFlowInstance) => void;
  onMove: (event: any, viewport: any) => void;
  
  // 노드 포커싱 함수
  focusOnNode: (nodeId: string) => void;
}

export function useReactFlowCanvasControl(
  options: UseReactFlowCanvasControlOptions = {}
): UseReactFlowCanvasControlResult {
  const { rfInstance, setRfInstance, nodes, domainCallbacks } = useReactFlowCanvas();
  const rf = useReactFlow();
  const { toolMode, showMiniMap, zoomPercent } = useControlState();
  const { setToolMode, setShowMiniMap, setZoomPercent } = useControlCommands();
  const { selectedNodeIds } = useSelectionState();
  const { clearSelection, selectNodes } = useSelectionCommands();
  const {
    config,
  } = options;

  // React Flow interaction flags based on tool mode and config
  const panOnDrag = toolMode === "hand" ? [0, 1, 2] : [1, 2]; // Hand 모드일 때 모든 마우스 버튼으로 pan 가능
  const nodesDraggable = toolMode !== "hand"; // Hand 모드일 때 노드 드래그 비활성화
  const elementsSelectable = toolMode !== "hand"; // Hand 모드일 때 선택 비활성화
  const selectionOnDrag = toolMode === "select"; // Select 모드일 때만 드래그 선택 활성화

  // Fit to view handlers
  const handleFitToView = React.useCallback(() => {
    if (rfInstance?.fitView) {
      const padding = config?.fitView ? 0.1 : undefined;
      rfInstance.fitView({ padding });
    }
  }, [rfInstance, config?.fitView]);

  const fitViewWithPadding = React.useCallback(
    (padding = 0.1, duration = 600) => {
      if (rfInstance?.fitView) {
        const finalPadding = config?.fitView ? padding : undefined;
        rfInstance.fitView({ padding: finalPadding, duration });
      }
    },
    [rfInstance, config?.fitView]
  );

  const fitViewToSelection = React.useCallback(
    (padding = 0.2, duration = 600) => {
      if (rfInstance?.fitView) {
        const finalPadding = config?.fitView ? padding : undefined;
        rfInstance.fitView({ padding: finalPadding, duration });
      }
    },
    [rfInstance, config?.fitView]
  );

  // 노드 포커싱 함수
  const focusOnNode = React.useCallback(
    (nodeId: string) => {
      if (rfInstance?.setCenter) {
        const node = nodes.find((n: Node) => n.id === nodeId);
        if (node) {
          // 노드의 중심점을 계산
          const nodeWidth = (node.data as any)?.width || 150;
          const nodeHeight = (node.data as any)?.height || 100;
          const centerX = node.position.x + nodeWidth / 2 + 350;
          const centerY = node.position.y + nodeHeight / 2 + 100;
          
          // setCenter를 사용하여 노드 중심으로 뷰포트 이동
          rfInstance.setCenter(centerX, centerY, { duration: 800, zoom: 0.7 });
        }
      }
    },
    [rfInstance, nodes]
  );

  // Keyboard shortcuts for tool mode and Ctrl/Cmd key detection
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if not typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement | null)?.isContentEditable
      ) {
        return;
      }

      // Ctrl/Cmd 키 감지 (Mac에서는 metaKey, 다른 OS에서는 ctrlKey)
      const isMeta = event.metaKey || event.ctrlKey;

      // Ignore system shortcuts but allow Shift
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      switch (event.code) {
        case "KeyV":
          event.preventDefault();
          event.stopPropagation();
          setToolMode("select");
          break;
        case "KeyH":
          event.preventDefault();
          event.stopPropagation();
          setToolMode("hand");
          break;
        case "KeyF":
          event.preventDefault();
          event.stopPropagation();
          handleFitToView();
          break;
        case "Escape":
          event.preventDefault();
          event.stopPropagation();
          if (selectedNodeIds.length > 0) {
            // 선택 해제
            selectNodes([]);
          }
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Ctrl/Cmd 키 해제 감지 (Mac에서는 metaKey, 다른 OS에서는 ctrlKey)
      const isMeta = event.metaKey || event.ctrlKey;
    };

    // Use capture phase to ensure we get the event before React Flow
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keyup", handleKeyUp, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [
    handleFitToView,
  ]);

  const toggleMiniMap = React.useCallback(() => {
    setShowMiniMap(!showMiniMap);
  }, [showMiniMap, setShowMiniMap]);

  const onZoomPercentChange = React.useCallback(
    (percent: number) => {
      const minZoom = config?.minZoom || 0.1;
      const maxZoom = config?.maxZoom || 2;
      const clamped = Math.max(minZoom * 100, Math.min(maxZoom * 100, Math.round(percent)));
      setZoomPercent(clamped);
      if (rfInstance?.setViewport) {
        try {
          const currentViewport = rfInstance.getViewport();
          rfInstance.setViewport({
            ...currentViewport,
            zoom: clamped / 100,
          });
        } catch {}
      }
    },
    [rfInstance, config?.minZoom, config?.maxZoom, setZoomPercent]
  );

  // React Flow event handlers
  const onInit = React.useCallback(
    (inst: ReactFlowInstance) => {
      setRfInstance(inst);
      try {
        const viewport = (inst as any)?.getViewport?.();
        if (
          viewport?.zoom &&
          typeof viewport.zoom === "number" &&
          !Number.isNaN(viewport.zoom)
        ) {
          setZoomPercent(Math.round(viewport.zoom * 100));
        }
      } catch {}
    },
    [setRfInstance]
  );

  const onMove = React.useCallback((event: any, viewport: any) => {
    try {
      const z = (viewport as any)?.zoom;
      if (typeof z === "number" && !Number.isNaN(z)) {
        const next = Math.round(z * 100);
        if (zoomPercent !== next) {
          setZoomPercent(next);
        }
      }
    } catch {}
  }, [zoomPercent, setZoomPercent]);



  return {
    // Tool mode state
    toolMode,
    setToolMode,

    // View toolbar state
    showMiniMap,
    setShowMiniMap,
    zoomPercent,
    setZoomPercent,

    // Interaction flags
    panOnDrag,
    nodesDraggable,
    elementsSelectable,
    selectionOnDrag,

    // Control handlers
    handleFitToView,
    fitViewWithPadding,
    fitViewToSelection,
    toggleMiniMap,
    onZoomPercentChange,

    // React Flow event handlers
    onInit,
    onMove,
    
    // 노드 포커싱 함수
    focusOnNode,
  };
}
