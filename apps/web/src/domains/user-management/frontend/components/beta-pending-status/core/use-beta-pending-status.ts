/**
 * Beta Pending Status - Combined Hook
 *
 * Integrates UI State + Business Logic
 */

import { useCallback } from 'react';
import {
  useBetaPendingStatusUI,
  type BetaPendingStatusUIState,
} from './use-beta-pending-status.ui';
import {
  useBetaPendingStatusBusiness,
  type BetaPendingStatusBusinessLogic,
} from './use-beta-pending-status.business';

export interface BetaPendingStatusHookReturn extends BetaPendingStatusUIState {
  handleSignOut: () => Promise<void>;
}

/**
 * Combined Hook
 *
 * Integrates UI State and Business Logic
 * Supports Optional Injection for Mock/Test logic
 *
 * @param businessLogic - Optional business logic injection
 * @param onSignOut - Sign-out callback
 */
export function useBetaPendingStatus(
  businessLogic?: BetaPendingStatusBusinessLogic,
  onSignOut?: () => void
): BetaPendingStatusHookReturn {
  // UI State (Designer domain)
  const uiState = useBetaPendingStatusUI();

  // Business Logic (Engineer domain)
  const defaultBusiness = useBetaPendingStatusBusiness();
  const business = businessLogic ?? defaultBusiness;

  // Combined Logic: Sign out
  const handleSignOut = useCallback(async () => {
    uiState.setIsSigningOut(true);

    try {
      // Business: Sign out
      await business.onSignOut();
      onSignOut?.();
    } catch (error) {
      console.error('[BetaPendingStatus] Sign out failed:', error);
    } finally {
      // UI: Stop signing out
      uiState.setIsSigningOut(false);
    }
  }, [uiState, business, onSignOut]);

  return {
    ...uiState,
    handleSignOut,
  };
}
