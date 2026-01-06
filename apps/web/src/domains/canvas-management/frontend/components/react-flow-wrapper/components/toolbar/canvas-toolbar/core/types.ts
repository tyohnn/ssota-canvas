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

/**
 * CanvasToolbar Component Props
 */
export interface CanvasToolbarProps {
  onAddBlockClick?: () => void;
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
  onAddBlockClick: () => void;
}
