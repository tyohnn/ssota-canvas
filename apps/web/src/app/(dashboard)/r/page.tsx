/**
 * /r Root Page
 *
 * Redirects to the user's default organization
 * or shows error if user has no organizations
 *
 * This page handles:
 * 1. Authenticated users with approved beta access → redirect to their org
 * 2. Authenticated users without beta approval → redirect to beta pages
 * 3. Users with no organizations → redirect to onboarding
 * 4. Unauthenticated users → redirect to login
 */

import { getUserOrganizationsAction } from '@/domains/organization-management/actions/organization-management.actions';
import { BetaRedirectClient } from './beta-redirect-client';
import { OrgRedirectClient } from './[orgId]/org-redirect-client';

export const dynamic = 'force-dynamic';

export default async function DashboardRootPage() {
  try {
    // Get user's organizations
    // This will throw BETA_ACCESS_REQUIRED if user is not approved
    const organizations = await getUserOrganizationsAction();

    if (organizations.length === 0) {
      // No organizations - user is approved but hasn't completed onboarding
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
      if (error.message === 'BETA_ACCESS_REQUIRED') {
        // Beta not approved - use client redirect
        return (
          <BetaRedirectClient
            redirectUrl="/beta/application"
            message="Beta access required"
          />
        );
      }

      if (
        error.message === 'UNAUTHORIZED: User not authenticated' ||
        error.message === 'USER_PROFILE_NOT_FOUND'
      ) {
        // Not authenticated - use client redirect
        return (
          <BetaRedirectClient redirectUrl="/login" message="Please login" />
        );
      }
    }

    // Unknown error - use client redirect
    return <BetaRedirectClient redirectUrl="/login" message="Redirecting..." />;
  }
}
