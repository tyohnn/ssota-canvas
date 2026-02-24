import { redirect } from 'next/navigation';

import { getUserOrganizationsAction } from '@/domains/organization-management/actions/organization-management.actions';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-navigation.actions';

import { OrgIdSyncClient } from '../../components/sync-client/org-id-sync-client';
import { WorkspaceSyncClient } from '../../components/sync-client/workspace-sync-client';

interface OrgIdLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}

/**
 * /r/[orgId] 레이아웃
 *
 * Provider는 /r/layout에서 제공. URL의 orgId로 데이터 fetch 후 SyncClient로 context 동기화.
 */
export default async function OrgIdLayout({
  children,
  params,
}: OrgIdLayoutProps) {
  const { orgId } = await params;

  const organizations = await getUserOrganizationsAction();
  const selectedOrganization = organizations.find(org => org.id === orgId);

  if (!selectedOrganization) {
    redirect('/unauthorized');
  }

  const workspacePageResult = await getOrganizationWorkspacePageViewAction({
    organizationId: orgId,
  });

  const workspaces = workspacePageResult.success
    ? workspacePageResult.data?.workspaces ?? []
    : [];

  return (
    <>
      <OrgIdSyncClient orgId={orgId} />
      <WorkspaceSyncClient orgId={orgId} workspaces={workspaces} />
      {children}
    </>
  );
}
