"use client";

import React from "react";
import type { Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { usePanel } from "@/domains/react-flow-canvas/contexts/PanelContext";
import { useReactFlowSelectionCommands, useReactFlowSelectionState } from "@/domains/react-flow-canvas/contexts/ReactFlowSelectionContext";
import { useReactFlowCanvasControl } from "@/domains/react-flow-canvas/handlers/useReactFlowCanvasControlHandler";


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

export function useLayerExplorerTree(): UseLayerExplorerTreeResult {
  // React Flow 상태 연결
  const reactFlow = useReactFlow();
  const nodes = reactFlow.getNodes();
  const { selectedNodeIds } = useReactFlowSelectionState();
  const { selectNodes } = useReactFlowSelectionCommands();
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
    getName: (node: Node) => node.data.title as string,
    getParentId: (node: Node) => node.data.parent_block_id as string,
    getOrder: (node: Node) => node.data.order as number,
    getType: (node: Node) => node.data.block_type as string,
    renderFileIcon: getLayerFileIcon,

    // ===== 이벤트 핸들러 =====
    handleSelect,
    handleMove,
    canDrop,
  };
}
