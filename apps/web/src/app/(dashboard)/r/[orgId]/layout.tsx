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

interface OrgIdLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}

/**
 * /r/[orgId] 레이아웃
 *
 * org 검증, workspace 목록 로드, 사이드바 렌더.
 */
export default async function OrgIdLayout({
  children,
  params,
}: OrgIdLayoutProps) {
  const { orgId } = await params;

  const organizations = await getUserOrganizationsAction();
  const selectedOrganization = organizations.find(org => org.id === orgId);

  if (!selectedOrganization) {
    console.error('[/r/[orgId]/layout] Organization access denied:', {
      requestedOrgId: orgId,
      availableOrgIds: organizations.map(o => o.id),
    });
    redirect('/unauthorized');
  }

  const workspacePageResult = await getOrganizationWorkspacePageViewAction({
    organizationId: orgId,
  });

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
