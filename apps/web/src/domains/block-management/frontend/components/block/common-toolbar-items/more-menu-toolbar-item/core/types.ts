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
}

export interface MoreMenuBusinessLogic {
  handleEdit: () => void;
  handleDuplicate: () => Promise<void>;
  handleCreateComponent: () => void;
  handleDelete: () => Promise<void>;
}

export interface DomainDependencies {
  blockLifecycle: {
    duplicateBlockAndMount: (
      blockMountId: string,
      offsetX: number,
      offsetY: number
    ) => Promise<void>;
  };
  canvasMode: {
    enterBlockEditingMode: (blockId: string) => void;
    exitToDefaultMode: () => void;
  };
  reactFlow: {
    deleteElements: (elements: { nodes: Array<{ id: string }> }) => void;
  };
}

export interface MoreMenuUIState {
  // UI 상태가 필요하면 여기에 추가
}

export interface UseMoreMenuReturn {
  business: MoreMenuBusinessLogic;
  uiState: MoreMenuUIState;
}
