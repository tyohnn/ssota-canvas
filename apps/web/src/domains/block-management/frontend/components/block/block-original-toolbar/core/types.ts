/**
 * Block Original Toolbar Types
 *
 * BlockOriginalToolbar 컴포넌트의 타입 정의
 */
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';
import type { BlockViewModeValue } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';

/**
 * BlockOriginalToolbar Props
 */
export interface BlockOriginalToolbarProps {
  blockId: string;
  blockMountId: string;
  blockType: BlockType;
  blockData: BlockNodeData;
  width?: number;
  height?: number;
  readonly?: boolean;
}

/**
 * BlockOriginalToolbar UI State
 */
export interface BlockOriginalToolbarUIState {
  toolbarRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * BlockOriginalToolbar Business Logic
 */
export interface BlockOriginalToolbarBusinessLogic {
  viewMode: BlockViewModeValue;
  zoom: number;
  pageId: string | undefined;
  handleViewModeChange: (newViewMode: BlockViewModeValue) => Promise<void>;
  handleDetails: () => void;
}

/**
 * BlockOriginalToolbar Hook Return
 */
export interface UseBlockOriginalToolbarReturn {
  uiState: BlockOriginalToolbarUIState;
  business: BlockOriginalToolbarBusinessLogic;
}
