/**
 * /r Root Page
 *
 * Redirects to the user's default organization
 * or shows error if user has no organizations
 *
 * This page handles:
 * 1. Authenticated users → redirect to their org
 * 2. Users with no organizations → redirect to onboarding
 * 3. Unauthenticated users → redirect to login
 */
import { redirect } from 'next/navigation';

import { getUserOrganizationsAction } from '@/domains/organization-management/actions/organization-management.actions';

import { OrgRedirectClient } from './[orgId]/org-redirect-client';

// import { BetaRedirectClient } from './beta-redirect-client';

export const dynamic = 'force-dynamic';

export default async function DashboardRootPage() {
  try {
    // Get user's organizations
    // This will throw BETA_ACCESS_REQUIRED if user is not approved (beta check removed)
    const organizations = await getUserOrganizationsAction();

    if (organizations.length === 0) {
      // No organizations - user hasn't completed onboarding
      return <OrgRedirectClient redirectUrl="/onboarding" />;
    }

    // Find default organization or use first
    const defaultOrg = organizations.find(org => org.isDefault);
    const targetOrg = defaultOrg || organizations[0];

    if (!targetOrg) {
      return <OrgRedirectClient redirectUrl="/onboarding" />;
    }

    // Redirect to organization page
    return <OrgRedirectClient redirectUrl={`/r/${targetOrg.id}`} />;
  } catch (error) {
    // Handle authentication and beta access errors
    console.error('[/r] Dashboard access error:', error);

    if (error instanceof Error) {
      /* Original implementation (commented out):
      if (error.message === 'BETA_ACCESS_REQUIRED') {
        // Beta not approved - use client redirect
        return (
          <BetaRedirectClient
            redirectUrl="/beta/application"
            message="Beta access required"
          />
        );
      }
      */

      if (
        error.message === 'UNAUTHORIZED: User not authenticated' ||
        error.message === 'USER_PROFILE_NOT_FOUND'
      ) {
        // Not authenticated - redirect to login
        /* Original implementation (commented out):
        return (
          <BetaRedirectClient redirectUrl="/login" message="Please login" />
        );
        */
        redirect('/login');
      }
    }

    // Unknown error - redirect to login
    /* Original implementation (commented out):
    return <BetaRedirectClient redirectUrl="/login" message="Redirecting..." />;
    */
    redirect('/login');
  }
}
