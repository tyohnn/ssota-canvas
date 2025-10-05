import {
  SidebarInset,
  SidebarProvider,
} from '@workspace/ui/components/ui/sidebar';
import { DashboardSidebar } from '@/domains/user-management/frontend/components/dashboard-sidebar';
import { OrganizationProvider } from '@/domains/user-management/frontend/contexts/organization-context';
import { getUserOrganizationsAction } from '@/domains/user-management/actions/user-management.actions';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  // Story 004에서 구현된 액션을 사용하여 초기 데이터 제공
  const organizations = await getUserOrganizationsAction();
  const { orgSlug } = await params;

  // URL 파라미터로 전달된 orgSlug를 우선하여 선택
  const selectedOrgId =
    organizations.find(
      org =>
        // TODO: org.slug 필드가 필요하지만 현재는 name으로 임시 처리
        org.name.toLowerCase().replace(/\s+/g, '-') === orgSlug.toLowerCase()
    )?.id || null;

  return (
    <OrganizationProvider
      initialOrganizations={organizations}
      initialSelectedId={selectedOrgId}
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
