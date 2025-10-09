import {
  SidebarInset,
  SidebarProvider,
} from '@workspace/ui/components/ui/sidebar';
import { DashboardSidebar } from '@/domains/dashboard/components/layout';
import { OrganizationProvider } from '@/domains/organization-management/frontend/contexts/organization-context';
import { getUserOrganizationsAction } from '@/domains/organization-management/actions/organization-management.actions';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Story 004에서 구현된 액션을 사용하여 초기 데이터 제공
  const organizations = await getUserOrganizationsAction();

  return (
    <OrganizationProvider initialOrganizations={organizations}>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="overflow-hidden overscroll-none h-svh">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </OrganizationProvider>
  );
}
