'use client';

import { useState } from 'react';
import type { SettingsTab } from './types';

/**
 * UI State Hook for WorkspaceSettingsDialog (Domain Level)
 *
 * Manages local UI state:
 * - Active tab state
 *
 * Can be used independently in Storybook
 */
export function useWorkspaceSettingsDialogUI(
  defaultTab: SettingsTab = 'general'
) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

  return {
    activeTab,
    setActiveTab,
  };
}

export type WorkspaceSettingsDialogUIState = ReturnType<
  typeof useWorkspaceSettingsDialogUI
>;
