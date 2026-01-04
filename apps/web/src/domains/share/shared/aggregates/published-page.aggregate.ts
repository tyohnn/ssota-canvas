// apps/web/src/domains/share/shared/aggregates/published-page.aggregate.ts

import { PublishPageCommand } from '../commands';
import { PublishedPage } from '../entities/published-page.entity';
import {
  PagePublishedEvent,
  PublishLinkAccessedEvent,
  PublishLinkGeneratedEvent,
} from '../events';
import { PublishToken } from '../value-objects/publish-token.vo';
import { ShareManagementError } from '../errors/share-management.error';

export class PublishedPageAggregate {
  private readonly events: Array<
    PagePublishedEvent | PublishLinkGeneratedEvent | PublishLinkAccessedEvent
  > = [];

  publish(command: PublishPageCommand): PublishedPage {
    if (!command.requesterId) {
      throw new ShareManagementError('NOT_PAGE_OWNER', 'Missing requester');
    }

    const token = this.generateToken();
    const publishedPage = new PublishedPage(
      command.pageId,
      command.requesterId,
      'published',
      token,
      new Date()
    );

    this.events.push(
      new PagePublishedEvent(command.pageId, command.requesterId, token.toString())
    );
    this.events.push(new PublishLinkGeneratedEvent(command.pageId, token.toString()));

    return publishedPage;
  }

  recordAccess(publishToken: PublishToken): void {
    this.events.push(new PublishLinkAccessedEvent(publishToken.toString()));
  }

  getUncommittedEvents(): Array<
    PagePublishedEvent | PublishLinkGeneratedEvent | PublishLinkAccessedEvent
  > {
    return [...this.events];
  }

  private generateToken(): PublishToken {
    const uuid = crypto.randomUUID();
    const encoded = Buffer.from(uuid).toString('base64');
    return new PublishToken(encoded);
  }
}
