// apps/web/src/domains/share/shared/commands/index.ts

import { PageId, UserId, WorkspaceId } from '../types';
import { PublishToken } from '../value-objects/publish-token.vo';

export interface PublishPageCommand {
  pageId: PageId;
  requesterId: UserId;
}

export interface ExecuteCopyPageCommand {
  publishToken: PublishToken;
  targetWorkspaceId: WorkspaceId;
  requesterId: UserId;
}
