/**
 * Link App Space - Common Action Utilities
 *
 * Link Block 전용 Server Action wrapper
 */
import { authorizeByWorkspaceId, getAuthenticatedUser } from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import type { AuthorizeResult } from '@/lib/server-actions/types';

import { DrizzleBlockRepository } from '../../block-management/backend/repositories/implementations/drizzle-block.repository';
import type { Block } from '../../block-management/shared/entities/block.entity';
import { BlockSlugSchema } from '../../block-management/shared/dtos/requests/block.requests';

/**
 * Link Block Action Context
 */
export interface LinkBlockActionContext extends WorkspaceActionContext {
  block: Block;
}

async function authorizeLinkBlock(
  req: { workspaceId: string; blockId: string },
  userId: string
): Promise<AuthorizeResult<LinkBlockActionContext>> {
  const parse = BlockSlugSchema.safeParse(req.blockId);
  if (!parse.success) {
    return { success: false, error: 'Invalid block ID format' };
  }

  const workspaceResult = await authorizeByWorkspaceId(req.workspaceId, userId);
  if (!workspaceResult.success || !workspaceResult.context) {
    return workspaceResult as AuthorizeResult<LinkBlockActionContext>;
  }

  const blockRepository = new DrizzleBlockRepository();
  const block = await blockRepository.findByWorkspaceIdAndSlug(
    workspaceResult.context.workspace.workspaceId,
    req.blockId
  );

  if (!block) {
    return { success: false, error: 'Block not found' };
  }

  if (block.blockType.value !== 'link') {
    return { success: false, error: 'Block must be a link block' };
  }

  return {
    success: true,
    context: {
      ...workspaceResult.context,
      block: block as Block,
    },
  };
}

const linkSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

export const withLinkBlockSecureAction = linkSecureActionBuilder
  .forContext<LinkBlockActionContext>()
  .withAuth(
    (req: { workspaceId: string; blockId: string }, user: AuthenticatedUser) =>
      authorizeLinkBlock(req, user.id)
  )
  .build();
