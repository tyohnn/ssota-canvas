import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

// =============================================================================
// 1. Public Entry Point (Props)
// =============================================================================

/**
 * Block Header Props
 */
export interface BlockHeaderProps {
  data: BlockNodeData;
  selected: boolean;
  width?: number;
  className?: string;
}

// =============================================================================
// 2. Hook Interfaces
// =============================================================================

/**
 * Block Header Hook Props
 */
export interface BlockHeaderHookProps {
  data: BlockNodeData;
  selected: boolean;
}

/**
 * Block Header Business Logic Interface
 */
export interface BlockHeaderBusinessLogic {
  /**
   * Updates the block title
   *
   * @param title - New title
   * @returns Promise<boolean> - Resolves to true on success, false on failure
   */
  updateTitle: (title: string) => Promise<boolean>;
  isUpdating: boolean;
}

/**
 * Block Header UI State
 */
export interface BlockHeaderUIState {
  title: string;
  setTitle: (title: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Block Header Hook Return
 */
export interface UseBlockHeaderReturn {
  title: string;
  setTitle: (title: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleSave: () => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  isUpdating: boolean;
  isVisible: boolean;
  zoom: number;
}
