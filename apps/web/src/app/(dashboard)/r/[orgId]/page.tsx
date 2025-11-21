import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-management.actions';

interface OrgRootPageProps {
  params: Promise<{ orgId: string }>;
}

/**
 * 조직 루트 페이지 (서버 컴포넌트)
 *
 * 자동으로 적절한 페이지로 리다이렉트:
 * 1. 쿠키에 저장된 최근 페이지가 있으면 → /r/[orgId]/workspace/[wId]/page/[pId]
 * 2. 없으면 첫 번째 워크스페이스의 첫 번째 페이지로 → /r/[orgId]/workspace/[wId]/page/[pId]
 */
export default async function OrgRootPage({ params }: OrgRootPageProps) {
  const { orgId } = await params;

  // Workspace-Page 데이터 로드
  const workspacePageResult = await getOrganizationWorkspacePageViewAction({
    organizationId: orgId,
  });

  if (!workspacePageResult.success) {
    // 실패 시 에러 페이지로
    throw new Error('Failed to load workspace data');
  }

  const { workspaces } = workspacePageResult.data;

  // 워크스페이스가 없는 경우
  if (workspaces.length === 0) {
    redirect(`/r/${orgId}/workspace/new`);
  }

  // 쿠키에서 최근 페이지 확인
  const cookieStore = await cookies();
  const recentPageKey = `ssota-recent-page-${orgId}`;
  const cookiePageId = cookieStore.get(recentPageKey)?.value;

  // 1. 쿠키에 저장된 최근 페이지가 유효한 경우
  if (cookiePageId) {
    // 페이지가 속한 워크스페이스 찾기 (재귀 함수)
    const findPageInTree = (
      pages: (typeof workspaces)[0]['pageTree']
    ): boolean => {
      for (const page of pages) {
        if (page.id === cookiePageId) return true;
        if (page.children && page.children.length > 0) {
          if (findPageInTree(page.children)) return true;
        }
      }
      return false;
    };

    for (const workspace of workspaces) {
      if (findPageInTree(workspace.pageTree)) {
        redirect(
          `/r/${orgId}/workspace/${workspace.workspaceId}/page/${cookiePageId}`
        );
      }
    }
  }

  // 2. 첫 번째 워크스페이스의 첫 번째 페이지로
  const firstWorkspace = workspaces[0]!; // workspaces.length > 0 확인 완료
  const firstPage = firstWorkspace.pageTree[0];

  if (!firstPage) {
    // 페이지가 없는 경우 워크스페이스 루트로
    redirect(`/r/${orgId}/workspace/${firstWorkspace.workspaceId}`);
  }

  // 첫 페이지로 리다이렉트
  redirect(
    `/r/${orgId}/workspace/${firstWorkspace.workspaceId}/page/${firstPage.id}`
  );
}
