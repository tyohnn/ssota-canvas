/**
 * /r Root Page
 *
 * Redirects to /r/[orgId]/[pageId]:
 * - Default org + cookie (ssota-recent-page-{orgId}) or first page
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getUserOrganizationsAction } from '@/domains/organization-management/actions/organization-management.actions';
import {
  getPageIdFromLastVisitedPageCookie,
  WORKSPACE_COOKIE_KEYS,
} from '@/domains/workspace-management/frontend/utils/cookie-helpers';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-navigation.actions';

import { RedirectClient } from './redirect-client';

export const dynamic = 'force-dynamic';

export default async function DashboardRootPage() {
  try {
    const organizations = await getUserOrganizationsAction();

    if (organizations.length === 0) {
      return <RedirectClient redirectUrl="/onboarding" />;
    }

    const targetOrg =
      organizations.find(org => org.isDefault) ?? organizations[0];
    if (!targetOrg) {
      return <RedirectClient redirectUrl="/onboarding" />;
    }

    const cookieStore = await cookies();
    const recentPageKey = `ssota-recent-page-${targetOrg.id}`;
    const cookiePageId =
      cookieStore.get(recentPageKey)?.value ??
      getPageIdFromLastVisitedPageCookie(
        cookieStore.get(WORKSPACE_COOKIE_KEYS.LAST_VISITED_PAGE)?.value ??
          null
      ) ??
      undefined;

    const workspacePageResult = await getOrganizationWorkspacePageViewAction({
      organizationId: targetOrg.id,
      cookiePageId,
    });

    if (!workspacePageResult.success) {
      return <RedirectClient redirectUrl="/onboarding" />;
    }

    const { workspaces, selectedPageId } = workspacePageResult.data;

    if (workspaces.length === 0) {
      return <RedirectClient redirectUrl="/onboarding" />;
    }

    const pageId = selectedPageId ?? workspaces[0]!.pageTree[0]?.id;
    if (pageId) {
      return (
        <RedirectClient redirectUrl={`/r/${targetOrg.id}/${pageId}`} />
      );
    }

    return <RedirectClient redirectUrl="/onboarding" />;
  } catch (error) {
    console.error('[/r] Dashboard access error:', error);

    if (
      error instanceof Error &&
      (error.message === 'UNAUTHORIZED: User not authenticated' ||
        error.message === 'USER_PROFILE_NOT_FOUND')
    ) {
      redirect('/login');
    }

    redirect('/login');
  }
}
