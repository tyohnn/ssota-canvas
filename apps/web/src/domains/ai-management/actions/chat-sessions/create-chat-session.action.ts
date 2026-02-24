'use server';

import type { ActionResult } from '@/lib';
import { ok, err } from '@/lib';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { CreateChatSessionRequestSchema } from '../../shared/dtos/requests/chat-session.requests';
import type { CreateChatSessionRequest } from '../../shared/dtos/requests/chat-session.requests';
import type { CreateChatSessionResponse } from '../../shared/dtos/responses/chat-session.responses';
import { createChatSession as createChatSessionService } from '../../backend/services/chat-session/create-chat-session.service';
import { DrizzleChatSessionRepository } from '../../backend/repositories/implementations/drizzle-chat-session.repository';
import { withChatSessionSecureAction } from './secure-action';

/**
 * Chat session 생성 Server Action
 *
 * ⚠️ Security: withChatSessionSecureAction HOF를 통해 Defense in Depth 적용
 */
export const createChatSession = withChatSessionSecureAction(
  CreateChatSessionRequestSchema,
  'createChatSession',
  createChatSessionInternal,
  {
    getLogMetadata: req => ({ workspaceId: req.workspaceId }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * @param req - 검증된 요청
 * @param context - 검증된 context (workspace owner)
 */
async function createChatSessionInternal(
  req: CreateChatSessionRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<CreateChatSessionResponse>> {
  const repository = new DrizzleChatSessionRepository();
  const result = await createChatSessionService(
    {
      workspaceId: req.workspaceId,
      userId: context.authenticatedUser.id,
    },
    repository
  );

  if (result.isError()) {
    return err(result.error.message);
  }

  return ok({ sessionId: result.value.id.value });
}
