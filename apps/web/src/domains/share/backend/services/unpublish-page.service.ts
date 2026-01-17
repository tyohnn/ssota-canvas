// apps/web/src/domains/share/backend/services/unpublish-page.ts

import { PublishedPageRepository } from '../repositories/interfaces/published-page.repository.interface';
import { ShareManagementError } from '../../shared/errors/share-management.error';

export async function unpublishPage(
  pageId: string,
  userId: string,
  publishedPageRepository: PublishedPageRepository
): Promise<void> {
  const publishedPage = await publishedPageRepository.findByPageId(pageId);

  if (!publishedPage) {
    throw new ShareManagementError('PUBLISH_LINK_NOT_FOUND', 'Link not found');
  }

  if (publishedPage.ownerId !== userId) {
    throw new ShareManagementError('NOT_PAGE_OWNER', 'Not page owner');
  }

  // Soft unpublish: 상태만 변경, 레코드는 유지
  publishedPage.unpublish();
  await publishedPageRepository.save(publishedPage);
}
