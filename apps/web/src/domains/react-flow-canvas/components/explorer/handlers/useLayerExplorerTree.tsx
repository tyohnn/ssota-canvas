"use client";

import React from "react";
import type { Block } from "@/db/schema";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { usePanel } from "@/domains/react-flow-canvas/contexts/PanelContext";
import { useSelectionCommands } from "@/domains/react-flow-canvas/contexts/SelectionContext";


// Layer-specific file icon renderer
function getLayerFileIcon(type: string | undefined, className: string) {
  switch (type) {
    case "component":
      return <div className={`${className} bg-blue-500 rounded-sm ml-1`} />;
    case "block":
      return <div className={`${className} bg-green-500 rounded-sm ml-1`} />;
    case "container":
      return <div className={`${className} bg-purple-500 rounded-sm ml-1`} />;
    default:
      return <div className={`${className} bg-gray-500 rounded-sm ml-1`} />;
  }
}

export interface UseLayerExplorerTreeResult {
  // ===== 데이터 =====
  /** 레이어 객체만 필터링된 블록 배열 (object !== "page") */
  layerBlocks: Block[];
  /** 현재 선택된 노드 ID들 */
  selectedNodeIds: string[];

  // ===== ExplorerTree용 변환 함수들 =====
  /** 블록에서 고유 ID 추출 (ExplorerTree의 getId prop) */
  getId: (block: Block) => string;
  /** 블록에서 표시할 이름 추출 (ExplorerTree의 getName prop) */
  getName: (block: Block) => string;
  /** 블록의 부모 ID 추출 (ExplorerTree의 getParentId prop) */
  getParentId: (block: Block) => string | null;
  /** 블록의 정렬 순서 추출 (ExplorerTree의 getOrder prop) */
  getOrder: (block: Block) => number;
  /** 블록의 타입 추출 (ExplorerTree의 getType prop) */
  getType: (block: Block) => string;
  /** 블록 타입에 따른 아이콘 렌더링 함수 (ExplorerTree의 renderFileIcon prop) */
  renderFileIcon: (
    type: string | undefined,
    className: string
  ) => React.ReactNode;

  // ===== 이벤트 핸들러 =====
  /** 레이어 블록 선택 처리 (ExplorerTree의 onSelect prop) */
  handleSelect: (id: string) => void;
  /** 레이어 블록 드래그앤드롭 이동 처리 (ExplorerTree의 onMove prop) - 비활성화 */
  handleMove: (args: {
    itemId: string;
    parentId: string | null;
    newIndex: number;
    newOrder: number;
    siblings: Block[];
    item?: Block;
  }) => Promise<void>;
  /** 드롭 가능 여부 확인 (ExplorerTree의 canDrop prop) - 비활성화 */
  canDrop: (dragItemIds: string[], targetItemId: string) => boolean;
}

/**
 * 레이어 익스플로러 트리를 위한 커스텀 훅
 *
 * 이 훅은 레이어 블록들을 트리 구조로 표시하기 위한 모든 비즈니스 로직을 제공합니다.
 * ExplorerTree 컴포넌트와 함께 사용하여 레이어 계층 구조를 시각화할 수 있습니다.
 * 레이어에서는 드래그앤드롭이 비활성화되어 있습니다.
 *
 * @returns UseLayerExplorerTreeResult - 레이어 익스플로러에 필요한 모든 데이터와 함수들
 *
 * @example
 * ```tsx
 * function LayerExplorer() {
 *   const {
 *     layerBlocks,
 *     selectedNodeIds,
 *     getId,
 *     getName,
 *     getParentId,
 *     getOrder,
 *     getType,
 *     renderFileIcon,
 *     handleSelect,
 *     handleMove,
 *     canDrop,
 *   } = useLayerExplorerTree();
 *
 *   return (
 *     <ExplorerTree<Block>
 *       sourceData={layerBlocks}
 *       getId={getId}
 *       getName={getName}
 *       getParentId={getParentId}
 *       getOrder={getOrder}
 *       getType={getType}
 *       renderFileIcon={renderFileIcon}
 *       rootName="Layers"
 *       selectedId={selectedNodeIds[0]}
 *       onSelect={handleSelect}
 *       onMove={handleMove}
 *       canDrop={canDrop}
 *       disableFolderStructure={true}
 *     />
 *   );
 * }
 * ```
 */
export function useLayerExplorerTree(): UseLayerExplorerTreeResult {
  // Use refactored contexts for data and selection
  const { blocksById, getPositionsForContext } = useCanvasData();
  const { pageId, componentId } = useCanvasSelection();

  const { selectNodes } = useSelectionCommands();
  const panel = usePanel();


  // ===== 데이터 처리 =====
  /** 현재 컨텍스트에 포함된 레이어 블록만 필터링 */
  const layerBlocks = React.useMemo(() => {
    // 컨텍스트 ID 결정 (컴포넌트 모드면 componentId, 아니면 pageId)
    const contextId = componentId ?? pageId;

    if (!contextId) {
      // 컨텍스트가 없으면 빈 배열 반환
      return [];
    }

    // 현재 컨텍스트의 포지션 정보 가져오기
    const positions = getPositionsForContext(contextId);
    if (!positions || positions.length === 0) {
      // 포지션이 없으면 빈 배열 반환
      return [];
    }

    // 컨텍스트에 포함된 블록 ID 집합 생성
    const includedBlockIds = new Set(
      positions.map((p) => String(p.block_id)).filter(Boolean)
    );

    // 레이어 블록 필터링 (페이지가 아니면서 컨텍스트에 포함된 블록들만)
    return Object.values(blocksById).filter(
      (block) => block.object !== "page" && includedBlockIds.has(block.id)
    );
  }, [blocksById, pageId, componentId, getPositionsForContext]);

  // ===== 이벤트 핸들러 =====
  /** 레이어 블록 선택 처리 */
  const handleSelect = React.useCallback(
    (id: string) => {
      // Set node selection for React Flow
      selectNodes([id]);
      // Open editor panel for the selected block
      panel.openEditorPanel();
    },
    [selectNodes, panel]
  );

  /** 레이어 블록 드래그앤드롭 이동 처리 - 비활성화 */
  const handleMove = React.useCallback(
    async (args: {
      itemId: string;
      parentId: string | null;
      newIndex: number;
      newOrder: number;
      siblings: Block[];
      item?: Block;
    }) => {
      // 레이어 탐색기에서는 드래그 앤 드롭을 비활성화
      // console.log("Layer move disabled:", args);
    },
    []
  );

  /** 드롭 가능 여부 확인 - 비활성화 */
  const canDrop = React.useCallback(
    (dragItemIds: string[], targetItemId: string) => {
      // 레이어 탐색기에서는 드래그 앤 드롭을 비활성화
      return false;
    },
    []
  );

  return {
    // ===== 데이터 =====
    layerBlocks,
    selectedNodeIds: [],

    // ===== ExplorerTree용 변환 함수들 =====
    getId: (block: Block) => block.id,
    getName: (block: Block) => block.name,
    getParentId: (block: Block) => block.parent_block_id,
    getOrder: (block: Block) => block.order,
    getType: (block: Block) => block.block_type, // 더 디테일하게 타입 분류. 베이직-사각형, 베이직-원형 이런 식으로
    renderFileIcon: getLayerFileIcon,

    // ===== 이벤트 핸들러 =====
    handleSelect,
    handleMove,
    canDrop,
  };
}
