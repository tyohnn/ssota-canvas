// apps/web/src/domains/organization-management/shared/types/index.ts

import { memberRoleEnum } from '@/db/schema';

// Organization Types (static definition)
export type OrganizationType =
  | 'personal'
  | 'education'
  | 'startup'
  | 'agency'
  | 'company'
  | 'n/a';

// Organization Type Labels
export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  personal: 'Personal',
  education: 'Education',
  startup: 'Startup',
  agency: 'Agency',
  company: 'Company',
  'n/a': 'N/A',
} as const;

/**
 * Member Role Type
 *
 * Type extracted from DB schema's memberRoleEnum
 * - 'owner': Organization owner
 * - 'admin': Administrator
 * - 'member': Regular member
 */
export type MemberRole = (typeof memberRoleEnum.enumValues)[number];

/**
 * Member Role with null (optional role)
 *
 * Used when returning null for non-members during permission checks
 */
export type MemberRoleOrNull = MemberRole | null;

// Invitation Status
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

// Notification Type
export type NotificationType = 'invitation' | 'system' | 'announcement';
