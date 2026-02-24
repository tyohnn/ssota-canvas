import type { CanvasMode } from '../../../../../../hooks/mode/canvas-mode-context';

// =============================================================================
// 1. Atomic Types & Re-exports
// =============================================================================

// =============================================================================
// 2. Domain Models / Entities
// =============================================================================

// =============================================================================
// 3. Dependency Interfaces (External Systems)
// =============================================================================

/**
 * React Flow dependency interface
 * Used to reduce coupling with external library (XYFlow)
 */
export interface ReactFlowDependencies {
  fitView: (options?: { duration?: number; padding?: number }) => void;
}

/**
 * Canvas mode dependency interface
 * Used to reduce coupling with internal service hooks
 */
export interface ModeDependencies {
  isBlockCreationMode: () => boolean;
  isPanningMode: () => boolean;
  getCurrentMode: () => CanvasMode;
  enterPanningMode: () => void;
  exitToDefaultMode: () => void;
}

// =============================================================================
// 4. Functional / Business Logic Interfaces
// =============================================================================

// =============================================================================
// 5. Public Entry Point (Props)
// =============================================================================

import type { BlockType } from '@/domains/block-management/shared/types/block-types';

/**
 * CanvasToolbar Component Props
 */
export interface CanvasToolbarProps {
  onAddBlockTypeClick?: (blockType: BlockType) => void;
}

/**
 * CanvasToolbar Hook return type
 */
export interface UseCanvasToolbarReturn {
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  isBlockCreationMode: boolean;
  isPanningMode: boolean;
  currentMode: CanvasMode;
  onSelectClick: () => void;
  onHandClick: () => void;
  onFitToViewClick: () => void;
  onAddBlockTypeClick: (blockType: BlockType) => void;
  readonly: boolean;
}
