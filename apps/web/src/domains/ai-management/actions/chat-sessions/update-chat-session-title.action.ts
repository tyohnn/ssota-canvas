'use server';

import type { ActionResult } from '@/lib';
import { ok, err } from '@/lib';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { UpdateChatSessionTitleRequestSchema } from '../../shared/dtos/requests/chat-session.requests';
import type { UpdateChatSessionTitleRequest } from '../../shared/dtos/requests/chat-session.requests';
import { updateChatSessionTitle as updateChatSessionTitleService } from '../../backend/services/chat-session/update-chat-session-title.service';
import { DrizzleChatSessionRepository } from '../../backend/repositories/implementations/drizzle-chat-session.repository';
import { withChatSessionSecureAction } from './secure-action';

export const updateChatSessionTitle = withChatSessionSecureAction(
  UpdateChatSessionTitleRequestSchema,
  'updateChatSessionTitle',
  updateChatSessionTitleInternal,
  {
    getLogMetadata: req => ({ workspaceId: req.workspaceId, sessionId: req.sessionId }),
  }
);

async function updateChatSessionTitleInternal(
  req: UpdateChatSessionTitleRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<boolean>> {
  const repository = new DrizzleChatSessionRepository();
  const result = await updateChatSessionTitleService(
    {
      sessionId: req.sessionId,
      userId: context.authenticatedUser.id,
      title: req.title,
    },
    repository
  );

  if (result.isError()) {
    return err(result.error.message);
  }

  return ok(true);
}
