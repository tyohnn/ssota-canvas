import { PublishedPageRepository } from '../repositories/interfaces/published-page.repository.interface';
import { PublishedLinkView, PublishedPageView } from '../../shared/dtos';
import { ShareManagementError } from '../../shared/errors/share-management.error';
import { PublishToken } from '../../shared/value-objects/publish-token.vo';
import { WorkspaceManagementAcl } from './workspace-management.acl';
import { CanvasQueryService } from '@/domains/canvas-management/backend/services/canvas-query.service';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

export class ShareQueryService {
  constructor(
    private readonly publishedPageRepository: PublishedPageRepository,
    private readonly workspaceManagementAcl: WorkspaceManagementAcl,
    private readonly canvasQueryService: CanvasQueryService
  ) { }

  async getPublishedLink(pageId: string, userId: string): Promise<PublishedLinkView | null> {
    const publishedPage = await this.publishedPageRepository.findByPageId(pageId);

    if (!publishedPage || publishedPage.status !== 'published') {
      return null;
    }

    if (publishedPage.ownerId !== userId) {
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

  async getPublishedPage(publishToken: string): Promise<PublishedPageView> {
    const publishedPage = await this.publishedPageRepository.findByToken(
      new PublishToken(publishToken)
    );

    if (!publishedPage || publishedPage.status !== 'published') {
      throw new ShareManagementError('PUBLISH_LINK_NOT_FOUND', 'Link not found');
    }

    // Use ACL instead of direct repository access
    const pageInfo = await this.workspaceManagementAcl.getPageInfo(publishedPage.pageId);
    const workspaceInfo = pageInfo?.workspaceId
      ? await this.workspaceManagementAcl.getWorkspaceInfo(pageInfo.workspaceId)
      : null;

    const canvasResult = await this.canvasQueryService.getCanvasView(
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
}
