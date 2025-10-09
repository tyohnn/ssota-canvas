// apps/web/src/domains/organization-management/frontend/utils/cookie-helpers.ts

/**
 * 쿠키 기반 영속성을 위한 유틸리티 함수들
 * Story 005: 조직 선택 상태를 쿠키로 저장하여 새로고침 시에도 유지
 */

export function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] || null : null;
}

export function setCookieValue(
  name: string,
  value: string,
  maxAge: number = 86400
): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
}

export function removeCookieValue(name: string): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; path=/; max-age=0`;
}

// 조직 선택 관련 쿠키 상수
export const ORGANIZATION_COOKIE_KEYS = {
  SELECTED_ORGANIZATION_ID: 'selectedOrganizationId',
} as const;
