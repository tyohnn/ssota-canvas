// apps/web/src/domains/share/actions/share.actions.ts
'use server';

import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';

import {
  PublishPageRequest,
  PublishResult,
  PublishedPageView,
  WorkspaceSelectionView,
  CopyPublishedPageRequest,
  CopyResult,
  UnpublishPageRequest,
  PublishedLinkView,
} from '../shared/dtos';
import { ShareManagementError } from '../shared/errors/share-management.error';
import { PublishToken } from '../shared/value-objects/publish-token.vo';
import { SupabasePublishedPageRepository } from '../backend/repositories/implementations/supabase-published-page.repository';
import { SupabaseCopyWorkflowRepository } from '../backend/repositories/implementations/supabase-copy-workflow.repository';
import { SharePublishingService } from '../backend/services/share-publishing.service';
import { ShareCopyService } from '../backend/services/share-copy.service';
import { DefaultAuthDomainAcl } from '../backend/acl/implementations/default-auth-domain.acl';
import { DefaultWorkspaceManagementAcl } from '../backend/acl/implementations/default-workspace-management.acl';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { CanvasQueryService } from '@/domains/canvas-management/backend/services/canvas-query.service';
import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-edge.repository';
import { DrizzleViewportRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-viewport.repository';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { supabaseAdmin } from '@/utils/supabase/server';

const publishPageSchema = z.object({
  pageId: z.string().min(1),
});

const copyPublishedPageSchema = z.object({
  publishToken: z.string().min(1),
  targetWorkspaceId: z.string().min(1),
});

const unpublishPageSchema = z.object({
  pageId: z.string().min(1),
});

const publishedLinkSchema = z.object({
  pageId: z.string().min(1),
});

export async function publishPageAction(
  input: PublishPageRequest
): Promise<PublishResult> {
  const parsed = publishPageSchema.parse(input);

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ShareManagementError('LOGIN_REQUIRED', 'Login required');
  }

  const repository = new SupabasePublishedPageRepository(supabase as any);
  const service = new SharePublishingService(repository);

  return service.publishPage({
    pageId: parsed.pageId,
    requesterId: user.id,
  });
}

export async function unpublishPageAction(
  input: UnpublishPageRequest
): Promise<void> {
  const parsed = unpublishPageSchema.parse(input);

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ShareManagementError('LOGIN_REQUIRED', 'Login required');
  }

  const repository = new SupabasePublishedPageRepository(supabase as any);
  const publishedPage = await repository.findByPageId(parsed.pageId);

  if (!publishedPage) {
    throw new ShareManagementError('PUBLISH_LINK_NOT_FOUND', 'Link not found');
  }

  if (publishedPage.ownerId !== user.id) {
    throw new ShareManagementError('NOT_PAGE_OWNER', 'Not page owner');
  }

  const { error: deleteError } = await supabaseAdmin
    .from('published_pages')
    .delete()
    .eq('page_id', parsed.pageId);

  if (deleteError) {
    throw new ShareManagementError('PUBLISH_LINK_NOT_FOUND', deleteError.message);
  }
}

export async function getPublishedLinkAction(
  input: { pageId: string }
): Promise<PublishedLinkView | null> {
  const parsed = publishedLinkSchema.parse(input);

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ShareManagementError('LOGIN_REQUIRED', 'Login required');
  }

  const repository = new SupabasePublishedPageRepository(supabase as any);
  const publishedPage = await repository.findByPageId(parsed.pageId);

  if (!publishedPage) {
    return null;
  }

  if (publishedPage.ownerId !== user.id) {
    throw new ShareManagementError('NOT_PAGE_OWNER', 'Not page owner');
  }

  const publishToken = publishedPage.publishToken.toString();
  return {
    pageId: publishedPage.pageId,
    publishToken,
    publishUrl: `/p/${publishToken}`,
    publishedAt: publishedPage.publishedAt.toISOString(),
  };
}

export async function getPublishedPageAction(
  publishToken: string
): Promise<PublishedPageView> {
  const supabase = await createClient();
  const repository = new SupabasePublishedPageRepository(supabase as any);
  const publishedPage = await repository.findByToken(
    new PublishToken(publishToken)
  );

  if (!publishedPage) {
    throw new ShareManagementError('PUBLISH_LINK_NOT_FOUND', 'Link not found');
  }

  const pageRepository = new DrizzlePageRepository();
  const page = await pageRepository.findById(new PageId(publishedPage.pageId));
  const workspaceRepository = new DrizzleWorkspaceRepository();
  const workspace = page?.workspaceId
    ? await workspaceRepository.findById(new WorkspaceId(page.workspaceId.value))
    : null;

  const canvasQueryService = new CanvasQueryService(
    new DrizzleBlockMountRepository(),
    new DrizzleEdgeRepository(),
    new DrizzleViewportRepository()
  );

  const canvasResult = await canvasQueryService.getCanvasView(
    new PageId(publishedPage.pageId),
    new UserId(publishedPage.ownerId)
  );

  if (canvasResult.isError()) {
    throw new ShareManagementError(
      'PUBLISH_LINK_NOT_FOUND',
      'Failed to load published page'
    );
  }

  const canvasView = canvasResult.value;

  return {
    pageId: publishedPage.pageId,
    title: page?.title ?? 'Untitled',
    icon: page?.icon ?? undefined,
    blocks: canvasView.blocks,
    edges: canvasView.edges,
    viewport: canvasView.viewport,
    publishToken: publishedPage.publishToken.toString(),
    status: 'published',
    isReadOnly: true,
    workspaceId: page?.workspaceId.value,
    organizationId: workspace?.organizationId.value,
  };
}

export async function getWorkspaceSelectionAction(): Promise<WorkspaceSelectionView> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ShareManagementError('LOGIN_REQUIRED', 'Login required');
  }

  const repository = new SupabasePublishedPageRepository(supabase as any);
  const workflowRepository = new SupabaseCopyWorkflowRepository(supabase as any);
  const service = new ShareCopyService(
    repository,
    workflowRepository,
    new DefaultAuthDomainAcl(),
    new DefaultWorkspaceManagementAcl()
  );

  return service.getWorkspaceSelection(user.id);
}

export async function copyPublishedPageAction(
  input: CopyPublishedPageRequest
): Promise<CopyResult> {
  const parsed = copyPublishedPageSchema.parse(input);

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ShareManagementError('LOGIN_REQUIRED', 'Login required');
  }

  const repository = new SupabasePublishedPageRepository(supabase as any);
  const workflowRepository = new SupabaseCopyWorkflowRepository(supabase as any);
  const service = new ShareCopyService(
    repository,
    workflowRepository,
    new DefaultAuthDomainAcl(),
    new DefaultWorkspaceManagementAcl()
  );

  return service.copyPublishedPage(user.id, {
    publishToken: parsed.publishToken,
    targetWorkspaceId: parsed.targetWorkspaceId,
  });
}
