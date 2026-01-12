// apps/web/src/domains/share/backend/services/get-published-page.ts

import { PublishedPageViewDTO } from '../../shared/dtos';
import { PublishedPageRepository } from '../repositories/interfaces/published-page.repository.interface';
import { ShareManagementError } from '../../shared/errors/share-management.error';
import { PublishToken } from '../../shared/value-objects/publish-token.vo';
import { getPageInfo, getWorkspaceByPageId } from '@/domains/workspace-management/backend/services';
import { PageRepository } from '@/domains/workspace-management/backend/repositories/interfaces/page.repository.interface';
import { WorkspaceRepository } from '@/domains/workspace-management/backend/repositories/interfaces/workspace.repository.interface';
import { CanvasQueryService } from '@/domains/canvas-management/backend/services/canvas-query.service';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

export async function getPublishedPage(
  publishToken: string,
  publishedPageRepository: PublishedPageRepository,
  pageRepository: PageRepository,
  workspaceRepository: WorkspaceRepository,
  canvasQueryService: CanvasQueryService
): Promise<PublishedPageViewDTO> {
  const publishedPage = await publishedPageRepository.findByToken(
    new PublishToken(publishToken)
  );

  if (!publishedPage || publishedPage.status !== 'published') {
    throw new ShareManagementError('PUBLISH_LINK_NOT_FOUND', 'Link not found');
  }

  // Use Workspace Service
  // Use the functional query services from Workspace domain
  const pageInfoResult = await getPageInfo(
    publishedPage.pageId,
    pageRepository
  );
  const pageInfo = pageInfoResult.isSuccess() ? pageInfoResult.value : null;

  const workspaceInfoResult = pageInfo?.workspaceId
    ? await getWorkspaceByPageId(
        publishedPage.pageId,
        pageRepository,
        workspaceRepository
      )
    : null;
  const workspaceInfo = workspaceInfoResult?.isSuccess()
    ? workspaceInfoResult.value
    : null;

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
    title: pageInfo?.title ?? 'Untitled',
    icon: pageInfo?.icon,
    blocks: canvasView.blocks,
    edges: canvasView.edges,
    viewport: canvasView.viewport,
    publishToken: publishedPage.publishToken.toString(),
    status: 'published',
    isReadOnly: true,
    workspaceId: pageInfo?.workspaceId,
    organizationId: workspaceInfo?.organizationId,
  };
}
