import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-management.actions';
import { OrgRedirectClient } from '../../org-redirect-client';

export const dynamic = 'force-dynamic';

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
 * 해당 워크스페이스의 첫 번째 페이지로 직접 리다이렉트
 */
export default async function WorkspaceIdPageRoute({
  params,
}: WorkspaceIdPageProps) {
  const { orgId, workspaceId } = await params;

  // Workspace-Page 데이터 로드
  const workspacePageResult = await getOrganizationWorkspacePageViewAction({
    organizationId: orgId,
  });

  if (!workspacePageResult.success) {
    // 실패 시 조직 루트로 fallback
    return <OrgRedirectClient redirectUrl={`/r/${orgId}`} />;
  }

  const { workspaces } = workspacePageResult.data;

  // 해당 워크스페이스 찾기
  const targetWorkspace = workspaces.find(w => w.workspaceId === workspaceId);

  if (!targetWorkspace) {
    // 워크스페이스를 찾지 못하면 조직 루트로
    return <OrgRedirectClient redirectUrl={`/r/${orgId}`} />;
  }

  // 쿠키에서 최근 페이지 확인 (해당 워크스페이스 내에서만)
  const cookieStore = await cookies();
  const recentPageKey = `ssota-recent-page-${orgId}`;
  const cookiePageId = cookieStore.get(recentPageKey)?.value;

  // 최근 페이지가 이 워크스페이스에 속하는지 확인
  if (cookiePageId) {
    const findPageInTree = (
      pages: (typeof targetWorkspace)['pageTree']
    ): boolean => {
      for (const page of pages) {
        if (page.id === cookiePageId) return true;
        if (page.children && page.children.length > 0) {
          if (findPageInTree(page.children)) return true;
        }
      }
      return false;
    };

    if (findPageInTree(targetWorkspace.pageTree)) {
      // 최근 페이지가 이 워크스페이스에 속하면 그곳으로 이동
      return (
        <OrgRedirectClient
          redirectUrl={`/r/${orgId}/workspace/${workspaceId}/page/${cookiePageId}`}
        />
      );
    }
  }

  // 첫 번째 페이지로 이동
  const firstPage = targetWorkspace.pageTree[0];

  if (!firstPage) {
    // 페이지가 없으면 조직 루트로
    return <OrgRedirectClient redirectUrl={`/r/${orgId}`} />;
  }

  // 첫 페이지로 리다이렉트
  return (
    <OrgRedirectClient
      redirectUrl={`/r/${orgId}/workspace/${workspaceId}/page/${firstPage.id}`}
    />
  );
}
