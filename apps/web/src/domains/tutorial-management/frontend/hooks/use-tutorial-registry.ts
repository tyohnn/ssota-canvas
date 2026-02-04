'use client';

import { useCallback } from 'react';
import type {
  Tutorial,
  TutorialGroup,
} from '@/domains/tutorial-management/shared/types/tutorial.types';
import { tutorialRegistry } from '../config/tutorial-registry';

/**
 * Hook for accessing tutorial registry
 */
export function useTutorialRegistry() {
  /**
   * Get all tutorials
   */
  const getAllTutorials = useCallback((): Tutorial[] => {
    return tutorialRegistry.getAllTutorials();
  }, []);

  /**
   * Get tutorial by ID
   */
  const getTutorialById = useCallback((id: string): Tutorial | undefined => {
    return tutorialRegistry.getTutorialById(id);
  }, []);

  /**
   * Get tutorials by category
   */
  const getTutorialsByCategory = useCallback(
    (category: string): Tutorial[] => {
      return tutorialRegistry.getTutorialsByCategory(category);
    },
    []
  );

  /**
   * Get tutorial groups (for navigation)
   */
  const getTutorialGroups = useCallback((): TutorialGroup[] => {
    return tutorialRegistry.getTutorialGroups();
  }, []);

  return {
    getAllTutorials,
    getTutorialById,
    getTutorialsByCategory,
    getTutorialGroups,
  };
}
