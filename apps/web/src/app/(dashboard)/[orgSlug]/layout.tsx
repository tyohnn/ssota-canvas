import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/ui/sidebar";
import { OrganizationProvider } from "@/domains/dashboard/context/OrganizationCotext";
import { DashboardSidebar } from "@/domains/dashboard/components/layout";
import {
  getOrganizationBySlug,
  getUserOrganizations,
  getWorkspacesByOrganizationId,
} from "@/domains/dashboard/actions/organization.action";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const orgRes = await getOrganizationBySlug(orgSlug);
  const organization = orgRes.success ? orgRes.data : null;

  if (!organization) {
    redirect("/");
  }

  const userOrgsRes = await getUserOrganizations();
  const userOrganizations = userOrgsRes.success ? userOrgsRes.data : [];

  const orgWorkspacesRes = await getWorkspacesByOrganizationId(
    organization?.id
  );
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
