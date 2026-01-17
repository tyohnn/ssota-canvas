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

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { BlockId } from '../../shared/value-objects/block-id.vo';

/**
 * Block-based authorization with workspace validation (Zero Trust)
 *
 * blockId만으로 workspace 권한 자동 검증
 * 1. Block 조회 (DB = SSOT)
 * 2. Block에서 workspaceId 추출
 * 3. Workspace 권한 검증
 *
 * Returns WorkspaceActionContext
 */
async function authorizeBlockById(
  blockId: string,
  userId: string
): Promise<AuthorizeResult<WorkspaceActionContext>> {
  // 1. Block 조회 (DB = SSOT)
  const blockRepository = new DrizzleBlockRepository();
  const block = await blockRepository.findById(new BlockId(blockId));

  if (!block) {
    return { success: false, error: 'Block not found' };
  }

  // 2. Block에서 workspaceId 추출
  const workspaceId = block.workspaceId.value;

  // 3. Workspace 권한 검증
  return await authorizeByWorkspaceId(workspaceId, userId);
}

/**
 * Block 전용 Secure Action Builder
 */
const blockSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * Block 전용 secure action wrapper
 *
 * Block 업데이트/관리 작업에 사용합니다.
 * 자동으로 다음을 검증합니다:
 * 1. 사용자 인증
 * 2. Workspace 접근 권한
 * 3. Block 소유권 (Block이 해당 Workspace에 속하는지 확인)
 *
 * @example
 * ```ts
 * export const updateBlockAction = withBlockSecureAction(
 *   UpdateBlockRequestSchema,
 *   'updateBlockAction',
 *   async (req, ctx) => {
 *     // ctx는 WorkspaceActionContext
 *     // req.blockId가 ctx.workspace에 속함이 검증됨
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withBlockSecureAction = blockSecureActionBuilder
  .forContext<WorkspaceActionContext>()
  .withAuth((req: { blockId: string }, user: AuthenticatedUser) =>
    authorizeBlockById(req.blockId, user.id)
  )
  .build();
