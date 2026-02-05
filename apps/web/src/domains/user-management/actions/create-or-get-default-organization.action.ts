'use server';

import { DrizzleOrganizationRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { ActionResult, err, ok } from '@/lib';

import { createOrGetDefaultOrganization } from '../backend/services/create-or-get-default-organization.service';
import {
  type CreateOrGetDefaultOrganizationRequest,
  CreateOrGetDefaultOrganizationRequestSchema,
} from '../shared/dtos/requests/user.requests';
import type { DefaultOrganizationPayload } from '../shared/types';
import type { OnboardingAuthenticatedUser } from './secure-action';
import { withOnboardingSecureAction } from './secure-action';

type OnboardingContext = { authenticatedUser: OnboardingAuthenticatedUser };

/**
 * 기본 조직 생성 또는 기존 조직 조회 Server Action
 *
 * ⚠️ Security: withOnboardingSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인 (getCurrentUser)
 */
export const createOrGetDefaultOrganizationAction = withOnboardingSecureAction(
  CreateOrGetDefaultOrganizationRequestSchema,
  'createOrGetDefaultOrganization',
  createOrGetDefaultOrganizationInternal,
  {
    getLogMetadata: req => ({ organizationName: req.organizationName }),
  }
);

async function createOrGetDefaultOrganizationInternal(
  safeDto: CreateOrGetDefaultOrganizationRequest,
  context: OnboardingContext
): Promise<ActionResult<DefaultOrganizationPayload>> {
  const userId = context.authenticatedUser.id;
  const organizationRepository = new DrizzleOrganizationRepository();
  const workspaceRepository = new DrizzleWorkspaceRepository();
  const pageRepository = new DrizzlePageRepository();

  const result = await createOrGetDefaultOrganization(userId, safeDto.organizationName, {
    organizationRepository,
    workspaceRepository,
    pageRepository,
  });

  if (result.isError()) {
    return err(result.error.message, {
      code: result.error.code,
      meta: { originalError: result.error },
    });
  }
  return ok(result.value);
}
