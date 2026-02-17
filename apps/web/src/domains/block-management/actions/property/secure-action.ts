/**
 * Property (Custom Property) 전용 Secure Action
 *
 * workspace 권한 + Block 조회 후 blockAggregate를 context에 담아 서비스에서 재조회 없이 사용.
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
 * Property 액션용 context (block aggregate 포함 → 서비스 재조회 없음)
 */
export interface PropertyActionContext extends WorkspaceActionContext {
  blockAggregate: BlockAggregate;
}

async function authorizePropertyBlock(
  workspaceId: string,
  blockId: string,
  userId: string
): Promise<AuthorizeResult<PropertyActionContext>> {
  const workspaceResult = await authorizeByWorkspaceId(workspaceId, userId);
  if (!workspaceResult.success || !workspaceResult.context) {
    return workspaceResult as AuthorizeResult<PropertyActionContext>;
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

const propertySecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * Custom Property 액션용 secure action wrapper
 *
 * Request: workspaceId, blockId 필수.
 * Context: blockAggregate 포함 → 서비스에서 재조회 없이 사용.
 */
export const withPropertySecureAction = propertySecureActionBuilder
  .forContext<PropertyActionContext>()
  .withAuth(
    (
      req: { workspaceId: string; blockId: string },
      user: AuthenticatedUser
    ) => authorizePropertyBlock(req.workspaceId, req.blockId, user.id)
  )
  .build();
