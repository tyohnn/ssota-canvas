/**
 * Mock Canvas Types
 */

export interface MockCanvasUIState {
  showBlockMenu: boolean;
  hasBlock: boolean;
  setShowBlockMenu: (show: boolean) => void;
  setHasBlock: (has: boolean) => void;
}

export interface MockCanvasProps {
  showBlockMenu: boolean;
  hasBlock: boolean;
  onAddBlockClick: () => void;
  onBlockTypeSelect: (type: string) => void;
}
