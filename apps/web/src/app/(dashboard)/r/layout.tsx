import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  getAuthenticatedUser,
  verifyAccessByPageId,
} from '@/domains/common/auth/helpers';
import { DashboardProviders } from '../components/providers';
import { getUserOrganizationsAction } from '@/domains/organization-management/actions/organization-management.actions';
import { ORGANIZATION_COOKIE_KEYS } from '@/domains/organization-management/frontend/utils/cookie-helpers';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-navigation.actions';

interface DashboardRootLayoutProps {
  children: React.ReactNode;
}

/** /r/orgId 또는 /r/orgId/pageId 경로에서 orgId, pageId 추출. Drive 경로(/r/orgId/drive/...)는 pageId 미반환 */
function parseRouteParams(pathname: string): { orgId?: string; pageId?: string } {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'r' || segments.length < 2) return {};
  const orgId = segments[1];
  const secondSegment = segments[2];
  // Drive 경로(/r/orgId/drive, /r/orgId/drive/blockId 등)는 pageId가 아님
  const pageId = secondSegment && secondSegment !== 'drive' ? secondSegment : undefined;
  return { orgId, pageId };
}

/**
 * /r 레이아웃
 *
 * 권한 검사 후 DashboardProviders 렌더.
 * - /r/orgId, /r/orgId/pageId 경로: 서버에서 먼저 검증 후 리다이렉트 (클라이언트 에러 방지)
 */
export default async function DashboardRootLayout({
  children,
}: DashboardRootLayoutProps) {
  const organizations = await getUserOrganizationsAction();

  if (organizations.length === 0) {
    redirect('/onboarding');
  }

  const pathname = (await headers()).get('x-pathname') ?? '';
  const { orgId, pageId } = parseRouteParams(pathname);

  if (orgId) {
    const hasOrgAccess = organizations.some(org => org.id === orgId);
    if (!hasOrgAccess) {
      redirect('/unauthorized');
    }

    if (pageId) {
      const user = await getAuthenticatedUser();
      const accessResult = await verifyAccessByPageId(pageId, user.id);
      if (!accessResult.success) {
        redirect('/unauthorized');
      }
      const pageOrgId = accessResult.workspace!.organizationId.value;
      if (pageOrgId !== orgId) {
        redirect('/unauthorized');
      }
    }
  }

  const cookieStore = await cookies();
  const savedOrgId = cookieStore.get(
    ORGANIZATION_COOKIE_KEYS.SELECTED_ORGANIZATION_ID
  )?.value;

  const initialSelectedOrg =
    organizations.find(o => o.id === savedOrgId) ??
    organizations.find(o => o.isDefault) ??
    organizations[0];

  const workspacePageResult = initialSelectedOrg
    ? await getOrganizationWorkspacePageViewAction({
        organizationId: initialSelectedOrg.id,
      })
    : { success: false, data: null };

  const initialWorkspaces = workspacePageResult.success
    ? workspacePageResult.data?.workspaces ?? []
    : [];

  return (
    <DashboardProviders
      organizations={organizations}
      initialSelectedOrgId={initialSelectedOrg?.id ?? null}
      initialWorkspaces={initialWorkspaces}
    >
      {children}
    </DashboardProviders>
  );
}
