// apps/web/src/domains/share/backend/services/get-published-link.ts

import { GetPublishedLinkRequest, PublishedLinkViewDTO } from '../../shared/dtos';
import { PublishedPageRepository } from '../repositories/interfaces/published-page.repository.interface';
import { ShareManagementError } from '../../shared/errors/share-management.error';

export async function getPublishedLink(
  safeDto: GetPublishedLinkRequest,
  userId: string,
  publishedPageRepository: PublishedPageRepository
): Promise<PublishedLinkViewDTO | null> {
  const publishedPage = await publishedPageRepository.findByPageId(safeDto.pageId);

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
