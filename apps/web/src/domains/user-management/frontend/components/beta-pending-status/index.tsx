/**
 * Beta Pending Status
 *
 * Beta application review status component
 *
 * This component follows the Compound Component Pattern:
 * - Provider shares state via Context
 * - Sub-components automatically access state from Context
 * - Structure compatible with no-code tools (Framer, etc.)
 *
 * @example
 * ```tsx
 * // Production environment
 * <BetaPendingStatus
 *   onSignOut={() => console.log('Signed out')}
 * />
 *
 * // Test environment (Mock business logic)
 * const mockBusiness = useMockBetaPendingStatusBusiness();
 * <BetaPendingStatus businessLogic={mockBusiness} />
 * ```
 */

'use client';

import { Card, CardContent } from '@workspace/ui/components/ui/card';
import { BetaPendingStatusProvider } from './core/provider';
import { StatusHeader } from './components/status-header';
import { Timeline } from './components/timeline';
import { InfoBox } from './components/info-box';
import { AdditionalInfo } from './components/additional-info';
import { StatusFooter } from './components/status-footer';
import type { BetaPendingStatusProps } from './core/types';

/**
 * Beta Pending Status
 *
 * Main component: Provider + Internal composition
 */
export function BetaPendingStatus({ onSignOut }: BetaPendingStatusProps = {}) {
  return (
    <BetaPendingStatusProvider onSignOut={onSignOut}>
      <Card className="w-full max-w-md">
        <StatusHeader />

        <CardContent className="space-y-6">
          <Timeline />
          <InfoBox />
          <AdditionalInfo />
        </CardContent>

        <StatusFooter />
      </Card>
    </BetaPendingStatusProvider>
  );
}

// Export sub-components (for individual use in no-code tools)
export { StatusHeader } from './components/status-header';
export { Timeline } from './components/timeline';
export { InfoBox } from './components/info-box';
export { AdditionalInfo } from './components/additional-info';
export { SignOutButton } from './components/sign-out-button';
export { StatusFooter } from './components/status-footer';
export { BetaPendingStatusProvider } from './core/provider';
export { useBetaPendingStatusContext } from './core/context';

// Export hooks (for testing and customization)
export { useBetaPendingStatus } from './core/use-beta-pending-status';
export { useBetaPendingStatusUI } from './core/use-beta-pending-status.ui';
export {
  useBetaPendingStatusBusiness,
  useMockBetaPendingStatusBusiness,
} from './core/use-beta-pending-status.business';

// Export types
export type { BetaPendingStatusProps } from './core/types';
