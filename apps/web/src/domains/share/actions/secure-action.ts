/**
 * Share Domain - Common Action Utilities
 *
 * Share 도메인 전용 Server Action wrapper와 유틸리티들
 */
import {
  authorizeByPageId,
  getAuthenticatedUser,
  verifyOrganizationMembership,
  verifyWorkspaceAccess,
} from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type {
  PageActionContext,
  WorkspaceActionContext,
} from '@/domains/common/auth/types';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import { AuthorizeResult } from '@/lib/server-actions/types';
import { DrizzleOrganizationRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository';
import { UserId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';

/**
 * Share 전용 Secure Action Builder
 */
const shareSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * Page-based authorization for Share actions
 *
 * pageId로 Share 액션 권한 검증
 * 1. Page 조회 (DB = SSOT)
 * 2. Page에서 workspaceId 추출
 * 3. Workspace 권한 검증 (공통 helper 사용)
 *
 * Returns PageActionContext
 */
async function authorizeSharePageById(
  pageId: string,
  userId: string
): Promise<AuthorizeResult<PageActionContext>> {
  // 공통 helper 사용
  return await authorizeByPageId(pageId, userId);
}

/**
 * Share Page 전용 secure action wrapper
 *
 * pageId 기반으로 Share 액션에 사용합니다.
 * 자동으로 다음을 검증합니다:
 * 1. 사용자 인증
 * 2. Page 접근 권한
 * 3. Workspace 접근 권한
 * 4. Organization 멤버십
 *
 * @example
 * ```ts
 * export const publishPageAction = withSharePageSecureAction(
 *   PublishPageRequestSchema,
 *   'publishPageAction',
 *   async (req, ctx) => {
 *     // ctx는 PageActionContext
 *     // req.pageId가 ctx.page에 속함이 검증됨
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withSharePageSecureAction = shareSecureActionBuilder
  .forContext<PageActionContext>()
  .withAuth((req: { pageId: string }, user: AuthenticatedUser) =>
    authorizeSharePageById(req.pageId, user.id)
  )
  .build();

/**
 * Simple authenticated action wrapper (인증만 필요)
 *
 * 인증만 필요한 Share 액션에 사용합니다.
 * 자동으로 다음을 검증합니다:
 * 1. 사용자 인증
 * 2. 기본 워크스페이스 및 조직 정보 포함 (WorkspaceActionContext)
 *
 * ⚠️ Note: 사용자의 기본 워크스페이스를 찾아서 context에 포함시킵니다.
 * 특정 워크스페이스가 필요하지 않은 액션에 사용합니다.
 *
 * @example
 * ```ts
 * export const getWorkspaceSelectionAction = withShareAuthenticatedAction(
 *   z.void(),
 *   'getWorkspaceSelectionAction',
 *   async (req, ctx) => {
 *     // ctx는 WorkspaceActionContext
 *     // ctx.workspace: 사용자의 기본 워크스페이스
 *     // ctx.organization: 조직 정보
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withShareAuthenticatedAction = shareSecureActionBuilder
  .forContext<WorkspaceActionContext>()
  .withAuth(async (_req, user: AuthenticatedUser) => {
    // 사용자의 기본 워크스페이스와 조직 정보 가져오기
    const orgRepository = new DrizzleOrganizationRepository();
    const workspaceRepository = new DrizzleWorkspaceRepository();
    const userIdVO = new UserId(user.id);

    // 1. 사용자의 기본 조직 찾기
    const organizations = await orgRepository.findByOwnerId(userIdVO);
    const defaultOrg = organizations.find((org) => org.entity.isDefault);

    if (!defaultOrg) {
      return {
        success: false,
        error: 'DEFAULT_ORGANIZATION_NOT_FOUND',
      };
    }

    // 2. 기본 조직의 기본 워크스페이스 찾기
    const orgId = defaultOrg.id;
    const workspaces = await workspaceRepository.findByOrganizationId(orgId);
    const defaultWorkspace = workspaces.find(ws => ws.isDefault);

    if (!defaultWorkspace) {
      return {
        success: false,
        error: 'DEFAULT_WORKSPACE_NOT_FOUND',
      };
    }

    // 3. 워크스페이스 접근 권한 확인
    const workspace = await verifyWorkspaceAccess(
      defaultWorkspace.workspaceId.value,
      user.id
    );

    if (!workspace) {
      return {
        success: false,
        error: 'NOT_WORKSPACE_MEMBER',
      };
    }

    // 4. 조직 멤버십 확인
    const orgMembership = await verifyOrganizationMembership(
      orgId.value,
      user.id
    );

    if (!orgMembership.isMember || !orgMembership.role) {
      return {
        success: false,
        error: 'NOT_ORG_MEMBER',
      };
    }

    // 5. WorkspaceActionContext 반환
    return {
      success: true,
      context: {
        authenticatedUser: user,
        workspace,
        organization: {
          id: orgId.value,
          role: orgMembership.role,
        },
      } as WorkspaceActionContext,
    };
  })
  .build();
