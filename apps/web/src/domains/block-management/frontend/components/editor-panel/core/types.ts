/**
 * Editor Panel Types
 */

export interface EditorPanelProps {
  blockId: string;
  blockMountId: string;
  isOpen: boolean;
}

export interface LayoutConfig {
  editorRatio: number;
  leftPaddingRatio: number;
  rightPaddingRatio: number;
  centerRatio: number;
  preferredZoom: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}
