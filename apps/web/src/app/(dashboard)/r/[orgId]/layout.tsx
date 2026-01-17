import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  SidebarInset,
  SidebarProvider,
} from '@workspace/ui/components/ui/sidebar';

import { getUserOrganizationsAction } from '@/domains/organization-management/actions/organization-management.actions';
import { DashboardSidebar } from '@/domains/organization-management/frontend/components/sidebar/dashboard-sidebar';
import { OrganizationProvider } from '@/domains/organization-management/frontend/contexts/organization-context';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-navigation.actions';
import { WorkspaceProvider } from '@/domains/workspace-management/frontend/contexts/workspace';

// import { BetaRedirectClient } from '../beta-redirect-client';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  // getUserOrganizationsAction은 인증 및 베타 체크를 수행
  // - 미인증: redirect to /login
  // - 베타 미승인: BETA_ACCESS_REQUIRED 에러 발생 → 여기서 처리 (beta check removed)
  let organizations;
  try {
    organizations = await getUserOrganizationsAction();
  } catch (error) {
    /* Original implementation (commented out):
    if (error instanceof Error && error.message === 'BETA_ACCESS_REQUIRED') {
      // Use client redirect to avoid hydration issues
      return (
        <BetaRedirectClient
          redirectUrl="/beta/application"
          message="Beta access required"
        />
      );
    }
    */
    // Re-throw error to be handled by Next.js error boundary
    throw error;
  }

  // URL 파라미터로 전달된 orgId로 조직 찾기
  const selectedOrganization = organizations.find(org => org.id === orgId);

  // 권한 검증: 조직을 찾지 못하면 unauthorized
  if (!selectedOrganization) {
    console.error('[/r/[orgId]/layout] Organization access denied:', {
      requestedOrgId: orgId,
      availableOrgIds: organizations.map(o => o.id),
    });
    redirect('/unauthorized');
  }

  // Workspace-Page 데이터 로드 (리스트만, cookiePageId 제외)
  const workspacePageResult = await getOrganizationWorkspacePageViewAction({
    organizationId: orgId,
  });

  // Workspace 데이터 로드 실패 시 빈 배열로 Fallback
  const workspacePageData = workspacePageResult.success
    ? workspacePageResult.data
    : {
        organizationId: orgId,
        workspaces: [],
        selectedPageId: null,
      };

  return (
    <OrganizationProvider
      initialOrganizations={organizations}
      initialSelectedId={selectedOrganization.id}
    >
      <WorkspaceProvider
        initialWorkspaces={workspacePageData.workspaces}
        initialSelectedPageId={null}
        organizationId={orgId}
      >
        <SidebarProvider>
          <DashboardSidebar />
          <SidebarInset className="overflow-hidden overscroll-none h-svh">
            {children}
          </SidebarInset>
        </SidebarProvider>
      </WorkspaceProvider>
    </OrganizationProvider>
  );
}
