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
    if (tutorialState.hasBlock !== undefined) {
      ui.setHasBlock(tutorialState.hasBlock as boolean);
    }
  }, [tutorialState.hasBlock]);

  const handleBlockPlaced = useCallback(() => {
    updateTutorialState({ hasBlock: true });
    ui.setHasBlock(true);
  }, [updateTutorialState, ui]);

  return {
    hasBlock: ui.hasBlock,
    handleBlockPlaced,
  };
}
