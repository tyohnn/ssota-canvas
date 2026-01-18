/**
 * Canvas Toolbar Component
 *
 * Container component that provides canvas toolbar controls.
 * All business logic and side effects are handled in the hook.
 *
 * Features:
 * - Selection tool
 * - Hand tool (panning mode)
 * - Fit to view
 * - Add block
 * - Keyboard shortcuts (F, Space, Escape)
 */

'use client';

import React, { memo } from 'react';

import { CanvasToolbarView } from './components';
import type { CanvasToolbarProps } from './core/types';
import { useCanvasToolbar } from './core/use-canvas-toolbar';

/**
 * Canvas Toolbar Container Component
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
export const CanvasToolbar = memo(function CanvasToolbar({
  onAddBlockClick,
}: CanvasToolbarProps) {
  const {
    toolbarRef,
    isBlockCreationMode,
    isPanningMode,
    currentMode,
    onSelectClick,
    onHandClick,
    onFitToViewClick,
    onAddBlockClick: handleAddBlockClick,
    readonly,
  } = useCanvasToolbar({
    onAddBlockClick,
  });

  return (
    <CanvasToolbarView
      toolbarRef={toolbarRef}
      isBlockCreationMode={isBlockCreationMode}
      isPanningMode={isPanningMode}
      currentMode={currentMode}
      onSelectClick={onSelectClick}
      onHandClick={onHandClick}
      onFitToViewClick={onFitToViewClick}
      onAddBlockClick={handleAddBlockClick}
      readonly={readonly}
    />
  );
});
