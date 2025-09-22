"use client";

import { useCallback, useEffect } from "react";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useReactFlowCommandsContext } from "@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext";
import { usePanel } from "@/domains/react-flow-canvas/contexts/PanelContext";

export function useNodeKeyboardShortcuts(
  nodeId: string,
  selected: boolean
) {
  const { canvasMode, contextBlockId } = useCanvasData();
  const { nodeCommands, componentCommands } = useReactFlowCommandsContext();
  const panel = usePanel();

  const handleEdit = useCallback(() => {
    panel.openEditorPanel();
  }, [panel.openEditorPanel]);

  const handleDuplicate = useCallback(async () => {
    const result = await nodeCommands.duplicateNodes(contextBlockId as string, [nodeId]);
    if (!result.ok) {
      console.error("Failed to duplicate block:", result.error);
    }
  }, [nodeId, contextBlockId, nodeCommands]);

  const handleCreateComponent = useCallback(async () => {
    const result = await componentCommands.createComponentFromNode(nodeId);

    if (result.ok) {
      panel.setActiveExplorerTab("assets");
    }
  }, [nodeId, componentCommands, panel.setActiveExplorerTab]);

  // 키보드 단축키 처리
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const tag = (target?.tagName || "").toLowerCase();
    const isEditable =
      target?.isContentEditable ||
      tag === "input" ||
      tag === "textarea" ||
      tag === "select";
    
    if (isEditable) return;

    const isMeta = e.metaKey || e.ctrlKey;

    // Edit: Cmd/Ctrl+E
    if (isMeta && (e.key === "e" || e.key === "E")) {
      e.preventDefault();
      handleEdit();
      return;
    }

    // Duplicate: Cmd/Ctrl+D
    if (isMeta && (e.key === "d" || e.key === "D")) {
      e.preventDefault();
      handleDuplicate();
      return;
    }

    // Create Component: Shift+Cmd/Ctrl+C
    if (isMeta && e.shiftKey && (e.key === "c" || e.key === "C")) {
      e.preventDefault();
      handleCreateComponent();
      return;
    }
  }, [handleEdit, handleDuplicate, handleCreateComponent]);

  // 키보드 이벤트 리스너 등록
  useEffect(() => {
    // 컴포넌트 모드에서는 키보드 단축키 비활성화
    if (!selected || canvasMode === "component") return;
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, canvasMode, handleKeyDown]);
}
