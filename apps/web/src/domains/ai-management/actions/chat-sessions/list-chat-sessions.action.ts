'use server';

import type { ActionResult } from '@/lib';
import { ok, err } from '@/lib';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { ListChatSessionsRequestSchema } from '../../shared/dtos/requests/chat-session.requests';
import type { ListChatSessionsRequest } from '../../shared/dtos/requests/chat-session.requests';
import type { ChatSessionListItem } from '../../shared/dtos/responses/chat-session.responses';
import { listChatSessions as listChatSessionsService } from '../../backend/services/chat-session/list-chat-sessions.service';
import { DrizzleChatSessionRepository } from '../../backend/repositories/implementations/drizzle-chat-session.repository';
import { withChatSessionSecureAction } from './secure-action';

export const listChatSessions = withChatSessionSecureAction(
  ListChatSessionsRequestSchema,
  'listChatSessions',
  listChatSessionsInternal,
  {
    getLogMetadata: req => ({ workspaceId: req.workspaceId }),
  }
);

async function listChatSessionsInternal(
  req: ListChatSessionsRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<ChatSessionListItem[]>> {
  const repository = new DrizzleChatSessionRepository();
  const result = await listChatSessionsService(
    {
      workspaceId: req.workspaceId,
      userId: context.authenticatedUser.id,
    },
    repository
  );

  if (result.isError()) {
    return err(result.error.message);
  }

  return ok(
    result.value.map(s => ({
      id: s.id.value,
      title: s.title,
      updatedAt: s.updatedAt,
      createdAt: s.createdAt,
    }))
  );
}
