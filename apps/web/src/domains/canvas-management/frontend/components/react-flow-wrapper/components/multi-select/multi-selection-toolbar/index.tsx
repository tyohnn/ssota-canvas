/**
 * Multi Selection Toolbar
 *
 * Container component that provides alignment and editing tools for multiple selected blocks.
 * All business logic and side effects are handled in the hook.
 *
 * Rendering conditions:
 * - Multi-selection mode is active
 * - At least 2 blocks are selected
 * - Toolbar position is calculated
 */

'use client';

import React, { memo } from 'react';

import { Box } from '@/components/ui/box';

import { ToolbarContent } from './components/toolbar-content';
import { useMultiSelectionToolbar } from './core/use-multi-selection-toolbar';

/**
 * Multi Selection Toolbar Container Component
 *
 * This is a pure Container component that:
 * - Uses the hook to get all state and handlers
 * - Passes them as props to Presentational components
 * - Handles visibility logic (early return)
 *
 * All side effects (ESC key handling, pinch zoom prevention) are handled in the hook.
 */
export const MultiSelectionToolbar = memo(function MultiSelectionToolbar() {
  const {
    toolbarPosition,
    toolbarRef,
    handleAlign,
    handleDistribute,
    handleDuplicate,
    handleDelete,
    selectionCount,
    isVisible,
  } = useMultiSelectionToolbar();

  // Don't render if toolbar should not be visible
  if (!isVisible || !toolbarPosition) {
    return null;
  }

  return (
    <Box
      ref={toolbarRef}
      className="absolute z-50"
      style={{
        left: toolbarPosition.left,
        top: toolbarPosition.top,
        transform: 'translateX(-50%) translateY(-100%)',
        willChange: 'transform', // Performance optimization
        touchAction: 'none', // Prevent pinch zoom
      }}
      onWheel={e => e.stopPropagation()}
    >
      {/* z-index hierarchy: blocks(0) < canvas-toolbar(10) < multi-selection-toolbar(50) */}
      <ToolbarContent
        onAlign={handleAlign}
        onDistribute={handleDistribute}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        selectedBlockCount={selectionCount}
      />
    </Box>
  );
});
