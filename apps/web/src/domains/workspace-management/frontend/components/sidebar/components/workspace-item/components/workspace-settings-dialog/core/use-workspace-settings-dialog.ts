'use client';

import { useCallback, useMemo } from 'react';
import { Settings, Users } from 'lucide-react';
import { useWorkspaceSettingsDialogUI } from './use-workspace-settings-dialog.ui';
import type { WorkspaceSettingsDialogProps, Tab } from './types';

/**
 * Combined Hook for WorkspaceSettingsDialog (Domain Level v4.0.0)
 *
 * Integrates:
 * - UI State (from useWorkspaceSettingsDialogUI)
 * - Business logic (workspace, dialog handlers)
 *
 * Manages:
 * - Workspace data (global)
 * - Dialog close (global)
 * - Tab navigation (global)
 *
 * Note: Form/business logic moved to local Containers:
 * - Form state → general-settings-form (local)
 * - Member state → members-tab (local)
 */
export function useWorkspaceSettingsDialog({
  workspace,
  open,
  onOpenChange,
  disableInvite = false,
}: WorkspaceSettingsDialogProps) {
  // UI State
  const uiState = useWorkspaceSettingsDialogUI();

  // Dialog handlers
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Tab definitions
  const tabs: Tab[] = useMemo(() => {
    const baseTabs: Tab[] = [
      { id: 'general', label: 'Settings', icon: Settings },
    ];

    if (!disableInvite) {
      baseTabs.push({ id: 'members', label: 'Members', icon: Users });
    }

    return baseTabs;
  }, [disableInvite]);

  return {
    // Props (Global)
    workspace,
    disableInvite,

    // Actions (Global)
    handleClose,

    // Tab state (from UI hook)
    activeTab: uiState.activeTab,
    setActiveTab: uiState.setActiveTab,
    tabs,
  };
}

export type WorkspaceSettingsDialogState = ReturnType<
  typeof useWorkspaceSettingsDialog
>;
