/**
 * Beta Pending Page
 *
 * Beta application review status page
 * - Compound Component Pattern
 * - UI/Business logic separation
 * - State sharing via Context
 * - Requires authentication
 * - Requires application submission
 */

import { redirect } from 'next/navigation';
import { BetaPendingStatus } from '@/domains/user-management/frontend/components/beta-pending-status';
import { Box } from '@/components/ui/box';
import { checkBetaRedirectAction } from '@/domains/user-management/actions/beta.actions';
import { checkUserSetupStatusAction } from '@/domains/user-management/actions/user-management.actions';
import { getAuthenticatedUserOrRedirect } from '@/domains/common/auth/server-auth.helpers';

export default async function BetaPendingPage() {
  // Authentication check
  await getAuthenticatedUserOrRedirect(
    'Please login to view your application status'
  );

  // Beta status check - redirect if needed
  const betaRedirect = await checkBetaRedirectAction();

  if (betaRedirect && betaRedirect !== '/beta/pending') {
    // User should be on a different beta page
    redirect(betaRedirect);
  }

  // If approved (betaRedirect is null), check setup status
  if (betaRedirect === null) {
    // User is approved - check if onboarding is complete
    const setupStatusResult = await checkUserSetupStatusAction();

    if (setupStatusResult.success && setupStatusResult.data) {
      if (setupStatusResult.data.isSetupComplete) {
        // Onboarding complete → redirect to dashboard
        redirect('/r');
      } else {
        // Onboarding not complete → redirect to onboarding
        redirect('/onboarding');
      }
    } else {
      // Error checking setup status → redirect to onboarding to be safe
      redirect('/onboarding');
    }
  }

  return (
    <Box className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 p-4 pt-24">
      <BetaPendingStatus />
    </Box>
  );
}
