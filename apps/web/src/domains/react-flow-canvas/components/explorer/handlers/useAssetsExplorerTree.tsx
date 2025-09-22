"use client";

import React from "react";
import type { Block } from "@/db/schema";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { usePanel } from "@/domains/react-flow-canvas/contexts/PanelContext";
import { useReactFlowSelectionCommands } from "@/domains/react-flow-canvas/contexts/ReactFlowSelectionContext";
import { useReactFlowCanvasControl } from "@/domains/react-flow-canvas/handlers/useReactFlowCanvasControlHandler";

function getAssetIcon(type: string | undefined, className: string) {
  switch (type) {
    case "component":
      return <div className={`${className} bg-blue-500 rounded-sm ml-1`} />;
    default:
      return <div className={`${className} bg-gray-500 rounded-sm ml-1`} />;
  }
}

export function useAssetsExplorerTree() {
  // Canvas Data Context
  const { componentBlocks, selectedComponentBlock, selectComponent } = useCanvasData();

  // React Flow Canvas Context
  const panel = usePanel();
  const { selectNodes } = useReactFlowSelectionCommands();
  const { focusOnNode } = useReactFlowCanvasControl();

  const handleSelect = React.useCallback(
    (id: string) => {
      panel.setActiveExplorerTab("assets");
      selectComponent(id); // 캔버스 도메인의 컴포넌트를 선택하고 상단 헤더 업데이트
      selectNodes([id]); // 리액트 플로우의 설렉션을 업데이트하고, 에디터 패널 업데이트
      
      // 자동 이동 기능
      setTimeout(() => {
        focusOnNode(id);
        panel.openEditorPanel();
      }, 100);
    },
    [panel, selectComponent]
  );

  return {
    assetBlocks: componentBlocks,
    selectedComponentId: selectedComponentBlock?.id,
    getId: (b: Block) => b.id,
    getName: (b: Block) => b.title,
    getParentId: (b: Block) => b.parent_block_id,
    getOrder: (b: Block) => b.order,
    getType: (b: Block) => b.block_type,
    renderFileIcon: getAssetIcon,
    handleSelect,
  } as const;
}
