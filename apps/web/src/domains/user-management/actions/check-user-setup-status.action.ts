'use server';

import { ActionResult, err, ok } from '@/lib';
import { createClient } from '@/utils/supabase/server';

import { SupabaseAuthService } from '../backend/anti-corruption-layers/supabase-auth-acl';
import { DrizzleUserRepository } from '../backend/repositories/implementations/drizzle-user.repository';
import { UserManagementService } from '../backend/services/user-management.service';
import { CheckUserSetupStatusRequestSchema } from '../shared/dtos/requests/user.requests';
import { withOnboardingSecureAction } from './secure-action';

/**
 * 사용자 설정 완료 상태 확인 Server Action
 *
 * ⚠️ Security: withOnboardingSecureAction (getCurrentUser 기반 인증)
 */
export const checkUserSetupStatusAction = withOnboardingSecureAction(
  CheckUserSetupStatusRequestSchema,
  'checkUserSetupStatus',
  async (_req, ctx) =>
    checkUserSetupStatusInternal(ctx.authenticatedUser.id)
);

/**
 * 설정 완료 상태 확인 Internal.
 * 의존성 오케스트레이션 + 서비스 호출만.
 */
async function checkUserSetupStatusInternal(
  userId: string
): Promise<
  ActionResult<{
    isSetupComplete: boolean;
    redirectUrl?: string;
    isBetaApproved: boolean;
    beta_status: string;
    beta_application: unknown;
  }>
> {
  try {
    const supabase = await createClient();
    const userRepository = new DrizzleUserRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);
    const service = new UserManagementService(
      userRepository,
      supabaseAuthService
    );
    const result = await service.checkUserSetupStatus(userId);
    if (result.isError()) {
      return err(result.error.message, {
        code: 'INTERNAL_SERVER_ERROR',
        meta: { originalError: result.error },
      });
    }
    return ok(result.value);
  } catch (error) {
    console.error('[checkUserSetupStatusInternal] Error:', error);
    return err(
      error instanceof Error ? error.message : 'Failed to check setup status',
      { code: 'INTERNAL_SERVER_ERROR' }
    );
  }
}

