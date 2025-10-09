import {
  SidebarInset,
  SidebarProvider,
} from '@workspace/ui/components/ui/sidebar';
import { OrganizationProvider } from '@/domains/dashboard/context/OrganizationCotext';
import { DashboardSidebar } from '@/domains/dashboard/components/layout';
import {
  getOrganizationBySlug,
  getUserOrganizations,
  getWorkspacesByOrganizationId,
} from '@/domains/dashboard/actions/organization.action';
import { redirect } from 'next/navigation';

/**
 * Wraps the provided children in an OrganizationProvider initialized from the organization identified by the given params.
 *
 * @param children - React nodes to render inside the layout
 * @param params - A promise resolving to an object containing `orgSlug`, used to load the organization context
 * @returns A React element rendering OrganizationProvider with the resolved organization, the user's organizations, and the organization's workspaces, containing `children`
 */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  let orgRes;
  let userOrgsRes;
  let orgWorkspacesRes;

  try {
    orgRes = await getOrganizationBySlug(orgSlug);
    const organization = orgRes.success ? orgRes.data : null;

    if (!organization) {
      redirect('/');
    }

    userOrgsRes = await getUserOrganizations();
    orgWorkspacesRes = await getWorkspacesByOrganizationId(organization?.id);
  } catch (error) {
    // 인증 오류만 unauthorized 페이지로 리다이렉트
    if (error instanceof Error && error.message.includes('Authentication')) {
      redirect('/unauthorized');
    }

    // 다른 에러는 다시 throw
    throw error;
  }

  const organization = orgRes.success ? orgRes.data : null;
  const userOrganizations = userOrgsRes.success ? userOrgsRes.data : [];
  const orgWorkspaces = orgWorkspacesRes.success ? orgWorkspacesRes.data : [];

  const initialOrg = organization
    ? {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      }
    : null;

  const initialWorkspace = null;

  return (
    <OrganizationProvider
      initialOrg={initialOrg}
      initialUserOrganizations={userOrganizations}
      initialWorkspace={initialWorkspace}
      initialOrgWorkspaces={orgWorkspaces}
    >
      {children}
    </OrganizationProvider>
  );
}