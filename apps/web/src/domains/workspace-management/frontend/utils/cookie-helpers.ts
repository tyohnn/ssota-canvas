// apps/web/src/domains/workspace-management/frontend/utils/cookie-helpers.ts

import { getCookieValue, setCookieValue } from '@/utils/cookie-helpers';

/**
 * 워크스페이스 & 페이지 관련 쿠키 상수
 */
export const WORKSPACE_COOKIE_KEYS = {
  LAST_VISITED_PAGE: 'lastVisitedPage', // 최근 방문한 페이지 URL
  LAST_VISITED_WORKSPACE: 'lastVisitedWorkspace', // 최근 방문한 워크스페이스 ID
} as const;

/**
 * 최근 방문한 페이지 정보를 쿠키에 저장
 * Story 003: 사용자 가입 후 Welcome 페이지로 리다이렉션 + 쿠키 저장
 *
 * @param orgId - 조직 ID
 * @param workspaceId - 워크스페이스 ID
 * @param pageId - 페이지 ID
 */
export function saveLastVisitedPage(
  orgId: string,
  workspaceId: string,
  pageId: string
): void {
  const pageUrl = `/r/${orgId}/workspace/${workspaceId}/page/${pageId}`;
  setCookieValue(WORKSPACE_COOKIE_KEYS.LAST_VISITED_PAGE, pageUrl, 86400 * 30); // 30일
  setCookieValue(
    WORKSPACE_COOKIE_KEYS.LAST_VISITED_WORKSPACE,
    workspaceId,
    86400 * 30
  );
}

/**
 * 최근 방문한 페이지 URL 조회
 * @returns 페이지 URL 또는 null
 */
export function getLastVisitedPage(): string | null {
  return getCookieValue(WORKSPACE_COOKIE_KEYS.LAST_VISITED_PAGE);
}

/**
 * 최근 방문한 워크스페이스 ID 조회
 * @returns 워크스페이스 ID 또는 null
 */
export function getLastVisitedWorkspace(): string | null {
  return getCookieValue(WORKSPACE_COOKIE_KEYS.LAST_VISITED_WORKSPACE);
}
