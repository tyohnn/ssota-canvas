// apps/web/src/domains/share/shared/events/index.ts

import { PageId, UserId, WorkspaceId } from '../types';
import { PublishToken } from '../value-objects/publish-token.vo';

/**
 * 페이지가 게시되었을 때 발생하는 이벤트
 * (게시 = 링크 생성이므로 PublishLinkGeneratedEvent와 통합)
 */
export class PagePublishedEvent {
  readonly type = 'PagePublished';

  constructor(
    public readonly pageId: PageId,
    public readonly ownerId: UserId,
    public readonly publishToken: PublishToken,
    public readonly publishedAt: Date,
    public readonly timestamp: Date = new Date()
  ) { }
}

export class PublishLinkAccessedEvent {
  readonly type = 'PublishLinkAccessed';

  constructor(
    public readonly publishToken: PublishToken,
    public readonly timestamp: Date = new Date()
  ) { }
}

export class PageCopiedEvent {
  readonly type = 'PageCopied';

  constructor(
    public readonly copiedPageId: PageId,
    public readonly publishToken: PublishToken,
    public readonly workspaceId: WorkspaceId,
    public readonly requesterId: UserId,
    public readonly timestamp: Date = new Date()
  ) { }
}

export class PageCopyFailedEvent {
  readonly type = 'PageCopyFailed';

  constructor(
    public readonly publishToken: PublishToken,
    public readonly reason: string,
    public readonly timestamp: Date = new Date()
  ) { }
}
