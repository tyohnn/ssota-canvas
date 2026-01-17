/**
 * Canvas Management - Block Mount Action Utilities
 *
 * BlockMount 도메인 전용 Server Action wrapper와 유틸리티들
 */
import {
  authorizeByBlockMountId,
  authorizeByPageId,
  getAuthenticatedUser,
  verifyBlockOwnership,
} from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type { PageActionContext } from '@/domains/common/auth/types';
import type { Page } from '@/domains/workspace-management/shared/entities/page.entity';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import { AuthorizeResult } from '@/lib/server-actions/types';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { BlockMountId } from '../../shared/value-objects/block-mount-id.vo';

/**
 * Duplicate용: blockMountId로 모든 정보 자동 조회 후 검증 (Zero Trust)
 *
 * 1. BlockMount 조회 (DB = SSOT)
 * 2. BlockMount에서 pageId, blockId 추출
 * 3. Page 권한 검증 (workspace, organization 자동 검증됨)
 * 4. Block ownership 검증 (block이 workspace에 속하는지)
 *
 * Returns PageActionContext
 */
async function authorizeDuplicateBlockMount(
  blockMountId: string,
  userId: string
): Promise<AuthorizeResult<PageActionContext>> {
  // 1. BlockMount 조회 (DB = SSOT)
  const blockMountRepository = new DrizzleBlockMountRepository();
  const blockMount = await blockMountRepository.findById(
    new BlockMountId(blockMountId)
  );

  if (!blockMount) {
    return { success: false, error: 'Block mount not found' };
  }

  // 2. BlockMount에서 pageId, blockId 추출
  const pageId = blockMount.getBlockMount().pageId.value;
  const blockId = blockMount.getBlockMount().blockId.value;

  // 3. Page 권한 검증 (workspace, organization 자동 검증됨)
  const pageResult = await authorizeByPageId(pageId, userId);

  if (!pageResult.success || !pageResult.context) {
    return pageResult;
  }

  // 4. Block ownership 검증 (block이 workspace에 속하는지)
  const workspaceId = pageResult.context.workspace.workspaceId.value;
  const ownershipResult = await verifyBlockOwnership(blockId, workspaceId);

  if (!ownershipResult.isValid) {
    return {
      success: false,
      error:
        ownershipResult.error === 'BLOCK_NOT_FOUND'
          ? 'Block not found'
          : 'Block does not belong to this workspace',
    };
  }

  // 5. Page context 반환 (service layer에서 blockMount를 다시 조회하므로 blockId는 전달하지 않음)
  return pageResult;
}

/**
 * Move용: 원본 page + target page 모두 검증 (Defense in Depth)
 *
 * 1. BlockMount 조회 → 원본 pageId 추출 (DB = SSOT)
 * 2. 원본 page 권한 검증
 * 3. Target page 권한 검증
 * 4. 같은 workspace인지 확인 (cross-workspace move 방지)
 *
 * Returns PageActionContext with targetPage
 */
async function authorizeMoveBlockToPage(
  blockMountId: string,
  targetPageId: string,
  userId: string
): Promise<AuthorizeResult<PageActionContext & { targetPage: Page }>> {
  // 1. BlockMount 조회 → 원본 pageId 추출 (DB = SSOT)
  const blockMountRepository = new DrizzleBlockMountRepository();
  const blockMount = await blockMountRepository.findById(
    new BlockMountId(blockMountId)
  );

  if (!blockMount) {
    return { success: false, error: 'Block mount not found' };
  }

  const sourcePageId = blockMount.getBlockMount().pageId.value;

  // 2. 원본 page 권한 검증
  const sourcePageResult = await authorizeByPageId(sourcePageId, userId);

  if (!sourcePageResult.success || !sourcePageResult.context) {
    return sourcePageResult as AuthorizeResult<
      PageActionContext & { targetPage: Page }
    >;
  }

  // 3. Target page 권한 검증
  const targetPageResult = await authorizeByPageId(targetPageId, userId);

  if (!targetPageResult.success || !targetPageResult.context) {
    return {
      success: false,
      error: 'Target page access denied',
    } as AuthorizeResult<PageActionContext & { targetPage: Page }>;
  }

  // 4. 같은 workspace인지 확인 (cross-workspace move 방지)
  const sourceWorkspaceId =
    sourcePageResult.context.workspace.workspaceId.value;
  const targetWorkspaceId =
    targetPageResult.context.workspace.workspaceId.value;

  if (sourceWorkspaceId !== targetWorkspaceId) {
    return { success: false, error: 'Cannot move block across workspaces' };
  }

  // 5. Context + targetPage 반환 (원본 page context 기준)
  return {
    success: true,
    context: {
      ...sourcePageResult.context,
      targetPage: targetPageResult.context.page,
    },
  };
}

