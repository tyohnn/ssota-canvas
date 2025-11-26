/**
 * Beta Pending Status - UI State Hook
 *
 * Designer Domain: UI state only
 */

import { useState } from 'react';

export interface BetaPendingStatusUIState {
  isSigningOut: boolean;
  setIsSigningOut: (isSigningOut: boolean) => void;
}

/**
 * UI State Hook
 *
 * Manages sign-out loading state only
 * Note: Success toast is shown in form submission, not here
 */
export function useBetaPendingStatusUI(): BetaPendingStatusUIState {
  const [isSigningOut, setIsSigningOut] = useState(false);

  return {
    isSigningOut,
    setIsSigningOut,
  };
}
