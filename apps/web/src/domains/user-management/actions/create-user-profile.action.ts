'use server';

import { ActionResult, err, ok } from '@/lib';
import { createClient } from '@/utils/supabase/server';

import { SupabaseAuthService } from '../backend/anti-corruption-layers/supabase-auth-acl';
import { DrizzleUserProfileViewRepository } from '../backend/read-models/user-profile.view';
import type { UserProfileView } from '../backend/read-models/user-profile.view';
import { DrizzleUserRepository } from '../backend/repositories/implementations/drizzle-user.repository';
import { UserManagementService } from '../backend/services/user-management.service';
import { CreateUserProfileRequestSchema } from '../shared/dtos/requests/user.requests';
import { UserId } from '../shared/value-objects/ids.vo';
import type { OnboardingAuthenticatedUser } from './secure-action';
import { withOnboardingSecureAction } from './secure-action';

/**
 * 프로필만 생성 Server Action
 *
 * ⚠️ Security: withOnboardingSecureAction (getCurrentUser 기반 인증)
 */
export const createUserProfileAction = withOnboardingSecureAction(
  CreateUserProfileRequestSchema,
  'createUserProfile',
  async (_req, ctx) => createUserProfileInternal(ctx.authenticatedUser)
);


/**
 * 프로필만 생성 (온보딩 중 단계별 호출용).
 * Internal: 의존성 오케스트레이션 + 서비스 호출만.
 */
async function createUserProfileInternal(
  authUser: OnboardingAuthenticatedUser
): Promise<ActionResult<UserProfileView>> {
  try {
    const supabase = await createClient();
    const userRepository = new DrizzleUserRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);
    const service = new UserManagementService(
      userRepository,
      supabaseAuthService
    );

    const result = await service.createUserProfile(authUser);
    if (result.isError()) {
      return err(result.error.message, {
        code: 'PROFILE_CREATION_FAILED',
        meta: { originalError: result.error },
      });
    }

    const viewRepository = new DrizzleUserProfileViewRepository();
    const view = await viewRepository.getByUserId(new UserId(authUser.id));
    if (!view) {
      return err('User profile view not found', {
        code: 'PROFILE_VIEW_NOT_FOUND',
      });
    }

    return ok(view);
  } catch (error) {
    console.error('[createUserProfileInternal] Error:', error);
    return err(
      error instanceof Error ? error.message : 'Internal server error',
      { code: 'INTERNAL_SERVER_ERROR' }
    );
  }
}
