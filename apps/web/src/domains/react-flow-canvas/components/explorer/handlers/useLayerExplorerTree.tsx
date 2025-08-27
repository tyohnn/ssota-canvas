"use client";

import React from "react";
import type { Block } from "@/db/schema";
import type { Node } from "@xyflow/react";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { usePanel } from "@/domains/react-flow-canvas/contexts/PanelContext";
import { useSelectionCommands, useSelectionState } from "@/domains/react-flow-canvas/contexts/SelectionContext";
import { useReactFlowCanvas } from "@/domains/react-flow-canvas/contexts/ReactFlowCanvasContext";
import { useReactFlowCanvasControl } from "@/domains/react-flow-canvas/hooks/useReactFlowCanvasControl";


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
  /** React Flow 노드 배열 (변환 없이 직접 사용) */
  layerBlocks: Node[];
  /** 현재 선택된 노드 ID들 */
  selectedNodeIds: string[];

  // ===== ExplorerTree용 변환 함수들 =====
  /** 노드에서 고유 ID 추출 (ExplorerTree의 getId prop) */
  getId: (node: Node) => string;
  /** 노드에서 표시할 이름 추출 (ExplorerTree의 getName prop) */
  getName: (node: Node) => string;
  /** 노드의 부모 ID 추출 (ExplorerTree의 getParentId prop) */
  getParentId: (node: Node) => string | null;
  /** 노드의 정렬 순서 추출 (ExplorerTree의 getOrder prop) */
  getOrder: (node: Node) => number;
  /** 노드의 타입 추출 (ExplorerTree의 getType prop) */
  getType: (node: Node) => string;
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
    siblings: Node[];
    item?: Node;
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
  // React Flow 상태 연결
  const { nodes } = useReactFlowCanvas();
  const { selectedNodeIds } = useSelectionState();
  const { selectNodes } = useSelectionCommands();
  const { focusOnNode } = useReactFlowCanvasControl();
  const panel = usePanel();

  // ===== 데이터 처리 =====
  /** React Flow 노드 그대로 사용 */
  const layerBlocks = React.useMemo(() => {
    return nodes as Node[];
  }, [nodes]);

  // ===== 이벤트 핸들러 =====
  /** 레이어 블록 선택 처리 */
  const handleSelect = React.useCallback(
    (id: string) => {
      // React Flow 선택 상태 업데이트
      selectNodes([id]);
      
      // 선택된 노드로 포커스
      setTimeout(() => {
        focusOnNode(id);
      }, 100);
      
      // 에디터 패널 열기
      panel.openEditorPanel();
    },
    [selectNodes, focusOnNode, panel]
  );

  /** 레이어 블록 드래그앤드롭 이동 처리 - 비활성화 */
  const handleMove = React.useCallback(
    async (args: {
      itemId: string;
      parentId: string | null;
      newIndex: number;
      newOrder: number;
      siblings: Node[];
      item?: Node;
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
    selectedNodeIds,

    // ===== ExplorerTree용 변환 함수들 =====
    getId: (node: Node) => node.id,
    getName: (node: Node) => (node.data?.label as string) || (node.data?.name as string) || node.id,
    getParentId: (node: Node) => (node.data?.block as any)?.parent_block_id || null,
    getOrder: (node: Node) => (node.data?.block as any)?.order || 0,
    getType: (node: Node) => node.type || 'unknown',
    renderFileIcon: getLayerFileIcon,

    // ===== 이벤트 핸들러 =====
    handleSelect,
    handleMove,
    canDrop,
  };
}
