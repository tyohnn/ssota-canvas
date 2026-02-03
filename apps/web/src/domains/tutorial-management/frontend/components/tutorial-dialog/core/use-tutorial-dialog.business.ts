'use client';

import { useTutorialProgress } from '@/domains/tutorial-management/frontend/hooks/use-tutorial-progress';
import { useTutorialRegistry } from '@/domains/tutorial-management/frontend/hooks/use-tutorial-registry';
import type { TutorialDialogBusinessLogic } from './types';

/**
 * Tutorial Dialog Business Logic Hook
 *
 * Handles business logic: progress management, tutorial retrieval
 */
export function useTutorialDialogBusiness(): TutorialDialogBusinessLogic {
  const { loadProgress, saveProgress } = useTutorialProgress();
  const { getTutorialById, getAllTutorials, getTutorialGroups } = useTutorialRegistry();

  return {
    loadProgress,
    saveProgress,
    getTutorialById,
    getAllTutorials,
    getTutorialGroups,
  };
}
