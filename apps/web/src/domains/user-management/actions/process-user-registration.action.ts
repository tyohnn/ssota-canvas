'use server';

import { DrizzleOrganizationRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { ActionResult, err, ok } from '@/lib';
import { createClient } from '@/utils/supabase/server';

import { createOrGetDefaultOrganization } from '../backend/services/create-or-get-default-organization.service';
import { SupabaseAuthService } from '../backend/anti-corruption-layers/supabase-auth-acl';
import { DrizzleUserRepository } from '../backend/repositories/implementations/drizzle-user.repository';
import { UserManagementService } from '../backend/services/user-management.service';
import { ProcessUserRegistrationRequestSchema } from '../shared/dtos/requests/user.requests';
import { withOnboardingSecureAction } from './secure-action';

/**
 * 사용자 등록 처리 (프로필 + 기본 조직) Server Action
 *
 * 액션에서 두 서비스를 순차 호출: createUserProfile → createOrGetDefaultOrganization
 *
 * ⚠️ Security: withOnboardingSecureAction (getCurrentUser 기반 인증)
 */
export const processUserRegistrationAction = withOnboardingSecureAction(
  ProcessUserRegistrationRequestSchema,
  'processUserRegistration',
  async (req, ctx) => {
    try {
      const supabase = await createClient();
      const userRepository = new DrizzleUserRepository();
      const supabaseAuthService = new SupabaseAuthService(supabase);
      const service = new UserManagementService(
        userRepository,
        supabaseAuthService
      );

      const userResult = await service.createUserProfile(
        ctx.authenticatedUser,
        req.language
      );
      if (userResult.isError()) {
        return err(userResult.error.message, {
          code: userResult.error.code as string,
          meta: { originalError: userResult.error },
        });
      }

      const metadata = ctx.authenticatedUser.user_metadata as
        | { name?: string }
        | undefined;
      const userName = req.name ?? metadata?.name ?? 'User';
      const orgName =
        req.organizationName ?? `${userName}'s Organization`;

      const organizationRepository = new DrizzleOrganizationRepository();
      const workspaceRepository = new DrizzleWorkspaceRepository();
      const pageRepository = new DrizzlePageRepository();
      const orgResult = await createOrGetDefaultOrganization(
        ctx.authenticatedUser.id,
        orgName,
        { organizationRepository, workspaceRepository, pageRepository }
      );
      if (orgResult.isError()) {
        return err(orgResult.error.message, {
          code: orgResult.error.code as string,
          meta: { originalError: orgResult.error },
        });
      }

      const user = userResult.value;
      return ok({
        user: {
          id: user.id.value,
          email: user.entity.email.value,
          name: user.entity.name,
          avatarUrl: user.entity.avatarUrl,
        },
        ...orgResult.value,
      });
    } catch (error) {
      console.error('[processUserRegistrationAction] Error:', error);
      return err(
        error instanceof Error ? error.message : 'Internal server error',
        { code: 'INTERNAL_SERVER_ERROR' }
      );
    }
  },
  {
    getLogMetadata: req => ({
      language: req.language,
      hasName: !!req.name,
      hasOrganizationName: !!req.organizationName,
    }),
  }
);
