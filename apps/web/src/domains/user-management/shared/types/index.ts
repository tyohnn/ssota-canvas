// apps/web/src/domains/user-management/types/index.ts

// User management types
// Organization-related types moved to organization-management domain

import type { CreateDefaultOrganizationResult } from '@/domains/organization-management/backend/services/interfaces/common.types';

/** 기본 조직 생성/조회 결과 (createdNewOrganization 포함) */
export type DefaultOrganizationPayload = CreateDefaultOrganizationResult & {
  createdNewOrganization: boolean;
};

/** 사용자 등록 완료 결과 (프로필 + 기본 조직 payload) */
export type UserRegistrationResult = {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
} & DefaultOrganizationPayload;

export interface UserProfile {
  userId: string;
  email: string | null;
  name: string | null;
  profileImageUrl: string | null;
}

/**
 * Minimal auth user info used when creating/updating profile from auth.
 * DomainUser (ACL) and Supabase User can both be mapped to this shape.
 */
export interface AuthUserInfo {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
}
