import React, {
  useState,
  useCallback,
  useEffect,
} from "react";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { useUiLayout } from "@/domains/canvas/contexts/UiLayoutContext";

export interface UseEditorControlResult {
  toggleEditor: (blockId?: string) => void;
  togglePageEditor: () => void;
  closeEditor: () => void;
  openEditor: (blockId: string) => void;
  clearSelection: () => void;
  manualToggle: boolean;
}

export function useEditorControl(): UseEditorControlResult {
  const sel = useCanvasSelection();
  const ui = useUiLayout();
  const [manualToggle, setManualToggle] = useState(false);

  // 에디터 토글 (열기/닫기)
  const toggleEditor = useCallback(
    (blockId?: string) => {
      if (ui.showEditorPanel) {
        // 에디터가 열려있으면 닫기
        ui.closeEditorPanel();
        sel.setNodeSelection([]); // 노드 선택도 해제
        setManualToggle(true); // 수동으로 닫았음을 표시
      } else {
        // 에디터가 닫혀있으면 열기
        const targetBlockId = blockId || sel.nodeIds[0] || sel.pageId;
        if (targetBlockId) {
          ui.openEditorPanel(targetBlockId);
          setManualToggle(false); // 수동으로 열었음을 표시
        }
      }
    },
    [
      ui.showEditorPanel,
      ui.closeEditorPanel,
      ui.openEditorPanel,
      sel.setNodeSelection,
      sel.nodeIds,
      sel.pageId,
    ]
  );

  // 페이지 에디터 전용 토글 (툴바 버튼 전용 로직)
  const togglePageEditor = useCallback(() => {
    if (!sel.pageId) return;

    if (ui.showEditorPanel) {
      // 어떤 블록이 열려있든 무조건 닫기 (ESC 키와 동일한 로직)
      ui.closeEditorPanel();
      sel.setNodeSelection([]); // 노드 선택 해제
      setManualToggle(true);
      return;
    }

    // 에디터가 닫혀있으면 페이지 블록으로 열기
    ui.openEditorPanel(sel.pageId);
    setManualToggle(false);
  }, [
    sel.pageId,
    ui.showEditorPanel,
    ui.closeEditorPanel,
    ui.openEditorPanel,
    sel.setNodeSelection,
  ]);

  // 에디터 닫기 (첫 번째 단계: 에디터만 닫기)
  const closeEditor = useCallback(() => {
    ui.closeEditorPanel();
    setManualToggle(true);
    // 선택 해제는 하지 않음 - 두 번째 단계에서 처리
  }, [ui.closeEditorPanel]);

  // 선택 해제 (두 번째 단계: 선택까지 해제)
  const clearSelection = useCallback(() => {
    sel.setNodeSelection([]);
    setManualToggle(false);
  }, [sel.setNodeSelection]);

  // 에디터 열기
  const openEditor = useCallback(
    (blockId: string) => {
      ui.openEditorPanel(blockId);
      setManualToggle(false);
    },
    [ui.openEditorPanel]
  );

  // 스마트 에디터 전환 (시나리오 5 해결) - 자동 에디터 열기 비활성화
  // useEffect(() => {
  //   if (sel.nodeIds.length > 0 && !manualToggle) {
  //     const selectedId = sel.nodeIds[0];

  //     if (!selectedId) return;

  //     // Get block type to determine if we should auto-open editor
  //     const block = data.blocksById[selectedId];

  //     // Check if the block actually exists (not deleted)
  //     if (!block) {
  //       // Block was deleted, clear the selection
  //       sel.setNodeSelection([]);
  //       return;
  //     }

  //     const blockType = block?.block_type;

  //     // Don't auto-open editor for text blocks
  //     if (blockType === "basic_text") {
  //       return;
  //     }

  //     if (!ui.showEditorPanel) {
  //       // 에디터가 닫혀있으면 열기
  //       ui.openEditorPanel(selectedId);
  //     } else if (ui.selectedBlockIdForEditor !== selectedId) {
  //       // 에디터가 열려있지만 다른 블록이면 전환 (닫지 않고 바로 전환)
  //       ui.openEditorPanel(selectedId);
  //     }
  //   }

  //   // 노드 선택이 해제되면 수동 토글 상태도 리셋
  //   if (sel.nodeIds.length === 0) {
  //     setManualToggle(false);
  //   }
  // }, [
  //   sel.nodeIds,
  //   ui.showEditorPanel,
  //   ui.selectedBlockIdForEditor,
  //   manualToggle,
  //   ui.openEditorPanel,
  //   data.blocksById,
  //   sel.setNodeSelection,
  // ]);

  // 노드 선택이 해제되면 수동 토글 상태 리셋 (자동 에디터 열기 없이)
  useEffect(() => {
    if (sel.nodeIds.length === 0) {
      setManualToggle(false);
    }
  }, [sel.nodeIds]);

  return {
    toggleEditor,
    togglePageEditor,
    closeEditor,
    openEditor,
    clearSelection,
    manualToggle,
  };
}
