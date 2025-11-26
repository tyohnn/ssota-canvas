/**
 * Beta Pending Status Provider
 */

'use client';

import { BetaPendingStatusContext } from './context';
import { useBetaPendingStatus } from './use-beta-pending-status';
import type { BetaPendingStatusBusinessLogic } from './use-beta-pending-status.business';
import type { BetaPendingStatusProps } from './types';

interface BetaPendingStatusProviderProps extends BetaPendingStatusProps {
  children: React.ReactNode;
  businessLogic?: BetaPendingStatusBusinessLogic;
}

/**
 * Provider Component
 *
 * Shares state to sub-components via Context
 */
export function BetaPendingStatusProvider({
  children,
  businessLogic,
  onSignOut,
}: BetaPendingStatusProviderProps) {
  const statusState = useBetaPendingStatus(businessLogic, onSignOut);

  return (
    <BetaPendingStatusContext.Provider value={statusState}>
      {children}
    </BetaPendingStatusContext.Provider>
  );
}
