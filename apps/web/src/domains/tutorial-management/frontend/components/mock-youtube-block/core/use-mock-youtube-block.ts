'use client';

import { useCallback, useEffect } from 'react';
import { useTutorialDialogContext } from '../../tutorial-dialog/core/context';
import { useMockYoutubeBlockUI } from './use-mock-youtube-block.ui';

/**
 * Mock YouTube Block Hook
 *
 * Orchestrates UI state and tutorial state sync
 */
export function useMockYoutubeBlock() {
  const { tutorialState, updateTutorialState } = useTutorialDialogContext();
  const ui = useMockYoutubeBlockUI();

  // Sync with tutorial state
  useEffect(() => {
    if (tutorialState.youtubeUrl) {
      ui.setUrl(tutorialState.youtubeUrl as string);
    }
    if (tutorialState.showPlayer) {
      ui.setShowPlayer(tutorialState.showPlayer as boolean);
    }
  }, [tutorialState.youtubeUrl, tutorialState.showPlayer]);

  const handleUrlChange = useCallback(
    (newUrl: string) => {
      ui.setUrl(newUrl);
    },
    [ui]
  );

  const handleUrlSubmit = useCallback(() => {
    if (!ui.url) return;
    
    updateTutorialState({
      youtubeUrl: ui.url,
      showPlayer: true,
    });
    ui.setShowPlayer(true);
  }, [ui, updateTutorialState]);

  return {
    url: ui.url,
    showPlayer: ui.showPlayer,
    onUrlChange: handleUrlChange,
    onUrlSubmit: handleUrlSubmit,
  };
}
