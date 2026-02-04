'use client';

import { useState, useCallback } from 'react';
import type { TutorialState } from '@/domains/tutorial-management/shared/types/tutorial.types';
import type { TutorialDialogUIState } from './types';

/**
 * Tutorial Dialog UI Hook
 *
 * Manages UI state for the tutorial dialog (no business logic)
 */
export function useTutorialDialogUI(): TutorialDialogUIState {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTutorialId, setSelectedTutorialId] = useState<string | null>(
    null
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tutorialState, setTutorialState] = useState<TutorialState>({});

  return {
    isOpen,
    selectedTutorialId,
    currentStepIndex,
    tutorialState,
    setIsOpen,
    setSelectedTutorialId,
    setCurrentStepIndex,
    setTutorialState,
  };
}
