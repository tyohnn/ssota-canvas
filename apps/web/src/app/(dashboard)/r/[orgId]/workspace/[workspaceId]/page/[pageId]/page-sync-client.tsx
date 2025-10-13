'use client';

import { useEffect } from 'react';
import { useWorkspace } from '@/domains/workspace-management/frontend/hooks/use-workspace';

interface PageSyncClientProps {
  workspaceId: string;
  pageId: string;
}

/**
 * URL과 Context를 동기화하는 클라이언트 컴포넌트
 *
 * URL의 pageId가 변경되면 Context의 selectPage를 호출하여
 * 사이드바 선택 상태와 PageViewer를 업데이트
 */
export function PageSyncClient({ workspaceId, pageId }: PageSyncClientProps) {
  const { selectPage, selectedPageId } = useWorkspace();

  useEffect(() => {
    // 이미 선택된 페이지가 아닐 때만 선택
    if (selectedPageId !== pageId) {
      // skipNavigation = true로 설정하여 router.push 방지 (무한 루프 방지)
      selectPage(pageId, workspaceId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, workspaceId, selectedPageId]);

  // UI를 렌더링하지 않음 (동기화만 담당)
  return null;
}