/**
 * BlockMount-based authorization with block ownership validation
 *
 * 1. Verifies page access (which also validates workspace access)
 * 2. Verifies block ownership (blockMount's block belongs to workspace)
 *
 * Returns PageActionContext (includes workspace, organization, page)
 */
export async function authorizeBlockMountWithBlockOwnership(
  blockMountId: string,
  blockId: string,
  userId: string
): Promise<AuthorizeResult<PageActionContext>> {
  // 1. Verify page access through blockMountId
  const pageResult = await authorizeByBlockMountId(blockMountId, userId);

  if (!pageResult.success) {
    return pageResult;
  }

  // 2. Extract workspace ID from context
  if (!pageResult.context) {
    return { success: false, error: 'Page context not found' };
  }
  const workspaceId = pageResult.context.workspace.workspaceId.value;

  // 3. Verify block ownership (block belongs to workspace)
  const ownershipResult = await verifyBlockOwnership(blockId, workspaceId);

  if (!ownershipResult.isValid) {
    return {
      success: false,
      error:
        ownershipResult.error === 'BLOCK_NOT_FOUND'
          ? 'Block not found'
          : 'Block does not belong to this workspace',
    };
  }

  // 4. Return page context
  return pageResult;
}

/**
 * BlockMount 전용 Secure Action Builder
 */
const blockMountSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * Duplicate 전용 secure action wrapper
 *
 * blockMountId만 받고 서버에서 자동 조회 (Zero Trust)
 * - pageId: blockMount에서 자동 추출
 * - blockId: blockMount에서 자동 추출
 * - workspace 권한, block ownership 모두 검증
 *
 * @example
 * ```ts
 * export const duplicateBlockAction = withDuplicateBlockSecureAction(
 *   DuplicateBlockRequestSchema,
 *   'duplicateBlockAction',
 *   async (req, ctx) => {
 *     // ctx는 PageActionContext
 *     // pageId는 ctx.page.id.value에서 가져옴
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withDuplicateBlockSecureAction = blockMountSecureActionBuilder
  .forContext<PageActionContext>()
  .withAuth((req: { blockMountId: string }, user: AuthenticatedUser) =>
    authorizeDuplicateBlockMount(req.blockMountId, user.id)
  )
  .build();

/**
 * Move 전용 secure action wrapper
 *
 * 원본 page + target page 양쪽 모두 검증 (Defense in Depth)
 * - 원본 pageId: blockMount에서 자동 추출
 * - target pageId: 클라이언트에서 제공
 * - cross-workspace move 방지
 *
 * @example
 * ```ts
 * export const moveBlockAction = withMoveBlockSecureAction(
 *   MoveBlockRequestSchema,
 *   'moveBlockAction',
 *   async (req, ctx) => {
 *     // ctx는 PageActionContext & { targetPage: Page }
 *     // 이미 target page 권한 검증됨
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withMoveBlockSecureAction = blockMountSecureActionBuilder
  .forContext<PageActionContext & { targetPage: Page }>()
  .withAuth(
    (
      req: { blockMountId: string; targetPageId: string },
      user: AuthenticatedUser
    ) => authorizeMoveBlockToPage(req.blockMountId, req.targetPageId, user.id)
  )
  .build();

/**
 * BlockMount 전용 secure action wrapper (with block ownership validation)
 *
 * BlockMount 작업에서 block ownership도 함께 검증해야 할 때 사용합니다.
 * 자동으로 다음을 검증합니다:
 * 1. 사용자 인증
 * 2. Page 접근 권한 (및 Workspace, Organization 접근 권한)
 * 3. Block 소유권 (BlockMount의 Block이 해당 Workspace에 속하는지 확인)
 *
 * @example
 * ```ts
 * export const updateBlockMountAction = withBlockMountSecureAction(
 *   UpdateBlockMountRequestSchema,
 *   'updateBlockMountAction',
 *   async (req, ctx) => {
 *     // ctx는 PageActionContext (workspace, organization, page 포함)
 *     // req.blockId가 ctx.workspace에 속함이 검증됨
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withBlockMountSecureAction = blockMountSecureActionBuilder
  .forContext<PageActionContext>()
  .withAuth(
    (req: { blockMountId: string; blockId: string }, user: AuthenticatedUser) =>
      authorizeBlockMountWithBlockOwnership(
        req.blockMountId,
        req.blockId,
        user.id
      )
  )
  .build();
