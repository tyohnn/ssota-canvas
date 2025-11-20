// apps/web/src/domains/organization-management/shared/types/index.ts

import { memberRoleEnum } from '@/db/schema';

// Organization Types (정적 정의)
export type OrganizationType =
  | 'personal'
  | 'education'
  | 'startup'
  | 'agency'
  | 'company'
  | 'n/a';

// Organization Type Labels (한국어)
export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  personal: '개인',
  education: '교육',
  startup: '스타트업',
  agency: '에이전시',
  company: '컴퍼니',
  'n/a': 'N/A',
} as const;

/**
 * Member Role Type
 *
 * DB schema의 memberRoleEnum에서 추출한 타입
 * - 'owner': 조직 소유자
 * - 'admin': 관리자
 * - 'member': 일반 멤버
 */
export type MemberRole = (typeof memberRoleEnum.enumValues)[number];

/**
 * Member Role with null (옵셔널 역할)
 *
 * 권한 확인 시 멤버가 아닌 경우 null을 반환할 때 사용
 */
export type MemberRoleOrNull = MemberRole | null;

// Invitation Status
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

// Notification Type
export type NotificationType = 'invitation' | 'system' | 'announcement';
