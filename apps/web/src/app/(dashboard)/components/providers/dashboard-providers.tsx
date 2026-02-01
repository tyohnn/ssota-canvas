'use client';

import { Suspense } from 'react';
import {
  SidebarInset,
  SidebarProvider,
} from '@workspace/ui/components/ui/sidebar';

import { SidebarSkeleton } from '@/app/(dashboard)/components/skeletons';
import { UIPreferencesProvider } from '@/contexts/ui-preferences-context';
import { DashboardSidebar } from '@/domains/organization-management/frontend/components/sidebar/dashboard-sidebar';
import { MemberManagementProvider } from '@/domains/organization-management/frontend/contexts/member-management-context';
import { OrganizationProvider } from '@/domains/organization-management/frontend/contexts/organization-context';
import { NotificationProvider } from '@/domains/notification-management/frontend/contexts/notification-context';
import { WorkspaceProvider } from '@/domains/workspace-management/frontend/contexts/workspace';
import type { OrganizationSummary } from '@/domains/organization-management/shared/dtos';
import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';

interface DashboardProvidersProps {
  children: React.ReactNode;
  organizations: OrganizationSummary[];
  initialSelectedOrgId: string | null;
  initialWorkspaces: WorkspaceWithPagesDTO[];
}

/**
 * 대시보드 전체 Provider
 *
 * - UIPreferencesProvider, NotificationProvider, MemberManagementProvider
 * - OrganizationProvider, WorkspaceProvider
 * - SidebarProvider + DashboardSidebar
 */
export function DashboardProviders({
  children,
  organizations,
  initialSelectedOrgId,
  initialWorkspaces,
}: DashboardProvidersProps) {
  return (
    <UIPreferencesProvider>
      <NotificationProvider>
        <MemberManagementProvider>
          <OrganizationProvider
            initialOrganizations={organizations}
            initialSelectedId={initialSelectedOrgId}
          >
            <WorkspaceProvider
              initialWorkspaces={initialWorkspaces}
              initialSelectedPageId={null}
              organizationId={initialSelectedOrgId ?? ''}
            >
              <SidebarProvider>
                <Suspense fallback={<SidebarSkeleton />}>
                  <DashboardSidebar />
                </Suspense>
                <SidebarInset className="flex min-w-0 flex-1 flex-col overflow-hidden overscroll-none h-svh w-full m-0 p-0">
                  {children}
                </SidebarInset>
              </SidebarProvider>
            </WorkspaceProvider>
          </OrganizationProvider>
        </MemberManagementProvider>
      </NotificationProvider>
    </UIPreferencesProvider>
  );
}
