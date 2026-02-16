/**
 * Block Management - Common Action Utilities
 *
 * Block 도메인 전용 Server Action wrapper와 유틸리티들
 */
import {
  authorizeByWorkspaceId,
  getAuthenticatedUser,
} from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import { AuthorizeResult } from '@/lib/server-actions/types';

/**
 * Block 요청은 모두 workspaceId 포함. workspaceId로 권한 검증.
 * 서비스에서 findByWorkspaceIdAndSlug(workspaceId, blockId) 사용.
 */
async function authorizeByBlockRequest(
  req: { workspaceId: string },
  userId: string
): Promise<AuthorizeResult<WorkspaceActionContext>> {
  return authorizeByWorkspaceId(req.workspaceId, userId);
}

/**
 * Block 전용 Secure Action Builder
 */
const blockSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * Block 전용 secure action wrapper
 *
 * 스키마에 workspaceId 필수. 권한은 safeDto.workspaceId로 검증.
 * 서비스에서는 findByWorkspaceIdAndSlug(safeDto.workspaceId, safeDto.blockId)로 조회.
 */
export const withBlockSecureAction = blockSecureActionBuilder
  .forContext<WorkspaceActionContext>()
  .withAuth(
    (req: { workspaceId: string }, user: AuthenticatedUser) =>
      authorizeByBlockRequest(req, user.id)
  )
  .build();
