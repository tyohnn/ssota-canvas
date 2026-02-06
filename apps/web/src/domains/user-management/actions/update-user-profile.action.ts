'use server';

import { ActionResult, err, ok } from '@/lib';
import { createClient } from '@/utils/supabase/server';
import { SupabaseAuthService } from '../backend/anti-corruption-layers/supabase-auth-acl';
import { DrizzleUserRepository } from '../backend/repositories/implementations/drizzle-user.repository';
import { UserManagementService } from '../backend/services/user-management.service';
import {
  UpdateUserProfileRequestSchema,
  type UpdateUserProfileRequest,
} from '../shared/dtos/requests/user.requests';
import { withUserManagementSecureAction } from './secure-action';

/**
 * 현재 사용자 프로필 업데이트 (이름, 아바타, 언어)
 */
export const updateUserProfileAction = withUserManagementSecureAction(
  UpdateUserProfileRequestSchema,
  'updateUserProfile',
  async (req, ctx) => updateUserProfileInternal(ctx.authenticatedUser.id, req)
);

async function updateUserProfileInternal(
  userId: string,
  updateData: UpdateUserProfileRequest
): Promise<ActionResult<{ ok: true }>> {
  try {
    const supabase = await createClient();
    const userRepository = new DrizzleUserRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);
    const service = new UserManagementService(
      userRepository,
      supabaseAuthService
    );
    const result = await service.updateUserProfile(userId, updateData);
    if (result.isError()) {
      return err(result.error.message, {
        code: 'INTERNAL_SERVER_ERROR',
        meta: { originalError: result.error },
      });
    }
    return ok({ ok: true });
  } catch (error) {
    console.error('[updateUserProfileInternal] Error:', error);
    return err(
      error instanceof Error ? error.message : 'Failed to update profile',
      { code: 'INTERNAL_SERVER_ERROR' }
    );
  }
}
