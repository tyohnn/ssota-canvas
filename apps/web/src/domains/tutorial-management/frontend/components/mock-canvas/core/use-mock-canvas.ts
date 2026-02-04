'use client';

import { useCallback, useEffect } from 'react';
import { useTutorialDialogContext } from '../../tutorial-dialog/core/context';
import { useMockCanvasUI } from './use-mock-canvas.ui';

/**
 * Mock Canvas Hook
 *
 * Orchestrates UI state and tutorial state sync
 */
export function useMockCanvas() {
  const { tutorialState, updateTutorialState } = useTutorialDialogContext();
  const ui = useMockCanvasUI();

  // Sync with tutorial state
  useEffect(() => {
    if (tutorialState.showBlockMenu !== undefined) {
      ui.setShowBlockMenu(tutorialState.showBlockMenu as boolean);
    }
    if (tutorialState.hasBlock !== undefined) {
      ui.setHasBlock(tutorialState.hasBlock as boolean);
    }
  }, [tutorialState.showBlockMenu, tutorialState.hasBlock]);

  const handleAddBlockClick = useCallback(() => {
    updateTutorialState({ showBlockMenu: true });
    ui.setShowBlockMenu(true);
  }, [updateTutorialState, ui]);

  const handleCloseDialog = useCallback(() => {
    ui.setShowBlockMenu(false);
    updateTutorialState({ showBlockMenu: false });
  }, [ui, updateTutorialState]);

  const handleSelectBlockType = useCallback(
    (blockType: string) => {
      updateTutorialState({
        showBlockMenu: false,
        selectedBlockType: blockType,
      });
      ui.setShowBlockMenu(false);
    },
    [updateTutorialState, ui]
  );

  const handleBlockPlaced = useCallback(() => {
    updateTutorialState({ hasBlock: true });
    ui.setHasBlock(true);
  }, [updateTutorialState, ui]);

  return {
    showBlockMenu: ui.showBlockMenu,
    hasBlock: ui.hasBlock,
    handleAddBlockClick,
    handleCloseDialog,
    handleSelectBlockType,
    handleBlockPlaced,
  };
}
