"use client";

import React from "react";
import type { Block } from "@/db/schema";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { useUiLayout } from "@/domains/canvas/contexts/UiLayoutContext";
import { useEditorControlContext } from "@/domains/canvas/contexts/EditorControlContext";

function getAssetIcon(type: string | undefined, className: string) {
  switch (type) {
    case "component":
      return <div className={`${className} bg-blue-500 rounded-sm ml-1`} />;
    default:
      return <div className={`${className} bg-gray-500 rounded-sm ml-1`} />;
  }
}

export function useAssetsExplorerTree() {
  // Use refactored contexts for data and selection
  const { blocksById, getPositionsForContext } = useCanvasData();
  const { componentId, selectComponent } = useCanvasSelection();

  // Debug: Log componentId changes
  React.useEffect(() => {
    console.log("useAssetsExplorerTree - componentId changed:", componentId);
  }, [componentId]);

  // Debug: Log selectedComponentId being returned
  React.useEffect(() => {
    console.log(
      "useAssetsExplorerTree - selectedComponentId being returned:",
      componentId
    );
  }, [componentId]);

  // Use refactored UI layout state
  const { setActiveLeftTab } = useUiLayout();
  const { openEditor } = useEditorControlContext();

  // Get component blocks with their positions
  const assetBlocks = React.useMemo(() => {
    const componentBlocks = Object.values(blocksById).filter(
      (b) => b.object === ("component" as any)
    );

    // For each component, check if it has positions (self-referential positions)
    return componentBlocks.map((block) => {
      const positions = getPositionsForContext(block.id);
      const hasPositions = positions && positions.length > 0;

      return {
        ...block,
        hasPositions,
        positionCount: hasPositions ? positions.length : 0,
      };
    });
  }, [blocksById, getPositionsForContext]);

  const handleSelect = React.useCallback(
    (id: string) => {
      setActiveLeftTab("assets");
      selectComponent(id);
      openEditor(id);
    },
    [setActiveLeftTab, selectComponent, openEditor]
  );

  return {
    assetBlocks,
    selectedComponentId: componentId,
    getId: (b: Block) => b.id,
    getName: (
      b: Block & { hasPositions?: boolean; positionCount?: number }
    ) => {
      return b.name;
    },
    getParentId: (_b: Block) => null,
    getOrder: (b: Block) => b.order,
    getType: (b: Block) => b.block_type,
    renderFileIcon: getAssetIcon,
    handleSelect,
  } as const;
}
