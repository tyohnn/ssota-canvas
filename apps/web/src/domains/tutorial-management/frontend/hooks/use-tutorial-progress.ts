'use client';

import { useCallback } from 'react';
import type { TutorialProgress } from '@/domains/tutorial-management/shared/types/tutorial.types';

const STORAGE_KEY = 'ssota-tutorial-progress';

/**
 * Hook for managing tutorial progress in LocalStorage
 */
export function useTutorialProgress() {
  /**
   * Load all tutorial progress from LocalStorage
   */
  const loadProgress = useCallback((): Record<string, TutorialProgress> => {
    if (typeof window === 'undefined') return {};

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return {};
      return JSON.parse(stored);
    } catch (error) {
      console.error('[Tutorial Progress] Failed to load progress:', error);
      return {};
    }
  }, []);

  /**
   * Save tutorial progress to LocalStorage
   */
  const saveProgress = useCallback(
    (tutorialId: string, progress: TutorialProgress) => {
      if (typeof window === 'undefined') return;

      try {
        const allProgress = loadProgress();
        allProgress[tutorialId] = progress;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
      } catch (error) {
        console.error('[Tutorial Progress] Failed to save progress:', error);
      }
    },
    [loadProgress]
  );

  /**
   * Reset specific tutorial progress
   */
  const resetProgress = useCallback(
    (tutorialId: string) => {
      if (typeof window === 'undefined') return;

      try {
        const allProgress = loadProgress();
        delete allProgress[tutorialId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
      } catch (error) {
        console.error('[Tutorial Progress] Failed to reset progress:', error);
      }
    },
    [loadProgress]
  );

  /**
   * Clear all tutorial progress
   */
  const clearAllProgress = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[Tutorial Progress] Failed to clear progress:', error);
    }
  }, []);

  return {
    loadProgress,
    saveProgress,
    resetProgress,
    clearAllProgress,
  };
}
