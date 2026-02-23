'use server';

import type { ActionResult } from '@/lib';
import { ok, err } from '@/lib';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { SaveChatSessionMessagesRequestSchema } from '../../shared/dtos/requests/chat-session.requests';
import type { SaveChatSessionMessagesRequest } from '../../shared/dtos/requests/chat-session.requests';
import { saveChatSessionMessages as saveChatSessionMessagesService } from '../../backend/services/chat-session/save-chat-session-messages.service';
import { DrizzleChatSessionRepository } from '../../backend/repositories/implementations/drizzle-chat-session.repository';
import { withChatSessionSecureAction } from './secure-action';

export const saveChatSessionMessages = withChatSessionSecureAction(
  SaveChatSessionMessagesRequestSchema,
  'saveChatSessionMessages',
  saveChatSessionMessagesInternal,
  {
    getLogMetadata: req => ({
    workspaceId: req.workspaceId,
    sessionId: req.sessionId,
    appendCount: req.appendMessages.length,
  }),
  }
);

async function saveChatSessionMessagesInternal(
  req: SaveChatSessionMessagesRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<boolean>> {
  const repository = new DrizzleChatSessionRepository();
  const result = await saveChatSessionMessagesService(
    {
      sessionId: req.sessionId,
      userId: context.authenticatedUser.id,
      appendMessages: req.appendMessages,
    },
    repository
  );

  if (result.isError()) {
    return err(result.error.message);
  }

  return ok(true);
}
