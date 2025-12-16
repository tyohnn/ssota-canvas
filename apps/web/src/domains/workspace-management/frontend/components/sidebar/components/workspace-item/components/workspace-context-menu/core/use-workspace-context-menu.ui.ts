'use client';

import { useState } from 'react';

/**
 * UI State Hook for WorkspaceContextMenu (Domain Level)
 *
 * Manages local UI state:
 * - Menu open state
 * - Dialog open states (settings, invite, archive)
 *
 * Can be used independently in Storybook
 */
export function useWorkspaceContextMenuUI() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  return {
    isMenuOpen,
    setIsMenuOpen,
    showSettings,
    setShowSettings,
    showInvite,
    setShowInvite,
    showArchive,
    setShowArchive,
  };
}

export type WorkspaceContextMenuUIState = ReturnType<
  typeof useWorkspaceContextMenuUI
>;
