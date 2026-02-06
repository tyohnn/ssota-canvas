/**
 * User Management Domain - Secure Action Utilities
 *
 * 이 파일에서만 secure action wrapper를 정의·관리합니다.
 * - 온보딩(프로필 미존재): withOnboardingSecureAction, getOnboardingAuthenticatedUser
 * - 일반(프로필 필요): withUserManagementSecureAction
 */
import { getAuthenticatedUser } from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import { getCurrentUser } from '@/domains/common/auth/server-auth.helpers';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import type { AuthorizeResult } from '@/lib/server-actions/types';

// ============================================
// Onboarding: Supabase 인증만 (프로필 불필요)
// ============================================

/**
 * 온보딩용 인증 사용자 (프로필이 아직 없을 수 있음)
 */
export interface OnboardingAuthenticatedUser {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
}

/**
 * Supabase 인증만 확인. 프로필 존재 여부는 검사하지 않음.
 * 온보딩 완료 전 호출하는 액션에서 사용.
 * getCurrentUser 유틸 사용.
 */
export async function getOnboardingAuthenticatedUser(): Promise<OnboardingAuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('UNAUTHORIZED: User not authenticated');
  }

  return {
    id: user.id,
    email: user.email ?? '',
    user_metadata: (user.user_metadata as Record<string, unknown>) ?? {},
  };
}

/**
 * 온보딩 전용 secure action wrapper
 * - 인증: Supabase Auth만 (프로필 없어도 통과)
 * - Context: { authenticatedUser: OnboardingAuthenticatedUser }
 */
const onboardingSecureActionBuilder =
  createSecureActionBuilder<OnboardingAuthenticatedUser>(
    getOnboardingAuthenticatedUser
  );

export const withOnboardingSecureAction = onboardingSecureActionBuilder
  .forContext<Record<string, never>>()
  .withAuth(
    async (
      _req: unknown,
      user: OnboardingAuthenticatedUser
    ): Promise<AuthorizeResult<Record<string, never>>> => {
      return { success: true, context: {} };
    }
  )
  .build();

// ============================================
// 일반: 프로필 필요 (AuthenticatedUser)
// ============================================

/**
 * 프로필이 이미 있는 사용자만 허용하는 secure action wrapper
 * common auth getAuthenticatedUser 사용
 */
const userManagementSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

export const withUserManagementSecureAction = userManagementSecureActionBuilder
  .forContext<Record<string, never>>()
  .withAuth(
    async (
      _req: unknown,
      user: AuthenticatedUser
    ): Promise<AuthorizeResult<Record<string, never>>> => {
      return { success: true, context: {} };
    }
  )
  .build();
