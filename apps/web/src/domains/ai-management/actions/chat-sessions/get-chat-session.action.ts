'use server';

import type { ActionResult } from '@/lib';
import { ok, err } from '@/lib';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { GetChatSessionRequestSchema } from '../../shared/dtos/requests/chat-session.requests';
import type { GetChatSessionRequest } from '../../shared/dtos/requests/chat-session.requests';
import type { ChatSessionResponse } from '../../shared/dtos/responses/chat-session.responses';
import { getChatSession as getChatSessionService } from '../../backend/services/chat-session/get-chat-session.service';
import { DrizzleChatSessionRepository } from '../../backend/repositories/implementations/drizzle-chat-session.repository';
import { withChatSessionSecureAction } from './secure-action';

export const getChatSession = withChatSessionSecureAction(
  GetChatSessionRequestSchema,
  'getChatSession',
  getChatSessionInternal,
  {
    getLogMetadata: req => ({ workspaceId: req.workspaceId, sessionId: req.sessionId }),
  }
);

async function getChatSessionInternal(
  req: GetChatSessionRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<ChatSessionResponse | null>> {
  const repository = new DrizzleChatSessionRepository();
  const result = await getChatSessionService(
    {
      sessionId: req.sessionId,
      userId: context.authenticatedUser.id,
    },
    repository
  );

  if (result.isError()) {
    return err(result.error.message);
  }

  const session = result.value;
  if (!session) {
    return ok(null);
  }
  return ok({
    id: session.id.value,
    workspaceId: session.workspaceId.value,
    userId: session.userId.value,
    title: session.title,
    messages: session.messages,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  });
}
