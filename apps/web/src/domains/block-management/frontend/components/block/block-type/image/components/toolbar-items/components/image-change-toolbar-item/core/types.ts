/**
 * Image Change Toolbar Item Types
 */

export interface ImageChangeToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentValue: string;
  disabled?: boolean;
  orgId: string;
  workspaceId: string;
  pageId: string;
  onPropertiesChange?: (properties: Record<string, any>) => Promise<void>;
}

/**
 * UI State Interface
 */
export interface ImageChangeUIState {
  // UI 상태는 없음 (Stateless 컴포넌트)
}

/**
 * Business Logic Interface
 */
export interface ImageChangeBusinessLogic {
  handleImageChange: () => void;
  isUploading: boolean;
}
