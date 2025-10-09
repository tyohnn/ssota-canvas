import {
  SidebarInset,
  SidebarProvider,
} from '@workspace/ui/components/ui/sidebar';
import { DashboardSidebar } from '@/domains/dashboard/components/layout';
import { OrganizationProvider } from '@/domains/organization-management/frontend/contexts/organization-context';
import { getUserOrganizationsAction } from '@/domains/organization-management/actions/organization-management.actions';

/**
 * Layout component that fetches the current user's organizations and renders the dashboard chrome.
 *
 * Fetches user organizations and provides them to OrganizationProvider, then renders the sidebar and
 * places `children` into the inset content area.
 *
 * @param children - The page content to render inside the dashboard inset
 * @returns The layout element containing OrganizationProvider, SidebarProvider, DashboardSidebar, and the inset with `children`
 */
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