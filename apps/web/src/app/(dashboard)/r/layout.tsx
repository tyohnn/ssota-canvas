import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { DashboardProviders } from '../components/providers';
import { getUserOrganizationsAction } from '@/domains/organization-management/actions/organization-management.actions';
import { ORGANIZATION_COOKIE_KEYS } from '@/domains/organization-management/frontend/utils/cookie-helpers';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-navigation.actions';

interface DashboardRootLayoutProps {
  children: React.ReactNode;
}

/**
 * /r 레이아웃
 *
 * 조직 목록 + 쿠키 기반 org의 워크스페이스까지 fetch.
 * DashboardProviders로 전체 프로바이더 + 사이드바 렌더링.
 */
export default async function DashboardRootLayout({
  children,
}: DashboardRootLayoutProps) {
  const organizations = await getUserOrganizationsAction();

  if (organizations.length === 0) {
    redirect('/onboarding');
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
