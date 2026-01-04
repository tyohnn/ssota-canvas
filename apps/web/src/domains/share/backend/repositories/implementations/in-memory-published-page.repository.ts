// apps/web/src/domains/share/backend/repositories/implementations/in-memory-published-page.repository.ts

import { PublishedPageRepository } from '../published-page.repository';
import { PublishedPage } from '../../../shared/entities/published-page.entity';
import { PageId } from '../../../shared/types';
import { PublishToken } from '../../../shared/value-objects/publish-token.vo';

export class InMemoryPublishedPageRepository implements PublishedPageRepository {
  private static byPageId = new Map<string, PublishedPage>();
  private static byToken = new Map<string, PublishedPage>();

  async save(publishedPage: PublishedPage): Promise<void> {
    InMemoryPublishedPageRepository.byPageId.set(
      publishedPage.pageId,
      publishedPage
    );
    InMemoryPublishedPageRepository.byToken.set(
      publishedPage.publishToken.toString(),
      publishedPage
    );
  }

  async findByPageId(pageId: PageId): Promise<PublishedPage | null> {
    return InMemoryPublishedPageRepository.byPageId.get(pageId) ?? null;
  }

  async findByToken(publishToken: PublishToken): Promise<PublishedPage | null> {
    return (
      InMemoryPublishedPageRepository.byToken.get(publishToken.toString()) ??
      null
    );
  }
}
