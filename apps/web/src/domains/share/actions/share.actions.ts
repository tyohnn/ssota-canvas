// apps/web/src/domains/share/actions/share.actions.ts
'use server';

import { z } from 'zod';
// import { createClient } from '@/utils/supabase/server';

import {
  PublishPageRequest,
  PublishPageRequestSchema,
  PublishResultDTO,
  PublishedPageViewDTO,
  WorkspaceSelectionViewDTO,
  CopyPublishedPageRequest,
  CopyPublishedPageRequestSchema,
  CopyResultDTO,
  UnpublishPageRequest,
  UnpublishPageRequestSchema,
  PublishedLinkViewDTO,
  GetPublishedLinkRequest,
  GetPublishedLinkRequestSchema,
} from '../shared/dtos';
import { ShareManagementError } from '../shared/errors/share-management.error';
import { PublishToken } from '../shared/value-objects/publish-token.vo';
import { DrizzlePublishedPageRepository } from '../backend/repositories/implementations/drizzle-published-page.repository';
import { publishPage } from '../backend/services/publish-page';
import { unpublishPage } from '../backend/services/unpublish-page';
import { getPublishedLink } from '../backend/services/get-published-link';
import { getPublishedPage } from '../backend/services/get-published-page';
import { getWorkspaceSelection } from '../backend/services/get-workspace-selection';
import { copyPublishedPage } from '../backend/services/copy-published-page';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import {
  getAuthenticatedUser,
} from '@/domains/common/auth/helpers';
import { CanvasQueryService } from '@/domains/canvas-management/backend/services/canvas-query.service';
import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-edge.repository';
import { DrizzleViewportRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-viewport.repository';

export async function publishPageAction(
  input: unknown
): Promise<PublishResultDTO> {
  const parsed = PublishPageRequestSchema.parse(input);
  const user = await getAuthenticatedUser();

  return publishPageActionInternal(parsed, user.id);
}

export async function publishPageActionInternal(
  safeDto: PublishPageRequest,
  requesterId: string
): Promise<PublishResultDTO> {
  const repository = new DrizzlePublishedPageRepository();
  return publishPage(safeDto, requesterId, repository);
}

export async function unpublishPageAction(
  input: unknown
): Promise<void> {
  const parsed = UnpublishPageRequestSchema.parse(input);
  const user = await getAuthenticatedUser();

  return unpublishPageActionInternal(parsed, user.id);
}

export async function unpublishPageActionInternal(
  safeDto: UnpublishPageRequest,
  userId: string
): Promise<void> {
  const repository = new DrizzlePublishedPageRepository();
  return unpublishPage(safeDto.pageId, userId, repository);
}

export async function getPublishedLinkAction(
  input: unknown
): Promise<PublishedLinkViewDTO | null> {
  const parsed = GetPublishedLinkRequestSchema.parse(input);
  const user = await getAuthenticatedUser();

  return getPublishedLinkActionInternal(parsed, user.id);
}

export async function getPublishedLinkActionInternal(
  safeDto: GetPublishedLinkRequest,
  userId: string
): Promise<PublishedLinkViewDTO | null> {
  const repository = new DrizzlePublishedPageRepository();
  return getPublishedLink(safeDto, userId, repository);
}

export async function getPublishedPageAction(
  input: unknown
): Promise<PublishedPageViewDTO> {
  const publishToken = z.string().min(1).parse(input);
  return getPublishedPageActionInternal(publishToken);
}

export async function getPublishedPageActionInternal(
  publishToken: string
): Promise<PublishedPageViewDTO> {
  const repository = new DrizzlePublishedPageRepository();
  const pageRepository = new DrizzlePageRepository();
  const workspaceRepository = new DrizzleWorkspaceRepository();
  const canvasQueryService = new CanvasQueryService(
    new DrizzleBlockMountRepository(),
    new DrizzleEdgeRepository(),
    new DrizzleViewportRepository()
  );

  return getPublishedPage(
    publishToken,
    repository,
    pageRepository,
    workspaceRepository,
    canvasQueryService
  );
}

export async function getWorkspaceSelectionAction(
  _input?: unknown
): Promise<WorkspaceSelectionViewDTO> {
  const user = await getAuthenticatedUser();
  return getWorkspaceSelectionActionInternal(user.id);
}

export async function getWorkspaceSelectionActionInternal(
  userId: string
): Promise<WorkspaceSelectionViewDTO> {
  return getWorkspaceSelection(userId, new DrizzleWorkspaceRepository());
}

export async function copyPublishedPageAction(
  input: unknown
): Promise<CopyResultDTO> {
  const parsed = CopyPublishedPageRequestSchema.parse(input);
  const user = await getAuthenticatedUser();

  return copyPublishedPageActionInternal(parsed, user.id);
}

export async function copyPublishedPageActionInternal(
  safeDto: CopyPublishedPageRequest,
  userId: string
): Promise<CopyResultDTO> {
  const repository = new DrizzlePublishedPageRepository();
  return copyPublishedPage(userId, safeDto, repository);
}
