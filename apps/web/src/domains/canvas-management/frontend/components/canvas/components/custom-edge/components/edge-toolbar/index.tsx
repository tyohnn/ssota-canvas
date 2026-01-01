/**
 * Edge Toolbar
 *
 * Container component that provides editing tools for a selected edge.
 * All business logic and side effects are handled in the hook.
 *
 * Features:
 * - Edge shape change Popover (icon only)
 * - Edge color change Popover
 * - Edge width change Popover (3 widths)
 * - Delete button
 *
 * @see 03-user-flow.md - Screen 3: Edge edit mode
 */

'use client';

import React, { memo } from 'react';

import { EdgeToolbarView } from './components/edge-toolbar-view';
import type { EdgeToolbarProps } from './core/types';
import { useEdgeToolbar } from './core/use-edge-toolbar';

/**
 * Edge Toolbar Container Component
 *
 * This is a pure Container component that:
 * - Uses the hook to get all state and handlers
 * - Passes them as props to Presentational components
 *
 * All side effects (pinch zoom prevention) are handled in the hook.
 */
// Re-export types for external use
export type { EdgeToolbarProps } from './core/types';

export const EdgeToolbar = memo(function EdgeToolbar({
  pageId,
  edgeId,
  businessLogic,
}: EdgeToolbarProps) {
  const {
    toolbarRef,
    edgeState,
    handleShapeChange,
    handleColorChange,
    handleWidthChange,
    handleDelete,
    isZoomVisible,
    zoom,
  } = useEdgeToolbar({ pageId, edgeId }, businessLogic);

  return (
    <EdgeToolbarView
      edgeId={edgeId}
      currentShape={edgeState.shape}
      currentColorToken={edgeState.colorToken}
      currentWidth={edgeState.width}
      onShapeChange={handleShapeChange}
      onColorChange={handleColorChange}
      onWidthChange={handleWidthChange}
      onDelete={handleDelete}
      toolbarRef={toolbarRef}
      isZoomVisible={isZoomVisible}
      zoom={zoom}
    />
  );
});
