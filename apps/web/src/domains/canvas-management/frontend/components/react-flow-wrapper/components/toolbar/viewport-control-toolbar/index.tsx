/**
 * Viewport Controls Component
 *
 * Container component that provides viewport controls (zoom, fit to screen, minimap).
 * All business logic and side effects are handled in the hook.
 *
 * Features:
 * - Zoom in/out controls
 * - Fit to screen button
 * - Minimap toggle
 * - Zoom level display
 */

'use client';

import React, { memo } from 'react';

import { ViewportControlToolbarView } from './components';
import { useViewportControlToolbar } from './core/use-viewport-control-toolbar';

/**
 * Viewport Controls Container Component
 *
 * This is a pure Container component that:
 * - Uses the hook to get all state and handlers
 * - Passes them as props to Presentational components
 *
 * Pattern: Container (Thin)
 * - Minimal destructuring
 * - Connects Hook → View
 *
 * All side effects and business logic are handled in the hook.
 */
export const ViewportControlToolbar = memo(function ViewportControlToolbar() {
  const {
    showMiniMap,
    zoomLevel,
    toolbarRef,
    minimapRef,
    containerRef,
    toggleMiniMap,
    handleZoomIn,
    handleZoomOut,
    handleFitToScreen,
  } = useViewportControlToolbar();

  return (
    <ViewportControlToolbarView
      zoomLevel={zoomLevel}
      showMiniMap={showMiniMap}
      toolbarRef={toolbarRef}
      minimapRef={minimapRef}
      containerRef={containerRef}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onFitToScreen={handleFitToScreen}
      onToggleMiniMap={toggleMiniMap}
    />
  );
});
