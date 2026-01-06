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
 * Canvas viewport dependency interface
 * Used to reduce coupling with internal service hooks
 */
export interface ViewportDependencies {
  getZoomLevel: () => number;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
}

// =============================================================================
// 4. Functional / Business Logic Interfaces
// =============================================================================

// =============================================================================
// 5. Public Entry Point (Props)
// =============================================================================

/**
 * ViewportControlToolbar Hook return type
 */
export interface UseViewportControlToolbarReturn {
  // UI state
  showMiniMap: boolean;
  zoomLevel: number;

  // Refs
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  minimapRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;

  // Handlers
  toggleMiniMap: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleFitToScreen: () => void;
}
