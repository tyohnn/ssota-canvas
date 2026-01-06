import { useCanvasMetadata } from '../../../../../../hooks';
import { useCanvasViewport } from '../../../../../../hooks/use-canvas-viewport';
import type {
  UseViewportControlToolbarReturn,
  ViewportDependencies,
} from './types';
import { useViewportControlToolbarUI } from './use-viewport-control-toolbar.ui';

/**
 * Combined Hook: UI + Viewport Logic
 *
 * This hook serves as the single point of entry for all external dependencies.
 */
export function useViewportControlToolbar(): UseViewportControlToolbarReturn {
  // 1. Gather External Dependencies (The only place where external hooks are called)
  const { pageId } = useCanvasMetadata();
  
  // Domain / Service Hooks
  const canvasViewport = useCanvasViewport({ pageId });

  // 2. Bundle Dependencies into semantic objects
  const viewportDependencies: ViewportDependencies = {
    getZoomLevel: () => canvasViewport.getZoomLevel(),
    zoomIn: () => canvasViewport.zoomIn(),
    zoomOut: () => canvasViewport.zoomOut(),
    fitToScreen: () => canvasViewport.fitToScreen(),
  };

  // 3. Inject into UI State Hook (Designer area)
  const uiState = useViewportControlToolbarUI(viewportDependencies);

  // 4. Compose and Return
  return {
    showMiniMap: uiState.showMiniMap,
    zoomLevel: uiState.zoomLevel,
    toolbarRef: uiState.toolbarRef,
    minimapRef: uiState.minimapRef,
    containerRef: uiState.containerRef,
    toggleMiniMap: uiState.toggleMiniMap,
    handleZoomIn: uiState.handleZoomIn,
    handleZoomOut: uiState.handleZoomOut,
    handleFitToScreen: uiState.handleFitToScreen,
  };
}
