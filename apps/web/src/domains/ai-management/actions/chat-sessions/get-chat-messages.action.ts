'use server';

import type { ActionResult } from '@/lib';
import { ok, err } from '@/lib';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { GetChatMessagesRequestSchema } from '../../shared/dtos/requests/chat-session.requests';
import type { GetChatMessagesRequest } from '../../shared/dtos/requests/chat-session.requests';
import type { GetChatMessagesResponse } from '../../shared/dtos/responses/chat-session.responses';
import { getChatMessages as getChatMessagesService } from '../../backend/services/chat-session/get-chat-messages.service';
import { DrizzleChatSessionRepository } from '../../backend/repositories/implementations/drizzle-chat-session.repository';
import { DrizzleChatMessageRepository } from '../../backend/repositories/implementations/drizzle-chat-message.repository';
import { withChatSessionSecureAction } from './secure-action';

export const getChatMessages = withChatSessionSecureAction(
  GetChatMessagesRequestSchema,
  'getChatMessages',
  getChatMessagesInternal,
  {
    getLogMetadata: (req) => ({
      workspaceId: req.workspaceId,
      sessionId: req.sessionId,
      beforeIndex: req.beforeIndex,
    }),
  }
);

async function getChatMessagesInternal(
  req: GetChatMessagesRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<GetChatMessagesResponse>> {
  const sessionRepository = new DrizzleChatSessionRepository();
  const messageRepository = new DrizzleChatMessageRepository();
  const result = await getChatMessagesService(
    {
      sessionId: req.sessionId,
      userId: context.authenticatedUser.id,
      limit: req.limit,
      beforeIndex: req.beforeIndex,
    },
    sessionRepository,
    messageRepository
  );

  if (result.isError()) {
    return err(result.error.message);
  }

  return ok(result.value);
}
