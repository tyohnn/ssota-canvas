import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-management.actions';

interface WorkspaceIdPageProps {
  params: Promise<{ orgId: string; workspaceId: string }>;
}

/**
 * Generate dynamic metadata for workspace page
 */
export async function generateMetadata({
  params,
}: WorkspaceIdPageProps): Promise<Metadata> {
  const { orgId, workspaceId } = await params;

  // Fetch workspace data to get the name
  const workspacePageResult = await getOrganizationWorkspacePageViewAction({
    organizationId: orgId,
  });

  if (!workspacePageResult.success) {
    return {
      title: 'Workspace',
      description: 'View and manage your workspace.',
    };
  }

  const workspace = workspacePageResult.data.workspaces.find(
    w => w.workspaceId === workspaceId
  );
  const workspaceName = workspace?.workspaceName || 'Workspace';
  const organizationName = workspace?.organizationName || 'Organization';

  return {
    title: `${workspaceName} | SSOTA`,
    description: `Access and collaborate on ${workspaceName} workspace. Manage pages, canvases, and blocks with your team.`,
    openGraph: {
      title: `${workspaceName} | SSOTA`,
      description: `Access and collaborate on ${workspaceName} workspace. Manage pages, canvases, and blocks with your team.`,
    },
  };
}

/**
 * 워크스페이스 ID 페이지
 *
 * 조직 루트로 리다이렉트하여 적절한 페이지로 이동
 */
export default async function WorkspaceIdPageRoute({
  params,
}: WorkspaceIdPageProps) {
  const { orgId } = await params;
  redirect(`/r/${orgId}`);
}
