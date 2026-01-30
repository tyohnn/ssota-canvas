import { cookies } from 'next/headers';

import {
  getPageIdFromLastVisitedPageCookie,
  WORKSPACE_COOKIE_KEYS,
} from '@/domains/workspace-management/frontend/utils/cookie-helpers';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-navigation.actions';

import { RedirectClient } from '../redirect-client';

export const dynamic = 'force-dynamic';

interface OrgIdPageProps {
  params: Promise<{ orgId: string }>;
}

/**
 * /r/[orgId] 루트: 쿠키 또는 해당 org 첫 페이지로 redirect → /r/[orgId]/[pageId]
 */
export default async function OrgIdPage({ params }: OrgIdPageProps) {
  const { orgId } = await params;

  const cookieStore = await cookies();
  const recentPageKey = `ssota-recent-page-${orgId}`;
  const cookiePageId =
    cookieStore.get(recentPageKey)?.value ??
    getPageIdFromLastVisitedPageCookie(
      cookieStore.get(WORKSPACE_COOKIE_KEYS.LAST_VISITED_PAGE)?.value ?? null
    ) ??
    undefined;

  const workspacePageResult = await getOrganizationWorkspacePageViewAction({
    organizationId: orgId,
    cookiePageId,
  });

  if (!workspacePageResult.success) {
    return <RedirectClient redirectUrl="/r" />;
  }

  const { workspaces, selectedPageId } = workspacePageResult.data;

  if (workspaces.length === 0) {
    return <RedirectClient redirectUrl="/onboarding" />;
  }

  if (selectedPageId) {
    return <RedirectClient redirectUrl={`/r/${orgId}/${selectedPageId}`} />;
  }

  const firstWorkspace = workspaces[0]!;
  const firstPage = firstWorkspace.pageTree[0];
  if (firstPage) {
    return <RedirectClient redirectUrl={`/r/${orgId}/${firstPage.id}`} />;
  }

  return <RedirectClient redirectUrl="/onboarding" />;
}
