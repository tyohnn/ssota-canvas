'use server';

import { ActionResult, ok } from '@/lib';
import type { UserProfile } from '@/domains/user-management/shared/types';
import { CheckUserSetupStatusRequestSchema } from '../shared/dtos/requests/user.requests';
import { withUserManagementSecureAction } from './secure-action';

/**
 * 현재 로그인한 사용자의 프로필 조회
 * withUserManagementSecureAction: 프로필이 있는 사용자만 호출 가능
 */
export const getMyProfileAction = withUserManagementSecureAction(
  CheckUserSetupStatusRequestSchema,
  'getMyProfile',
  async (_req, ctx): Promise<ActionResult<UserProfile>> => {
    return ok(ctx.authenticatedUser.profile);
  }
);
