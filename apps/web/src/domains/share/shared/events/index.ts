// apps/web/src/domains/share/shared/events/index.ts

import { PageId, UserId, WorkspaceId } from '../types';

export class PagePublishedEvent {
  readonly type = 'PagePublished';

  constructor(
    public readonly pageId: PageId,
    public readonly ownerId: UserId,
    public readonly publishToken: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class PublishLinkGeneratedEvent {
  readonly type = 'PublishLinkGenerated';

  constructor(
    public readonly pageId: PageId,
    public readonly publishToken: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class PublishLinkAccessedEvent {
  readonly type = 'PublishLinkAccessed';

  constructor(
    public readonly publishToken: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class PageCopyAttemptedEvent {
  readonly type = 'PageCopyAttempted';

  constructor(
    public readonly publishToken: string,
    public readonly requesterId?: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class MembershipStatusCheckedEvent {
  readonly type = 'MembershipStatusChecked';

  constructor(
    public readonly requesterId?: UserId,
    public readonly isMember: boolean,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class LoginRequiredEvent {
  readonly type = 'LoginRequired';

  constructor(public readonly timestamp: Date = new Date()) {}
}

export class WorkspaceListLoadedEvent {
  readonly type = 'WorkspaceListLoaded';

  constructor(
    public readonly requesterId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class WorkspaceSelectedEvent {
  readonly type = 'WorkspaceSelected';

  constructor(
    public readonly workspaceId: WorkspaceId,
    public readonly requesterId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class PageCopiedEvent {
  readonly type = 'PageCopied';

  constructor(
    public readonly publishToken: string,
    public readonly workspaceId: WorkspaceId,
    public readonly requesterId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class PageCopyFailedEvent {
  readonly type = 'PageCopyFailed';

  constructor(
    public readonly publishToken: string,
    public readonly reason: string,
    public readonly timestamp: Date = new Date()
  ) {}
}
