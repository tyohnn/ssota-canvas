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
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';

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
 * Workspace Management 전용 Secure Action Builder
 */
const workspaceSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * Authenticated user only secure action wrapper
 */
const withAuthenticatedAction =
  workspaceSecureActionBuilder
    .forContext<AuthenticatedUser>()
    .withAuth(() => Promise.resolve(ok(undefined))) // 인증만 확인 (권한 체크 불필요)
    .build();

/**
 * 모든 워크스페이스를 조직별로 조회 Action
 * 인증된 사용자의 모든 워크스페이스를 조직별로 그룹핑하여 반환
 */
export const getAllWorkspacesByOrgAction =
  withAuthenticatedAction(
    GetAllWorkspacesByOrgRequestSchema,
    'getAllWorkspacesByOrgAction',
    getAllWorkspacesByOrgInternal,
    {
      getLogMetadata: () => ({}),
    }
  );

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 * - 사용자 인증 완료
 *
 * @param safeDto - 검증된 요청 데이터 (void)
 * @param context - 검증된 컨텍스트 정보
 *   - context: 인증된 사용자 정보 (id, profile)
 */
async function getAllWorkspacesByOrgInternal(
  _safeDto: GetAllWorkspacesByOrgRequest,
  context: AuthenticatedUser
): Promise<ActionResult<AllWorkspacesByOrgDTO>> {
  try {
    // Read Model을 직접 사용 (같은 레이어이므로 Query Service 불필요)
    const viewRepository = new DrizzleWorkspaceByOrgViewRepository();
    const organizationsWithWorkspaces = await viewRepository.getByUserId(
      new UserId(context.id)
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
