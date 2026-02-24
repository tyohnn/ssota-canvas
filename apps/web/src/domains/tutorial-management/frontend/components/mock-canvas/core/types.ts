/**
 * Mock Canvas Types
 */

export interface MockCanvasUIState {
  hasBlock: boolean;
  setHasBlock: (has: boolean) => void;
}

export interface MockCanvasProps {
  showBlockMenu: boolean;
  hasBlock: boolean;
  onAddBlockClick: () => void;
  onBlockTypeSelect: (type: string) => void;
}
