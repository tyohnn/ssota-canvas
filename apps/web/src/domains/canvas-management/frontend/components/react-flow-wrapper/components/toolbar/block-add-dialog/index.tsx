/**
 * Block Add Dialog Component
 *
 * Container component that provides block type selection dialog.
 * All business logic and side effects are handled in the hook.
 *
 * Features:
 * - Block type selection with search
 * - Category grouping
 * - Keyboard navigation
 */

'use client';

import React, { memo } from 'react';

import { BlockAddDialogView } from './components';
import type { BlockAddDialogProps } from './core/types';
import { useBlockAddDialog } from './core/use-block-add-dialog';

/**
 * Block Add Dialog Container Component
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
export const BlockAddDialog = memo(function BlockAddDialog({
  isOpen,
  onClose,
  onSelectBlockType,
}: BlockAddDialogProps) {
  const { blockTypesByCategory, handleSelectBlockType } = useBlockAddDialog({
    isOpen,
    onClose,
    onSelectBlockType,
  });

  return (
    <BlockAddDialogView
      isOpen={isOpen}
      onClose={onClose}
      blockTypesByCategory={blockTypesByCategory}
      onSelectBlockType={handleSelectBlockType}
    />
  );
});
