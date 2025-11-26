/**
 * Beta Application Form Context
 */

'use client';

import { createContext, useContext } from 'react';
import type { BetaApplicationFormHookReturn } from './use-beta-application-form';

export const BetaApplicationFormContext =
  createContext<BetaApplicationFormHookReturn | null>(null);

/**
 * Context Hook
 *
 * Access form state from sub-components
 */
export function useBetaApplicationFormContext(): BetaApplicationFormHookReturn {
  const context = useContext(BetaApplicationFormContext);

  if (!context) {
    throw new Error(
      'useBetaApplicationFormContext must be used within BetaApplicationFormProvider'
    );
  }

  return context;
}
