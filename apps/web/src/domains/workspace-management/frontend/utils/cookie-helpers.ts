// apps/web/src/domains/workspace-management/frontend/utils/cookie-helpers.ts

import { getCookieValue, setCookieValue } from '@/utils/cookie-helpers';

/**
 * 워크스페이스 & 페이지 관련 쿠키 상수
 */
export const WORKSPACE_COOKIE_KEYS = {
  LAST_VISITED_PAGE: 'lastVisitedPage', // 최근 방문한 페이지 URL
  LAST_VISITED_WORKSPACE: 'lastVisitedWorkspace', // 최근 방문한 워크스페이스 ID
} as const;

const RECENT_PAGE_KEY_PREFIX = 'ssota-recent-page-';

/**
 * Legacy: /r/[orgId]/workspace/[workspaceId]/page/[pageId] (6 segments).
 * Current: /r/[orgId]/[pageId] (3 segments).
 */
function parseLastVisitedPageUrl(
  value: string | null
): { orgId: string | null; pageId: string } | null {
  if (!value || typeof value !== 'string') return null;
  const path = value.startsWith('http') ? new URL(value).pathname : value;
  const segments = path.split('/').filter(Boolean);
  if (segments.length < 2 || segments[0] !== 'r') return null;
  // Current: /r/orgId/pageId
  if (segments.length === 3) {
    return { orgId: segments[1]!, pageId: segments[2]! };
  }
  // Legacy: /r/orgId/workspace/workspaceId/page/pageId
  if (
    segments.length === 6 &&
    segments[2] === 'workspace' &&
    segments[4] === 'page'
  ) {
    return { orgId: segments[1]!, pageId: segments[5]! };
  }
  return null;
}

/**
 * Extracts pageId from LAST_VISITED_PAGE cookie.
 * Supports legacy /r/[orgId]/workspace/[workspaceId]/page/[pageId] and current /r/[orgId]/[pageId].
 * Use on server when falling back from ssota-recent-page-{orgId}.
 */
export function getPageIdFromLastVisitedPageCookie(
  value: string | null
): string | null {
  const parsed = parseLastVisitedPageUrl(value);
  return parsed?.pageId ?? null;
}

/**
 * 최근 방문한 페이지 정보를 쿠키에 저장
 * Story 003: 사용자 가입 후 Welcome 페이지로 리다이렉션 + 쿠키 저장
 * URL 구조: /r/[orgId]/[pageId]. 서버 /r 리다이렉트는 ssota-recent-page-{orgId} 쿠키를 사용.
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
  const pageUrl = `/r/${orgId}/${pageId}`;
  setCookieValue(WORKSPACE_COOKIE_KEYS.LAST_VISITED_PAGE, pageUrl, 86400 * 30); // 30일
  setCookieValue(
    `${RECENT_PAGE_KEY_PREFIX}${orgId}`,
    pageId,
    86400 * 30
  );
  setCookieValue(
    WORKSPACE_COOKIE_KEYS.LAST_VISITED_WORKSPACE,
    workspaceId,
    86400 * 30
  );
}

/**
 * 최근 방문한 페이지 URL 조회 (raw cookie value).
 * May be legacy /r/orgId/workspace/workspaceId/page/pageId or current /r/orgId/pageId.
 * Prefer getLastVisitedPageRedirectUrl(orgId) when redirecting.
 */
export function getLastVisitedPage(): string | null {
  return getCookieValue(WORKSPACE_COOKIE_KEYS.LAST_VISITED_PAGE);
}

/**
 * Returns a redirect-safe URL for the last visited page in the given org.
 * Handles legacy /r/orgId/workspace/workspaceId/page/pageId and current /r/orgId/pageId.
 * Always returns /r/[orgId]/[pageId] using the given orgId and pageId from cookie.
 *
 * @param orgId - Current organization ID (used for redirect target)
 * @returns URL /r/[orgId]/[pageId] or null if no valid cookie
 */
export function getLastVisitedPageRedirectUrl(orgId: string): string | null {
  const raw = getCookieValue(WORKSPACE_COOKIE_KEYS.LAST_VISITED_PAGE);
  const parsed = parseLastVisitedPageUrl(raw);
  if (!parsed) return null;
  return `/r/${orgId}/${parsed.pageId}`;
}

/**
 * 최근 방문한 워크스페이스 ID 조회
 * @returns 워크스페이스 ID 또는 null
 */
export function getLastVisitedWorkspace(): string | null {
  return getCookieValue(WORKSPACE_COOKIE_KEYS.LAST_VISITED_WORKSPACE);
}
