"use client";

import React from "react";
import type { ReactFlowInstance, Node } from "@xyflow/react";
import type { CanvasToolMode } from "@/domains/canvas/components/canvas/canvas-toolbar";

export interface UseReactFlowCanvasControlOptions {
  rfInstanceRef: React.MutableRefObject<ReactFlowInstance | null>;
  showEditorPanel: boolean;
  rfNodes: Node[];
  selectedNodeIds: string[];
  onEscape?: () => void; // ESC 키 핸들러 추가
}

export interface UseReactFlowCanvasControlResult {
  // Tool mode state
  toolMode: CanvasToolMode;
  setToolMode: React.Dispatch<React.SetStateAction<CanvasToolMode>>;

  // View toolbar state
  showMiniMap: boolean;
  setShowMiniMap: React.Dispatch<React.SetStateAction<boolean>>;
  zoomPercent: number;
  setZoomPercent: React.Dispatch<React.SetStateAction<number>>;

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
}

export function useReactFlowCanvasControl(
  options: UseReactFlowCanvasControlOptions
): UseReactFlowCanvasControlResult {
  const { rfInstanceRef, showEditorPanel, rfNodes, selectedNodeIds, onEscape } =
    options;

  // Tool mode state
  const [toolMode, setToolMode] = React.useState<CanvasToolMode>("select");

  // View toolbar state: minimap and zoom
  const [showMiniMap, setShowMiniMap] = React.useState<boolean>(true);
  const [zoomPercent, setZoomPercent] = React.useState<number>(100);

  // React Flow interaction flags based on tool mode
  const panOnDrag = toolMode === "hand" ? [0, 1, 2] : [1, 2];
  const nodesDraggable = toolMode !== "hand";
  const elementsSelectable = toolMode !== "hand";
  // Disable selection drag when editor panel is open to prevent lag
  const selectionOnDrag = false;

  // Fit to view handlers
  const handleFitToView = React.useCallback(() => {
    const inst = rfInstanceRef.current;
    if (inst?.fitView) {
      inst.fitView({ padding: 0.1 });
    }
  }, [rfInstanceRef]);

  const fitViewWithPadding = React.useCallback(
    (padding = 0.1, duration = 600) => {
      const inst = rfInstanceRef.current;
      if (inst?.fitView) {
        inst.fitView({ padding, duration });
      }
    },
    [rfInstanceRef]
  );

  const fitViewToSelection = React.useCallback(
    (padding = 0.2, duration = 600) => {
      const inst = rfInstanceRef.current;
      if (inst?.fitView) {
        inst.fitView({ padding, duration });
      }
    },
    [rfInstanceRef]
  );

  // Center or shift viewport on node selection depending on editor panel state
  React.useEffect(() => {
    const inst = rfInstanceRef.current as any;
    const selectedId =
      selectedNodeIds && selectedNodeIds.length > 0 ? selectedNodeIds[0] : null;
    if (!inst || !selectedId) return;

    // Small delay to ensure nodes are rendered before centering
    const timer = setTimeout(() => {
      const node = rfNodes.find((n) => n.id === selectedId);
      if (!node) return;
      try {
        if (showEditorPanel) {
          // Move focus so selected block appears toward the right
          inst.setCenter(
            (node.position?.x ?? 0) + 400,
            (node.position?.y ?? 0) + 175,
            { zoom: 1, duration: 600 }
          );
        } else {
          // Center arrangement across all nodes with animation
          if (inst.fitView) inst.fitView({ padding: 0.2, duration: 600 });
        }
      } catch {}
    }, 100);

    return () => clearTimeout(timer);
  }, [showEditorPanel, selectedNodeIds, rfNodes, rfInstanceRef]);

  // Keyboard shortcuts for tool mode
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
          onEscape?.();
          break;
      }
    };

    // Use capture phase to ensure we get the event before React Flow
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [handleFitToView, onEscape]);

  const toggleMiniMap = React.useCallback(() => setShowMiniMap((v) => !v), []);

  const onZoomPercentChange = React.useCallback(
    (percent: number) => {
      const clamped = Math.max(10, Math.min(200, Math.round(percent)));
      setZoomPercent(clamped);
      const inst = rfInstanceRef.current as any;
      if (inst?.setViewport) {
        try {
          const currentViewport = inst.getViewport();
          inst.setViewport({
            ...currentViewport,
            zoom: clamped / 100,
          });
        } catch {}
      }
    },
    [rfInstanceRef]
  );

  // React Flow event handlers
  const onInit = React.useCallback(
    (inst: ReactFlowInstance) => {
      rfInstanceRef.current = inst as any;
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
    [rfInstanceRef]
  );

  const onMove = React.useCallback((event: any, viewport: any) => {
    try {
      const z = (viewport as any)?.zoom;
      if (typeof z === "number" && !Number.isNaN(z)) {
        setZoomPercent((prev) => {
          const next = Math.round(z * 100);
          return prev === next ? prev : next;
        });
      }
    } catch {}
  }, []);

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
  };
}
