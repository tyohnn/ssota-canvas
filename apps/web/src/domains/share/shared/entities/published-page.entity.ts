// apps/web/src/domains/share/shared/entities/published-page.entity.ts

import { PublishToken } from '../value-objects/publish-token.vo';
import { PageId, PublishedStatus, UserId } from '../types';

export class PublishedPage {
  constructor(
    public readonly pageId: PageId,
    public readonly ownerId: UserId,
    public status: PublishedStatus,
    public publishToken: PublishToken,
    public publishedAt: Date
  ) {}

  publish(token: PublishToken, publishedAt: Date): void {
    this.status = 'published';
    this.publishToken = token;
    this.publishedAt = publishedAt;
  }

  canPublishBy(userId: UserId): boolean {
    return this.ownerId === userId;
  }
}
