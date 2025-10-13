import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-management.actions';

interface OrgPageProps {
  params: Promise<{ orgId: string }>;
}

/**
 * 조직 루트 페이지
 *
 * 자동으로 적절한 페이지로 리다이렉트:
 * 1. 쿠키에 저장된 최근 페이지가 있으면 → /r/[orgId]/workspace/[wId]/page/[pId]
 * 2. 없으면 첫 번째 워크스페이스의 첫 번째 페이지로 → /r/[orgId]/workspace/[wId]/page/[pId]
 */
export default async function OrgRootPage({ params }: OrgPageProps) {
  const { orgId } = await params;
  const cookieStore = await cookies();

  // 쿠키에서 최근 페이지 확인
  const recentPageKey = `ssota-recent-page-${orgId}`;
  const cookiePageId = cookieStore.get(recentPageKey)?.value;

  // 워크스페이스 및 페이지 데이터 가져오기
  const result = await getOrganizationWorkspacePageViewAction({
    organizationId: orgId,
    cookiePageId,
  });

  if (!result.success || !result.data) {
    // 에러 처리: unauthorized 페이지로
    redirect('/unauthorized');
  }

  const { workspaces, selectedPageId } = result.data;

  // 워크스페이스가 없는 경우
  if (workspaces.length === 0) {
    redirect(`/r/${orgId}/workspace/new`);
  }

  // 1. 쿠키에 저장된 최근 페이지가 유효한 경우
  if (selectedPageId) {
    // 페이지가 속한 워크스페이스 찾기
    for (const workspace of workspaces) {
      const findPageInTree = (pages: typeof workspace.pageTree): boolean => {
        for (const page of pages) {
          if (page.id === selectedPageId) return true;
          if (page.children && page.children.length > 0) {
            if (findPageInTree(page.children)) return true;
          }
        }
        return false;
      };

      if (findPageInTree(workspace.pageTree)) {
        redirect(
          `/r/${orgId}/workspace/${workspace.workspaceId}/page/${selectedPageId}`
        );
      }
    }
  }

  // 2. 첫 번째 워크스페이스의 첫 번째 페이지로
  const firstWorkspace = workspaces[0];

  if (!firstWorkspace) {
    redirect(`/r/${orgId}/workspace/new`);
  }

  const firstPage = firstWorkspace.pageTree[0];

  if (!firstPage) {
    // 페이지가 없는 경우
    redirect(`/r/${orgId}/workspace/${firstWorkspace.workspaceId}`);
  }

  // 첫 페이지로 리다이렉트
  redirect(
    `/r/${orgId}/workspace/${firstWorkspace.workspaceId}/page/${firstPage.id}`
  );
}
