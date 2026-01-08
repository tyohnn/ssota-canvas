// apps/web/src/domains/share/actions/share.actions.ts
'use server';

import { z } from 'zod';
// import { createClient } from '@/utils/supabase/server';

import {
  PublishPageRequest,
  PublishPageRequestSchema,
  PublishResult,
  PublishedPageView,
  WorkspaceSelectionView,
  CopyPublishedPageRequest,
  CopyPublishedPageRequestSchema,
  CopyResult,
  UnpublishPageRequest,
  UnpublishPageRequestSchema,
  PublishedLinkView,
  GetPublishedLinkRequestSchema,
} from '../shared/dtos';
import { ShareManagementError } from '../shared/errors/share-management.error';
import { PublishToken } from '../shared/value-objects/publish-token.vo';
import { DrizzlePublishedPageRepository } from '../backend/repositories/implementations/drizzle-published-page.repository';
import { SharePublishingService } from '../backend/services/share-publishing.service';
import { ShareQueryService } from '../backend/services/share-query.service';
import { ShareCopyService } from '../backend/services/share-copy.service';
import { DefaultWorkspaceManagementAcl } from '../backend/services/default-workspace-management.acl';
import {
  getAuthenticatedUser,
} from '@/domains/common/auth/helpers';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { CanvasQueryService } from '@/domains/canvas-management/backend/services/canvas-query.service';
import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-edge.repository';
import { DrizzleViewportRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-viewport.repository';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';

export async function publishPageAction(
  input: unknown
): Promise<PublishResult> {
  const parsed = PublishPageRequestSchema.parse(input);
  const user = await getAuthenticatedUser();

  return publishPageActionInternal(parsed, user.id);
}

export async function publishPageActionInternal(
  input: PublishPageRequest,
  requesterId: string
): Promise<PublishResult> {
  const repository = new DrizzlePublishedPageRepository();
  const service = new SharePublishingService(repository);

  return service.publishPage({
    pageId: input.pageId,
    requesterId,
  });
}

export async function unpublishPageAction(
  input: unknown
): Promise<void> {
  const parsed = UnpublishPageRequestSchema.parse(input);
  const user = await getAuthenticatedUser();

  return unpublishPageActionInternal(parsed, user.id);
}

export async function unpublishPageActionInternal(
  input: UnpublishPageRequest,
  userId: string
): Promise<void> {
  const repository = new DrizzlePublishedPageRepository();
  const service = new SharePublishingService(repository);

  return service.unpublishPage(input.pageId, userId);
}

export async function getPublishedLinkAction(
  input: unknown
): Promise<PublishedLinkView | null> {
  const parsed = GetPublishedLinkRequestSchema.parse(input);
  const user = await getAuthenticatedUser();

  return getPublishedLinkActionInternal(parsed, user.id);
}

export async function getPublishedLinkActionInternal(
  input: { pageId: string },
  userId: string
): Promise<PublishedLinkView | null> {
  const repository = new DrizzlePublishedPageRepository();

  const queryService = new ShareQueryService(
    repository,
    new DefaultWorkspaceManagementAcl(),
    new CanvasQueryService(
      new DrizzleBlockMountRepository(),
      new DrizzleEdgeRepository(),
      new DrizzleViewportRepository()
    )
  );

  return queryService.getPublishedLink(input.pageId, userId);
}

export async function getPublishedPageAction(
  input: unknown
): Promise<PublishedPageView> {
  const publishToken = z.string().min(1).parse(input);
  return getPublishedPageActionInternal(publishToken);
}

export async function getPublishedPageActionInternal(
  publishToken: string
): Promise<PublishedPageView> {
  const repository = new DrizzlePublishedPageRepository();

  const queryService = new ShareQueryService(
    repository,
    new DefaultWorkspaceManagementAcl(),
    new CanvasQueryService(
      new DrizzleBlockMountRepository(),
      new DrizzleEdgeRepository(),
      new DrizzleViewportRepository()
    )
  );

  return queryService.getPublishedPage(publishToken);
}

export async function getWorkspaceSelectionAction(
  _input?: unknown
): Promise<WorkspaceSelectionView> {
  const user = await getAuthenticatedUser();
  return getWorkspaceSelectionActionInternal(user.id);
}

export async function getWorkspaceSelectionActionInternal(
  userId: string
): Promise<WorkspaceSelectionView> {
  const repository = new DrizzlePublishedPageRepository();
  const service = new ShareCopyService(
    repository,
    new DefaultWorkspaceManagementAcl()
  );

  return service.getWorkspaceSelection(userId);
}

export async function copyPublishedPageAction(
  input: unknown
): Promise<CopyResult> {
  const parsed = CopyPublishedPageRequestSchema.parse(input);
  const user = await getAuthenticatedUser();

  return copyPublishedPageActionInternal(parsed, user.id);
}

export async function copyPublishedPageActionInternal(
  input: CopyPublishedPageRequest,
  userId: string
): Promise<CopyResult> {
  const repository = new DrizzlePublishedPageRepository();
  const service = new ShareCopyService(
    repository,
    new DefaultWorkspaceManagementAcl()
  );

  return service.copyPublishedPage(userId, {
    publishToken: input.publishToken,
    targetWorkspaceId: input.targetWorkspaceId,
  });
}
