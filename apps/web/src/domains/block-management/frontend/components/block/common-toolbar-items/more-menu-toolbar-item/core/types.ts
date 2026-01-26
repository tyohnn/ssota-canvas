/**
 * More Menu Toolbar Item Types
 *
 * 더보기 메뉴 툴바 아이템 컴포넌트의 타입 정의
 */

export interface MoreMenuToolbarItemProps {
  blockId: string;
  blockMountId: string;
  width?: number;
  height?: number;
  /** 그룹에 포함된 블록일 때 Ungroup 메뉴 표시용 */
  parentBlockMountId?: string;
}

export interface MoreMenuBusinessLogic {
  handleEdit: () => void;
  handleDuplicate: () => Promise<void>;
  handleCreateComponent: () => void;
  handleDelete: () => Promise<void>;
  /** 그룹에 포함된 블록일 때만 정의됨 */
  handleUngroup?: () => void | Promise<void>;
}

export interface DomainDependencies {
  blockLifecycle: {
    duplicateBlockAndMount: (
      blockMountId: string,
      offsetX: number,
      offsetY: number
    ) => Promise<void>;
    removeNodeFromGroup: (params: {
      childBlockMountId: string;
      parentPosition: { x: number; y: number };
      childRelativePosition: { x: number; y: number };
    }) => Promise<void>;
  };
  canvasMode: {
    enterBlockEditingMode: (blockId: string, blockMountId: string) => void;
    exitToDefaultMode: () => void;
  };
  reactFlow: {
    deleteElements: (elements: { nodes: Array<{ id: string }> }) => void;
    getNode: (id: string) => { id: string; parentId?: string; position: { x: number; y: number } } | undefined;
  };
}

export interface MoreMenuUIState {
  // UI 상태가 필요하면 여기에 추가
}

export interface UseMoreMenuReturn {
  business: MoreMenuBusinessLogic;
  uiState: MoreMenuUIState;
}
