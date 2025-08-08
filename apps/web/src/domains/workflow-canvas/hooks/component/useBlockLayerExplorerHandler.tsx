import { useMemo, useState, useCallback } from "react";
import { useCanvas } from "@/domains/workflow-canvas/contexts/CanvasContext";
import {
  PAGE_BLOCK_TYPES,
  PAGE_BLOCK_ICONS,
} from "@/domains/workflow-canvas/policy";
import { BlockType } from "@workspace/domain-contracts";

// Use centralized page block types and convert to groups format
const PAGE_GROUPS = PAGE_BLOCK_TYPES.map((blockType) => ({
  label: blockType.label,
  type: blockType.id,
  icon: PAGE_BLOCK_ICONS[blockType.id as keyof typeof PAGE_BLOCK_ICONS],
  color: blockType.color,
}));

export function useBlockLayerExplorerHandler() {
  // CanvasContext에서 필요한 상태와 이벤트 핸들러 가져오기
  const {
    displayBlocks,
    selectedPageBlock,
    handleBlockSelect,
    handlePageBlockSelect,
    closeEditorPanel,
  } = useCanvas();

  // UI 상태
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  // 워크스페이스 블록들을 타입별로 그룹화
  const pageOptions = useMemo(() => {
    const grouped: Record<BlockType, any[]> = {
      [BlockType.WORKFLOW]: [],
      [BlockType.AGENT]: [],
      [BlockType.TASK]: [],
      [BlockType.ARTIFACT_TEMPLATE]: [],
      [BlockType.CHECKLIST]: [],
      [BlockType.DATA]: [],
      [BlockType.ARTIFACT_CLASS]: [],
      [BlockType.START]: [],
      [BlockType.END]: [],
      [BlockType.CONDITION]: [],
      [BlockType.BLOCK_DEFINITION]: [],
      [BlockType.EDGE_DEFINITION]: [],
      [BlockType.COLUMN_DEFINITION]: [],
    };

    // 블록들을 타입별로 그룹화
    displayBlocks.forEach((block) => {
      const blockType = block.type as BlockType;
      if (blockType && grouped[blockType as keyof typeof grouped]) {
        const blockName =
          block.data?.label || block.data?.name || `${blockType} ${block.id}`;

        grouped[blockType as keyof typeof grouped].push({
          id: block.id,
          name: blockName,
          type: blockType,
        });
      }
    });

    // devLog("🔍 Final pageOptions:", grouped);
    return grouped;
  }, [displayBlocks]);

  // 현재 캔버스의 블록들을 레이어 아이템으로 변환
  const layerItems = useMemo(() => {
    if (!displayBlocks || displayBlocks.length === 0) {
      return [];
    }

    return displayBlocks.map((block) => ({
      id: block.id,
      name:
        (block.data?.label as string) ||
        (block.data?.name as string) ||
        `${block.type || "Unknown"} Block`,
      type: block.type || "unknown",
      visible: true, // TODO: Implement visibility state tracking
      children: [], // Only 1-level structure for now
    }));
  }, [displayBlocks]);

  // 검색어에 따른 아이템 필터링
  const filteredItems = useMemo(() => {
    if (!searchValue) return layerItems;

    return layerItems.filter((item) =>
      item.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [layerItems, searchValue]);

  // 이벤트 핸들러들
  const handleVisibilityToggle = useCallback(
    (blockId: string, currentVisible: boolean) => {
      // TODO: Implement visibility toggle
      console.log(`Toggle visibility for block ${blockId}:`, !currentVisible);
    },
    []
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
    },
    []
  );

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const onPageValueChange = useCallback(
    (pageId: string) => {
      closeEditorPanel();
      // 현재 페이지와 다른 경우에만 페이지 변경
      if (pageId !== selectedPageBlock?.id) {
        handlePageBlockSelect(pageId);
      }
    },
    [handlePageBlockSelect, selectedPageBlock, closeEditorPanel]
  );

  const handleBlockItemClick = useCallback(
    (blockId: string) => {
      handleBlockSelect(blockId);
    },
    [handleBlockSelect]
  );

  return {
    // 상태
    isExpanded,
    searchValue,
    layerItems,
    filteredItems,
    pageOptions,
    selectedPageBlock,
    hasItems: layerItems.length > 0,

    // 이벤트 핸들러
    handleVisibilityToggle,
    handleSearchChange,
    handleToggleExpanded,
    onPageValueChange,
    handleBlockItemClick,

    // 상수
    PAGE_GROUPS,
  };
}
