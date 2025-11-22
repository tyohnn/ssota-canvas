import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserOrganizationsAction } from '@/domains/organization-management/actions/organization-management.actions';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-management.actions';
import { RedirectClient } from './redirect-client';

export const dynamic = 'force-dynamic';

/**
 * 대시보드 루트 페이지
 *
 * 유저를 최종 페이지로 직접 리다이렉트 (클라이언트 사이드 위임)
 * 1. 쿠키에 저장된 최근 페이지로 이동
 * 2. 없으면 첫 번째 워크스페이스의 첫 번째 페이지로 이동
 */
export default async function DashboardRootPage() {
  let organizations;

  try {
    // 유저의 organizations 가져오기
    organizations = await getUserOrganizationsAction();
  } catch (error) {
    console.error('[DashboardRootPage] Error:', error);

    // 인증 오류만 로그인 페이지로 리다이렉트
    if (error instanceof Error && error.message === 'Authentication required') {
      redirect('/login');
    }

    // 다른 에러는 다시 throw
    throw error;
  }

  // Organization이 없으면 onboarding으로
  if (!organizations || organizations.length === 0) {
    redirect('/onboarding');
  }

  // 첫 번째 organization 선택
  const firstOrg = organizations[0];
  if (!firstOrg) {
    redirect('/onboarding');
  }

  // Workspace-Page 데이터 로드
  const workspacePageResult = await getOrganizationWorkspacePageViewAction({
    organizationId: firstOrg.id,
  });

  if (!workspacePageResult.success) {
    // 실패 시 orgId로 리다이렉트
    return <RedirectClient redirectUrl={`/r/${firstOrg.id}`} />;
  }

  const { workspaces } = workspacePageResult.data;

  // 워크스페이스가 없는 경우
  if (workspaces.length === 0) {
    return <RedirectClient redirectUrl={`/r/${firstOrg.id}/workspace/new`} />;
  }

  // 쿠키에서 최근 페이지 확인
  const cookieStore = await cookies();
  const recentPageKey = `ssota-recent-page-${firstOrg.id}`;
  const cookiePageId = cookieStore.get(recentPageKey)?.value;

  // 1. 쿠키에 저장된 최근 페이지가 유효한 경우
  if (cookiePageId) {
    // 페이지가 속한 워크스페이스 찾기 (재귀 함수)
    const findPageInTree = (
      pages: (typeof workspaces)[0]['pageTree']
    ): { found: boolean; workspaceId?: string } => {
      for (const page of pages) {
        if (page.id === cookiePageId) return { found: true };
        if (page.children && page.children.length > 0) {
          const result = findPageInTree(page.children);
          if (result.found) return result;
        }
      }
      return { found: false };
    };

    for (const workspace of workspaces) {
      const result = findPageInTree(workspace.pageTree);
      if (result.found) {
        return (
          <RedirectClient
            redirectUrl={`/r/${firstOrg.id}/workspace/${workspace.workspaceId}/page/${cookiePageId}`}
          />
        );
      }
    }
  }

  // 2. 첫 번째 워크스페이스의 첫 번째 페이지로
  const firstWorkspace = workspaces[0]!;
  const firstPage = firstWorkspace.pageTree[0];

  if (!firstPage) {
    // 페이지가 없는 경우 워크스페이스 루트로
    return (
      <RedirectClient
        redirectUrl={`/r/${firstOrg.id}/workspace/${firstWorkspace.workspaceId}`}
      />
    );
  }

  // 첫 페이지로 리다이렉트
  return (
    <RedirectClient
      redirectUrl={`/r/${firstOrg.id}/workspace/${firstWorkspace.workspaceId}/page/${firstPage.id}`}
    />
  );
}
