// apps/web/src/domains/organization-management/frontend/utils/cookie-helpers.ts

/**
 * 조직 관련 쿠키 헬퍼
 * Story 005: 조직 선택 상태를 쿠키로 저장하여 새로고침 시에도 유지
 */

/**
 * 조직 선택 관련 쿠키 상수
 */
export const ORGANIZATION_COOKIE_KEYS = {
  SELECTED_ORGANIZATION_ID: 'selectedOrganizationId',
} as const;
