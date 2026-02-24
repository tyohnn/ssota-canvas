'use server';

import type { ActionResult } from '@/lib';
import { ok, err } from '@/lib';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { DeleteChatSessionRequestSchema } from '../../shared/dtos/requests/chat-session.requests';
import type { DeleteChatSessionRequest } from '../../shared/dtos/requests/chat-session.requests';
import { deleteChatSession as deleteChatSessionService } from '../../backend/services/chat-session/delete-chat-session.service';
import { DrizzleChatSessionRepository } from '../../backend/repositories/implementations/drizzle-chat-session.repository';
import { withChatSessionSecureAction } from './secure-action';

export const deleteChatSession = withChatSessionSecureAction(
  DeleteChatSessionRequestSchema,
  'deleteChatSession',
  deleteChatSessionInternal,
  {
    getLogMetadata: req => ({ workspaceId: req.workspaceId, sessionId: req.sessionId }),
  }
);

async function deleteChatSessionInternal(
  req: DeleteChatSessionRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<boolean>> {
  const repository = new DrizzleChatSessionRepository();
  const result = await deleteChatSessionService(
    {
      sessionId: req.sessionId,
      userId: context.authenticatedUser.id,
    },
    repository
  );

  if (result.isError()) {
    return err(result.error.message);
  }

  return ok(true);
}
