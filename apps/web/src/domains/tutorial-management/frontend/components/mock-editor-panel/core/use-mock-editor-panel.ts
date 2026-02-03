'use client';

import { useTutorialDialogContext } from '../../tutorial-dialog/core/context';
import type { MockEditorPanelTabId } from './types';

/**
 * Syncs editor panel state with tutorial state (activeEditorTab).
 */
export function useMockEditorPanel() {
  const { tutorialState, updateTutorialState } = useTutorialDialogContext();

  const activeTab =
    (tutorialState.activeEditorTab as MockEditorPanelTabId) ?? 'summary';

  const setActiveTab = (tabId: MockEditorPanelTabId) => {
    updateTutorialState({ activeEditorTab: tabId });
  };

  return { activeTab, setActiveTab };
}
