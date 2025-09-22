"use client";

import React from "react";
import { Atom, FileText, File, Blocks } from "lucide-react";
import type { Block } from "@/db/schema";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { updateBlock } from "@/domains/canvas/actions/block.action";
import { useReactFlowSelectionCommands } from "@/domains/react-flow-canvas/contexts/ReactFlowSelectionContext";

// Page-specific file icon renderer
function getPageFileIcon(blockType: string | undefined, className: string) {
  switch (blockType) {
    case "page":
      return <FileText className={className} />;
    case "component":
      return <Atom className={className} />;
    case "block":
      return <Blocks className={className} />;
    default:
      return <File className={className} />;
  }
}

export interface UsePageExplorerTreeResult {
  // ===== 데이터 =====
  /** 페이지 객체만 필터링된 블록 배열 (object === "page") */
  pageBlocks: Block[];
  /** 현재 선택된 페이지 블록 (없으면 null) */
  selectedPageBlock: Block | null;

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
  /** 페이지 블록 선택 처리 (ExplorerTree의 onSelect prop) */
  handleSelect: (id: string) => void;
  /** 페이지 블록 드래그앤드롭 이동 처리 (ExplorerTree의 onMove prop)
   *
   * @param args - 이동 관련 정보
   * @param args.itemId - 이동할 아이템의 ID
   * @param args.parentId - 새로운 부모 ID (null이면 루트)
   * @param args.newIndex - 새로운 위치 인덱스
   * @param args.newOrder - 계산된 새로운 정렬 순서
   * @param args.siblings - 같은 부모 하위의 형제 아이템들
   * @param args.item - 이동할 아이템 객체 (optional)
   */
  handleMove: (args: {
    itemId: string;
    parentId: string | null;
    newIndex: number;
    newOrder: number;
    siblings: Block[];
    item?: Block;
  }) => Promise<void>;
}


export function usePageExplorerTree(): UsePageExplorerTreeResult {
  const { pageBlocks, selectedPageBlock, selectPage, updatePageBlock } = useCanvasData();
  const { clearSelection } = useReactFlowSelectionCommands();


  // ===== 이벤트 핸들러 =====
  /** 페이지 블록 선택 처리 - root가 아닌 경우에만 선택 */
  const handleSelect = React.useCallback(
    (id: string) => {
      if (id !== "root") {
        selectPage(id);
        // 페이지 선택 시 React Flow 선택 상태 초기화
        clearSelection();
      }
    },
    [selectPage, clearSelection]
  );

  /** 페이지 블록 드래그앤드롭 이동 처리
   *
   * Optimistic Update 패턴을 사용하여 즉시 UI 업데이트 후 DB 동기화
   * 실패 시 원래 상태로 롤백
   *
   * @param args - 이동 관련 정보
   */
  const handleMove = React.useCallback(
    async (args: {
      itemId: string;
      parentId: string | null;
      newIndex: number;
      newOrder: number;
      siblings: Block[];
      item?: Block;
    }) => {
      const { itemId, parentId, newOrder, item } = args;

      // 유효성 검사
      if (!item) return;

      // 실제 이동이 필요한지 확인 (같은 부모면 이동 불필요)
      if (item.parent_block_id === parentId) return;

      // 롤백을 위한 원본 상태 저장
      const originalBlock = { ...item };

      // 1단계: Optimistic Update (즉시 UI 반영)
      updatePageBlock(itemId, {
        parent_block_id: parentId,
        order: newOrder,
        updated_at: new Date(),
      });

      // 2단계: DB 동기화 (백그라운드)
      try {
        const result = await updateBlock({
          id: itemId,
          parentBlockId: parentId,
          order: newOrder,
        });

        if (!result.success) {
          console.error("Failed to update block:", result.error);
          // 실패 시 Optimistic Update 롤백
          updatePageBlock(itemId, originalBlock);
        }
      } catch (error) {
        console.error("Failed to update block in DB:", error);
        // 에러 시 Optimistic Update 롤백
        updatePageBlock(itemId, originalBlock);
      }
    },
    [updatePageBlock]
  );

  return {
    // ===== 데이터 =====
    pageBlocks,
    selectedPageBlock,

    // ===== ExplorerTree용 변환 함수들 =====
    getId: (block: Block) => block.id,
    getName: (block: Block) => block.title,
    getParentId: (block: Block) => block.parent_block_id,
    getOrder: (block: Block) => block.order,
    getType: (block: Block) => block.block_type,
    renderFileIcon: getPageFileIcon,

    // ===== 이벤트 핸들러 =====
    handleSelect,
    handleMove,
  };
}
