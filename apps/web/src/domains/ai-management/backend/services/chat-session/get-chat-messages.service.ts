import { Result } from '@/utils/result';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ChatSessionId } from '../../../shared/value-objects/chat-session-id.vo';
import type { IChatSessionRepository } from '../../repositories/interfaces/chat-session.repository.interface';
import type { IChatMessageRepository } from '../../repositories/interfaces/chat-message.repository.interface';
import type { GetChatMessagesResponse } from '../../../shared/dtos/responses/chat-session.responses';
import type { GetChatMessagesParams } from './types';

export async function getChatMessages(
  params: GetChatMessagesParams,
  sessionRepository: IChatSessionRepository,
  messageRepository: IChatMessageRepository
): Promise<Result<GetChatMessagesResponse, Error>> {
  try {
    const sessionId = new ChatSessionId(params.sessionId);
    const userId = new UserId(params.userId);

    const session = await sessionRepository.findById(sessionId, userId);
    if (!session) {
      return Result.error(new Error('Chat session not found'));
    }

    const paginated = await messageRepository.findBySessionIdPaginated(
      sessionId,
      {
        limit: params.limit,
        beforeIndex: params.beforeIndex,
      }
    );
    const uiMessages = paginated.messages.map((m) => ({
      id: m.id.value,
      role: m.role,
      parts: m.parts,
    }));
    const minLoadedIndex =
      paginated.messages.length > 0
        ? Math.min(...paginated.messages.map((m) => m.index))
        : undefined;

    return Result.success({
      messages: uiMessages,
      hasMore: paginated.hasMore,
      minLoadedIndex,
    });
  } catch (error) {
    return Result.error(
      error instanceof Error ? error : new Error('Failed to get chat messages')
    );
  }
}
