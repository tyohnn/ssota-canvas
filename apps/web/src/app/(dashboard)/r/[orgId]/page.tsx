'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWorkspaceContext } from '@/domains/workspace-management/frontend/contexts/workspace-context';

/**
 * 조직 루트 페이지
 *
 * Client Component로 구현하여 Hook 불일치 문제 해결
 * 자동으로 적절한 페이지로 리다이렉트:
 * 1. 쿠키에 저장된 최근 페이지가 있으면 → /r/[orgId]/workspace/[wId]/page/[pId]
 * 2. 없으면 첫 번째 워크스페이스의 첫 번째 페이지로 → /r/[orgId]/workspace/[wId]/page/[pId]
 */
export default function OrgRootPage() {
  const router = useRouter();
  const params = useParams();
  const { workspaces } = useWorkspaceContext();
  const orgId = params.orgId as string;

  useEffect(() => {
    if (!orgId) return;

    // 워크스페이스가 없는 경우
    if (workspaces.length === 0) {
      router.push(`/r/${orgId}/workspace/new`);
      return;
    }

    // 쿠키에서 최근 페이지 확인
    const recentPageKey = `ssota-recent-page-${orgId}`;
    const cookiePageId = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${recentPageKey}=`))
      ?.split('=')[1];

    // 1. 쿠키에 저장된 최근 페이지가 유효한 경우
    if (cookiePageId) {
      // 페이지가 속한 워크스페이스 찾기
      for (const workspace of workspaces) {
        const findPageInTree = (pages: typeof workspace.pageTree): boolean => {
          for (const page of pages) {
            if (page.id === cookiePageId) return true;
            if (page.children && page.children.length > 0) {
              if (findPageInTree(page.children)) return true;
            }
          }
          return false;
        };

        if (findPageInTree(workspace.pageTree)) {
          router.push(
            `/r/${orgId}/workspace/${workspace.workspaceId}/page/${cookiePageId}`
          );
          return;
        }
      }
    }

    // 2. 첫 번째 워크스페이스의 첫 번째 페이지로
    const firstWorkspace = workspaces[0]!; // workspaces.length > 0 확인 완료
    const firstPage = firstWorkspace.pageTree[0];

    if (!firstPage) {
      // 페이지가 없는 경우 워크스페이스 루트로
      router.push(`/r/${orgId}/workspace/${firstWorkspace.workspaceId}`);
      return;
    }

    // 첫 페이지로 리다이렉트
    router.push(
      `/r/${orgId}/workspace/${firstWorkspace.workspaceId}/page/${firstPage.id}`
    );
  }, [orgId, router, workspaces]);

  // 리다이렉트 중...
  return null;
}
