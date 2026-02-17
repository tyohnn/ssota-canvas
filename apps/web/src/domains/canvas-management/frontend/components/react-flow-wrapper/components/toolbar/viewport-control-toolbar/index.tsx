/**
 * Viewport Controls Component
 *
 * Container component that provides viewport controls (zoom in/out only).
 * All business logic and side effects are handled in the hook.
 *
 * Features:
 * - Zoom in/out controls
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
    zoomLevel,
    toolbarRef,
    containerRef,
    handleZoomIn,
    handleZoomOut,
  } = useViewportControlToolbar();

  return (
    <ViewportControlToolbarView
      zoomLevel={zoomLevel}
      toolbarRef={toolbarRef}
      containerRef={containerRef}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
    />
  );
});
