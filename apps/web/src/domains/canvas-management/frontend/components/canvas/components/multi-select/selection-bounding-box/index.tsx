/**
 * Selection Bounding Box
 *
 * Container component that provides a visual bounding box for multiple selected blocks.
 * All business logic and side effects are handled in the hook.
 *
 * Rendering conditions:
 * - Multi-selection mode is active
 * - At least 2 blocks are selected
 * - Bounding box position is calculated
 */

'use client';

import React, { memo } from 'react';

import { BoundingBoxView } from './components/bounding-box-view';
import type { SelectionBoundingBoxProps } from './core/types';
import { useSelectionBoundingBox } from './core/use-selection-bounding-box';

/**
 * Selection Bounding Box Container Component
 *
 * This is a pure Container component that:
 * - Uses the hook to get all state and handlers
 * - Passes them as props to Presentational components
 * - Handles visibility logic (early return)
 *
 * All side effects (drag handling, pinch zoom prevention) are handled in the hook.
 */
export const SelectionBoundingBox = memo(function SelectionBoundingBox({
  orgId,
  workspaceId,
  businessLogic,
}: SelectionBoundingBoxProps) {
  const { bounds, boundingBoxRef, handleMouseDown, isVisible } =
    useSelectionBoundingBox({ orgId, workspaceId, businessLogic });

  // Don't render if bounding box should not be visible
  if (!isVisible || !bounds) {
    return null;
  }

  return (
    <BoundingBoxView
      bounds={bounds}
      boundingBoxRef={boundingBoxRef}
      onMouseDown={handleMouseDown}
    />
  );
});
