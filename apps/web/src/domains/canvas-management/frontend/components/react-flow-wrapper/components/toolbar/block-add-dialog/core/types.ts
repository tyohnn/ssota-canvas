import type { ReactNode } from 'react';

import type { BlockType } from '@/domains/block-management/shared/types/block-types';

// =============================================================================
// 1. Atomic Types & Re-exports
// =============================================================================

export { type BlockType };

// =============================================================================
// 2. Domain Models / Entities
// =============================================================================

/**
 * Block Type information for dialog display
 */
export interface BlockTypeInfo {
  type: BlockType;
  displayName: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  category?: string;
  isPreparing?: boolean; // 준비 중인 블록
}

// =============================================================================
// 3. Dependency Interfaces (External Systems)
// =============================================================================

/**
 * Canvas mode dependency interface
 * Used to reduce coupling with internal service hooks
 */
export interface ModeDependencies {
  enterBlockCreationMode: (blockType: BlockType) => void;
}

// =============================================================================
// 4. Functional / Business Logic Interfaces
// =============================================================================

// =============================================================================
// 5. Public Entry Point (Props)
// =============================================================================

/**
 * BlockAddDialog Component Props
 */
export interface BlockAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlockType: (blockType: BlockType) => void;
}

/**
 * BlockAddDialog Hook return type
 */
export interface UseBlockAddDialogReturn {
  blockTypesByCategory: Record<string, BlockTypeInfo[]>;
  handleSelectBlockType: (blockType: BlockType) => void;
}
