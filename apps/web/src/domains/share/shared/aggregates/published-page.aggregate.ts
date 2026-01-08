// apps/web/src/domains/share/shared/aggregates/published-page.aggregate.ts

import { PublishPageCommand } from '../commands';
import { PublishedPage } from '../entities/published-page.entity';
import {
  PagePublishedEvent,
  PublishLinkAccessedEvent,
} from '../events';
import { PublishToken } from '../value-objects/publish-token.vo';
import { ShareManagementError } from '../errors/share-management.error';

export class PublishedPageAggregate {
  private readonly events: Array<
    PagePublishedEvent | PublishLinkAccessedEvent
  > = [];

  publish(command: PublishPageCommand): PublishedPage {
    if (!command.requesterId) {
      throw new ShareManagementError('NOT_PAGE_OWNER', 'Missing requester');
    }

    const token = this.generateToken();
    const publishedAt = new Date();

    // Entity 생성
    const publishedPage = new PublishedPage(
      command.pageId,
      command.requesterId,
      'published',
      token,
      publishedAt
    );

    // Entity 값을 사용하여 이벤트 생성 (Command 값이 아님)
    this.events.push(
      new PagePublishedEvent(
        publishedPage.pageId,
        publishedPage.ownerId,
        publishedPage.publishToken,
        publishedPage.publishedAt
      )
    );

    return publishedPage;
  }

  recordAccess(publishToken: PublishToken): void {
    this.events.push(new PublishLinkAccessedEvent(publishToken));
  }

  getUncommittedEvents(): Array<
    PagePublishedEvent | PublishLinkAccessedEvent
  > {
    return [...this.events];
  }

  markEventsAsCommitted(): void {
    this.events.length = 0;
  }

  private generateToken(): PublishToken {
    const uuid = crypto.randomUUID();
    const encoded = Buffer.from(uuid).toString('base64');
    return new PublishToken(encoded);
  }
}
