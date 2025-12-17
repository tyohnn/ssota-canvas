'use client';

import { useCallback } from 'react';
import { useWorkspaceContextMenuUI } from './use-workspace-context-menu.ui';
import type { WorkspaceContextMenuProps } from './types';

/**
 * Combined Hook for WorkspaceContextMenu (Domain Level v4.0.0)
 *
 * Integrates:
 * - UI State (from useWorkspaceContextMenuUI)
 * - Business logic (dialog handlers, parent state sync)
 *
 * Manages:
 * - Menu open/close state
 * - Dialog open states (settings, invite, archive)
 * - Parent state synchronization
 */
export function useWorkspaceContextMenu({
  workspace,
  onOpenChange,
  isParentHovered = false,
  disableInvite = false,
}: WorkspaceContextMenuProps) {
  // UI State
  const {
    isMenuOpen,
    setIsMenuOpen,
    showSettings,
    setShowSettings,
    showInvite,
    setShowInvite,
    showArchive,
    setShowArchive,
  } = useWorkspaceContextMenuUI();

  // Calculate if any dialog or menu is open
  const isAnyDialogOrMenuOpen =
    isMenuOpen || showSettings || showInvite || showArchive;

  // Menu handlers
  const handleMenuOpenChange = useCallback(
    (open: boolean) => {
      setIsMenuOpen(open);
      // Use functional update to get latest state
      onOpenChange?.(open || showSettings || showInvite || showArchive);
    },
    [onOpenChange, setIsMenuOpen, showSettings, showInvite, showArchive]
  );

  // Dialog handlers with parent state sync
  const handleSettingsChange = useCallback(
    (open: boolean) => {
      setShowSettings(open);
      onOpenChange?.(open || isMenuOpen || showInvite || showArchive);
    },
    [onOpenChange, setShowSettings, isMenuOpen, showInvite, showArchive]
  );

  const handleInviteChange = useCallback(
    (open: boolean) => {
      setShowInvite(open);
      onOpenChange?.(open || isMenuOpen || showSettings || showArchive);
    },
    [onOpenChange, setShowInvite, isMenuOpen, showSettings, showArchive]
  );

  const handleArchiveChange = useCallback(
    (open: boolean) => {
      setShowArchive(open);
      onOpenChange?.(open || isMenuOpen || showSettings || showInvite);
    },
    [onOpenChange, setShowArchive, isMenuOpen, showSettings, showInvite]
  );

  return {
    // Props
    workspace,
    isParentHovered,
    disableInvite,

    // UI State
    isMenuOpen,
    showSettings,
    showInvite,
    showArchive,
    isAnyDialogOrMenuOpen,

    // Handlers
    handleMenuOpenChange,
    handleSettingsChange,
    handleInviteChange,
    handleArchiveChange,
  };
}

export type WorkspaceContextMenuState = ReturnType<
  typeof useWorkspaceContextMenu
>;
