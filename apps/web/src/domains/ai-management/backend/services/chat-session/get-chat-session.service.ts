import { Result } from '@/utils/result';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ChatSessionId } from '../../../shared/value-objects/chat-session-id.vo';
import type { IChatSessionRepository } from '../../repositories/interfaces/chat-session.repository.interface';
import type { IChatMessageRepository } from '../../repositories/interfaces/chat-message.repository.interface';
import type { ChatSessionResponse } from '../../../shared/dtos/responses/chat-session.responses';
import type { GetChatSessionParams } from './types';

export async function getChatSession(
  params: GetChatSessionParams,
  sessionRepository: IChatSessionRepository,
  messageRepository: IChatMessageRepository
): Promise<Result<ChatSessionResponse | null, Error>> {
  try {
    const sessionId = new ChatSessionId(params.sessionId);
    const userId = new UserId(params.userId);

    const session = await sessionRepository.findById(sessionId, userId);
    if (!session) {
      return Result.success(null);
    }

    const messages = await messageRepository.findBySessionId(sessionId);
    const uiMessages = messages.map((m) => ({
      id: m.id.value,
      role: m.role,
      parts: m.parts,
    }));

    const response: ChatSessionResponse = {
      id: session.id.value,
      workspaceId: session.workspaceId.value,
      userId: session.userId.value,
      title: session.title,
      messages: uiMessages,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };

    return Result.success(response);
  } catch (error) {
    return Result.error(
      error instanceof Error ? error : new Error('Failed to get chat session')
    );
  }
}
