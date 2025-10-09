import {
  SidebarInset,
  SidebarProvider,
} from '@workspace/ui/components/ui/sidebar';
import { DashboardSidebar } from '@/domains/organization-management/frontend/components/sidebar/dashboard-sidebar';
import { OrganizationProvider } from '@/domains/organization-management/frontend/contexts/organization-context';
import { getUserOrganizationsAction } from '@/domains/organization-management/actions/organization-management.actions';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  // Story 004에서 구현된 액션을 사용하여 초기 데이터 제공
  let organizations;
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

  return (
    <OrganizationProvider
      initialOrganizations={organizations}
      initialSelectedId={selectedOrganization.id}
    >
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="overflow-hidden overscroll-none h-svh">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </OrganizationProvider>
  );
}
