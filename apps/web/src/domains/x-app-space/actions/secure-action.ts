/**
 * X App Space - Secure Action Utilities
 */
import {
  authorizeByWorkspaceId,
  getAuthenticatedUser,
} from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import { AuthorizeResult } from '@/lib/server-actions/types';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { Block } from '@/domains/block-management/shared/entities/block.entity';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';

export interface XBlockActionContext extends WorkspaceActionContext {
  block: Block;
}

const xSecureActionBuilder = createSecureActionBuilder<AuthenticatedUser>(
  getAuthenticatedUser
);

async function authorizeXBlockById(
  req: { workspaceId: string; blockId: string },
  userId: string
): Promise<AuthorizeResult<XBlockActionContext>> {
  const blockRepository = new DrizzleBlockRepository();
  const block = await blockRepository.findByWorkspaceIdAndSlug(
    new WorkspaceId(req.workspaceId),
    req.blockId
  );

  if (!block) {
    return { success: false, error: 'Block not found' };
  }

  if (block.blockType.value !== 'x') {
    return { success: false, error: 'Block type must be x' };
  }

  const workspaceAuthResult = await authorizeByWorkspaceId(
    block.workspaceId.value,
    userId
  );

  if (!workspaceAuthResult.success || !workspaceAuthResult.context) {
    return {
      success: false,
      error: workspaceAuthResult.error || 'Workspace access denied',
    };
  }

  return {
    success: true,
    context: {
      ...workspaceAuthResult.context,
      block,
    },
  };
}

export const withXBlockSecureAction = xSecureActionBuilder
  .forContext<XBlockActionContext>()
  .withAuth(
    (
      req: { workspaceId: string; blockId: string },
      user: AuthenticatedUser
    ) => authorizeXBlockById(req, user.id)
  )
  .build();
