// apps/web/src/domains/share/shared/commands/index.ts

import { PageId, UserId, WorkspaceId } from '../types';

export interface PublishPageCommand {
  pageId: PageId;
  requesterId: UserId;
}

export interface AccessPublishLinkCommand {
  publishToken: string;
}

export interface AttemptCopyPageCommand {
  publishToken: string;
  requesterId?: UserId;
}

export interface ExecuteCopyPageCommand {
  publishToken: string;
  targetWorkspaceId: WorkspaceId;
  requesterId: UserId;
}
