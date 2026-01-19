/**
 * 모든 워크스페이스를 조직별로 조회 Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * Defense in Depth:
 * 1. Request 스키마 검증 (void)
 * 2. 사용자 인증 확인
 */

'use server';

import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import { getAuthenticatedUser } from '@/domains/common/auth/helpers';
import { ActionResult, err, ok } from '@/lib';

import {
  DrizzleWorkspaceByOrgViewRepository,
} from '../backend/read-models/workspace-by-org.view';
import { UserId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import {
  GetAllWorkspacesByOrgRequestSchema,
  type GetAllWorkspacesByOrgRequest,
} from '../shared/schemas/workspace-navigation.schemas';
import type { AllWorkspacesByOrgDTO } from '../shared/dtos';

/**
 * 모든 워크스페이스를 조직별로 조회 Action
 * 인증된 사용자의 모든 워크스페이스를 조직별로 그룹핑하여 반환
 */
export async function getAllWorkspacesByOrgAction(
  request: unknown
): Promise<ActionResult<AllWorkspacesByOrgDTO>> {
  // 1. Runtime Validation (필수)
  const parseResult = GetAllWorkspacesByOrgRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to getAllWorkspacesByOrgAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data;

  // 3. 인증 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await getAllWorkspacesByOrgInternal(validatedRequest, user);
  } catch (error) {
    console.error('[getAllWorkspacesByOrgAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'UNAUTHORIZED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 * - 사용자 인증 완료
 *
 * @param _safeDto - 검증된 요청 데이터 (void)
 * @param user - 인증된 사용자 정보
 */
async function getAllWorkspacesByOrgInternal(
  _safeDto: GetAllWorkspacesByOrgRequest,
  user: AuthenticatedUser
): Promise<ActionResult<AllWorkspacesByOrgDTO>> {
  try {
    // Read Model을 직접 사용 (같은 레이어이므로 Query Service 불필요)
    const viewRepository = new DrizzleWorkspaceByOrgViewRepository();
    const organizationsWithWorkspaces = await viewRepository.getByUserId(
      new UserId(user.id)
    );

    // Read Model View를 Share 도메인 DTO로 변환
    const response: AllWorkspacesByOrgDTO = {
      organizations: organizationsWithWorkspaces.map(org => ({
        id: org.id,
        name: org.name,
        workspaces: org.workspaces,
      })),
    };

    return ok(response);
  } catch (error) {
    console.error('[getAllWorkspacesByOrgInternal] Error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
