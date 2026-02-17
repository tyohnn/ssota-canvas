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
import type { AuthorizeResult } from '@/lib/server-actions/types';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { BlockAggregate } from '../../shared/aggregates/block.aggregate';

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
 * Block aggregate를 context에 담는 액션용 context
 * (update property, update content, apply steps 등 단일 block 조작)
 */
export interface BlockActionContext extends WorkspaceActionContext {
  blockAggregate: BlockAggregate;
}

/**
 * workspaceId + blockId로 Block 조회 후 aggregate를 context에 담기
 */
async function authorizeBlockAggregate(
  workspaceId: string,
  blockId: string,
  userId: string
): Promise<AuthorizeResult<BlockActionContext>> {
  const workspaceResult = await authorizeByWorkspaceId(workspaceId, userId);
  if (!workspaceResult.success || !workspaceResult.context) {
    return workspaceResult as AuthorizeResult<BlockActionContext>;
  }

  const blockRepository = new DrizzleBlockRepository();
  const workspaceIdVO = workspaceResult.context.workspace.workspaceId;
  const block = await blockRepository.findByWorkspaceIdAndSlug(
    workspaceIdVO,
    blockId
  );

  if (!block) {
    return { success: false, error: 'Block not found' };
  }

  const blockAggregate = BlockAggregate.reconstitute(block);

  return {
    success: true,
    context: {
      ...workspaceResult.context,
      blockAggregate,
    },
  };
}

/**
 * Block 전용 Secure Action Builder
 */
const blockSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * Block aggregate를 조회해 context에 담는 secure action wrapper
 *
 * Request: workspaceId, blockId 필수.
 * Context: blockAggregate 포함 → 서비스에서 재조회 없이 사용.
 */
export const withBlockAggregateSecureAction = blockSecureActionBuilder
  .forContext<BlockActionContext>()
  .withAuth(
    (
      req: { workspaceId: string; blockId: string },
      user: AuthenticatedUser
    ) => authorizeBlockAggregate(req.workspaceId, req.blockId, user.id)
  )
  .build();

/**
 * Block 전용 secure action wrapper (workspace만 검증, aggregate 없음)
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
