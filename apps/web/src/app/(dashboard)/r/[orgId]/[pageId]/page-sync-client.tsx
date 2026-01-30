'use client';

import { useEffect } from 'react';
import { useWorkspace } from '@/domains/workspace-management/frontend/hooks/use-workspace';
import { saveLastVisitedPage } from '@/domains/workspace-management/frontend/utils/cookie-helpers';

interface PageSyncClientProps {
  orgId: string;
  workspaceId: string;
  pageId: string;
}

/**
 * URL과 Context를 동기화하고 최근 방문 페이지를 쿠키에 저장하는 클라이언트 컴포넌트
 *
 * 1. URL의 pageId가 변경되면 Context의 selectPage를 호출하여
 *    사이드바 선택 상태와 PageViewer를 업데이트
 * 2. 페이지 방문 시 쿠키에 최근 방문 페이지 저장 (Story 003)
 */
export function PageSyncClient({
  orgId,
  workspaceId,
  pageId,
}: PageSyncClientProps) {
  const { selectPage, selectedPageId } = useWorkspace();

  useEffect(() => {
    if (selectedPageId !== pageId) {
      selectPage(pageId, workspaceId);
    }

    saveLastVisitedPage(orgId, workspaceId, pageId);
  }, [pageId, workspaceId, orgId, selectedPageId]);

  return null;
}
