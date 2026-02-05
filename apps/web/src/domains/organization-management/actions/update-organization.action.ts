'use server';

import type { OrganizationActionContext } from '@/domains/common/auth/types';
import { withOrganizationOwnerSecureAction } from '@/domains/common/server-actions';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleOrganizationMemberRepository } from '../backend/repositories/implementations/drizzle-organization-member.repository';
import { DrizzleOrganizationRepository } from '../backend/repositories/implementations/drizzle-organization.repository';
import { DefaultOrganizationCrudService } from '../backend/services/organization-crud.service';
import {
  UpdateOrganizationRequestSchema,
  type UpdateOrganizationRequest,
} from '../shared/dtos';

/**
 * 조직 정보 수정 (이름, 아이콘). 소유자만 수정 가능.
 *
 * ⚠️ Security: withOrganizationOwnerSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 소유자 권한 확인
 */
export const updateOrganizationAction = withOrganizationOwnerSecureAction(
  UpdateOrganizationRequestSchema,
  'updateOrganizationAction',
  updateOrganizationInternal,
  {
    getLogMetadata: req => ({ organizationId: req.organizationId }),
  }
);

/**
 * 내부 구현 (검증된 요청만 처리)
 */
async function updateOrganizationInternal(
  safeDto: UpdateOrganizationRequest,
  _context: OrganizationActionContext
): Promise<ActionResult<{ success: true }>> {
  try {
    const organizationRepository = new DrizzleOrganizationRepository();
    const organizationMemberRepository =
      new DrizzleOrganizationMemberRepository();
    const crudService = new DefaultOrganizationCrudService(
      organizationRepository,
      organizationMemberRepository,
      null as any
    );

    const result = await crudService.updateOrganization({
      organizationId: safeDto.organizationId,
      name: safeDto.name,
      iconUrl: safeDto.iconUrl,
    });

    if (result.isError()) {
      return err(result.error.message, { code: result.error.code });
    }

    return ok({ success: true });
  } catch (error) {
    console.error('[updateOrganizationInternal] Error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
