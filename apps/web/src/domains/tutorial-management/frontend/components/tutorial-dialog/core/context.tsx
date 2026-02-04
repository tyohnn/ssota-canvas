'use client';

import { createContext, useContext } from 'react';
import type { TutorialDialogContextValue } from '@/domains/tutorial-management/shared/types/tutorial.types';

/**
 * Tutorial Dialog Context
 *
 * Provides tutorial dialog state and controls to child components
 */
export const TutorialDialogContext = createContext<TutorialDialogContextValue | null>(null);

/**
 * Hook to access Tutorial Dialog Context
 *
 * @throws {Error} if used outside of TutorialDialogProvider
 * @returns {TutorialDialogContextValue} Tutorial dialog context value
 */
export function useTutorialDialogContext(): TutorialDialogContextValue {
  const context = useContext(TutorialDialogContext);

  if (!context) {
    throw new Error(
      'useTutorialDialogContext must be used within a TutorialDialogProvider'
    );
  }

  return context;
}
