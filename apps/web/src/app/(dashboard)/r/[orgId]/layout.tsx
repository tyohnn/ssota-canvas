import {
  SidebarInset,
  SidebarProvider,
} from '@workspace/ui/components/ui/sidebar';
import { DashboardSidebar } from '@/domains/organization-management/frontend/components/sidebar/dashboard-sidebar';
import { OrganizationProvider } from '@/domains/organization-management/frontend/contexts/organization-context';
import { WorkspaceProvider } from '@/domains/workspace-management/frontend/contexts/workspace-context';
import { getUserOrganizationsAction } from '@/domains/organization-management/actions/organization-management.actions';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-management.actions';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  let organizations: Awaited<ReturnType<typeof getUserOrganizationsAction>>;
  try {
    organizations = await getUserOrganizationsAction();
  } catch (error) {
    console.error('[/r/[orgId]/layout] Error fetching organizations:', error);

    // 인증 오류만 unauthorized 페이지로 리다이렉트
    if (error instanceof Error && error.message === 'Authentication required') {
      redirect('/unauthorized');
    }

    // 다른 에러는 다시 throw
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
