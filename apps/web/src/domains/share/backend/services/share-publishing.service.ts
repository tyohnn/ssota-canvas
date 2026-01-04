// apps/web/src/domains/share/backend/services/share-publishing.service.ts

import { PublishPageCommand } from '../../shared/commands';
import { PublishResult } from '../../shared/dtos';
import { PublishedPageAggregate } from '../../shared/aggregates/published-page.aggregate';
import { PublishedPageRepository } from '../repositories/published-page.repository';

export class SharePublishingService {
  constructor(private readonly publishedPageRepository: PublishedPageRepository) {}

  async publishPage(command: PublishPageCommand): Promise<PublishResult> {
    const aggregate = new PublishedPageAggregate();
    const publishedPage = aggregate.publish(command);

    await this.publishedPageRepository.save(publishedPage);

    const publishToken = publishedPage.publishToken.toString();
    return {
      pageId: publishedPage.pageId,
      publishToken,
      publishUrl: `/p/${publishToken}`,
      publishedAt: publishedPage.publishedAt.toISOString(),
    };
  }
}
