/**
 * Beta Pending Status Context
 */

'use client';

import { createContext, useContext } from 'react';
import type { BetaPendingStatusHookReturn } from './use-beta-pending-status';

export const BetaPendingStatusContext =
  createContext<BetaPendingStatusHookReturn | null>(null);

/**
 * Context Hook
 *
 * Access state from sub-components
 */
export function useBetaPendingStatusContext(): BetaPendingStatusHookReturn {
  const context = useContext(BetaPendingStatusContext);

  if (!context) {
    throw new Error(
      'useBetaPendingStatusContext must be used within BetaPendingStatusProvider'
    );
  }

  return context;
}
