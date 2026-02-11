/**
 * Source Management - Secure Action Builders
 *
 * Block 기반: blockId → block 조회 → workspace 권한 → block.source_id 확인
 * Published Page 기반: publishToken → publishedPage → block 소속 및 source_id 일치
 */
import {
  authorizeByWorkspaceId,
  getAuthenticatedUser,
} from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import type { AuthorizeResult } from '@/lib/server-actions/types';

import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzlePublishedPageRepository } from '@/domains/share/backend/repositories/implementations/drizzle-published-page.repository';
import { PublishToken } from '@/domains/share/shared/value-objects/publish-token.vo';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

const sourceSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

export interface SourceBlockActionContext extends WorkspaceActionContext {
  blockId: string;
  sourceId: string;
}

/**
 * Block 기반 인증: blockId → block 조회 → workspace 권한 → source_id 확인
 */
async function authorizeSourceBlockById(
  req: { blockId: string },
  userId: string
): Promise<AuthorizeResult<SourceBlockActionContext>> {
  const blockRepository = new DrizzleBlockRepository();
  const block = await blockRepository.findById(new BlockId(req.blockId));
  if (!block) {
    return { success: false, error: 'Block not found' };
  }

  const workspaceAuth = await authorizeByWorkspaceId(
    block.workspaceId.value,
    userId
  );
  if (!workspaceAuth.success || !workspaceAuth.context) {
    return {
      success: false,
      error: workspaceAuth.error ?? 'Workspace access denied',
    };
  }

  const sourceId = block.sourceId;
  if (!sourceId) {
    return { success: false, error: 'Block has no linked source' };
  }

  return {
    success: true,
    context: {
      ...workspaceAuth.context,
      blockId: req.blockId,
      sourceId,
    },
  };
}

export const withSourceBlockSecureAction = sourceSecureActionBuilder
  .forContext<SourceBlockActionContext>()
  .withAuth((req: { blockId: string }, user) =>
    authorizeSourceBlockById(req, user.id)
  )
  .build();

/**
 * Published Page 기반 인증: publishToken → publishedPage → block 소속 확인 → block.source_id = sourceId
 */
export interface PublishedPageSourceContext {
  publishToken: string;
  blockId: string;
  sourceId: string;
  orgId: string;
}

async function authorizeByPublishedPageSource(
  req: { publishToken: string; blockId: string; sourceId: string },
  _user: null
): Promise<AuthorizeResult<PublishedPageSourceContext>> {
  let token: PublishToken;
  try {
    token = new PublishToken(req.publishToken);
  } catch {
    return { success: false, error: 'Invalid publish token format' };
  }

  const pageRepo = new DrizzlePublishedPageRepository();
  const publishedPage = await pageRepo.findByToken(token);
  if (!publishedPage) {
    return { success: false, error: 'Invalid or expired publish token' };
  }
  if (!publishedPage.isPublished()) {
    return { success: false, error: 'Page is not published' };
  }

  const blockMountRepo = new DrizzleBlockMountRepository();
  const pageId = new PageId(publishedPage.pageId);
  const blockMounts = await blockMountRepo.findByPageId(pageId);
  const blockOnPage = blockMounts.some(
    m => m.getBlockMount().blockId.value === req.blockId
  );
  if (!blockOnPage) {
    return { success: false, error: 'Block not on this published page' };
  }

  const blockRepository = new DrizzleBlockRepository();
  const block = await blockRepository.findById(new BlockId(req.blockId));
  if (!block) return { success: false, error: 'Block not found' };
  if (!block.sourceId) {
    return { success: false, error: 'Block has no linked source' };
  }
  if (block.sourceId !== req.sourceId) {
    return { success: false, error: 'Source ID mismatch' };
  }

  const workspaceRepository = new DrizzleWorkspaceRepository();
  const workspace = await workspaceRepository.findById(block.workspaceId);
  if (!workspace) return { success: false, error: 'Workspace not found' };
  const orgId = workspace.organizationId.value;

  return {
    success: true,
    context: {
      publishToken: req.publishToken,
      blockId: req.blockId,
      sourceId: req.sourceId,
      orgId,
    },
  };
}

const publishedPageSourceSecureActionBuilder = createSecureActionBuilder<null>(
  async () => null
);

export const withPublishedPageSourceSecureAction =
  publishedPageSourceSecureActionBuilder
    .forContext<PublishedPageSourceContext>()
    .withAuth(
      (req: {
        publishToken: string;
        blockId: string;
        sourceId: string;
      }) => authorizeByPublishedPageSource(req, null)
    )
    .build();
