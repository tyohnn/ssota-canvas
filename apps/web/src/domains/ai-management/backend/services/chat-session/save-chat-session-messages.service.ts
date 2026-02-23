import { Result } from '@/utils/result';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ChatSessionId } from '../../../shared/value-objects/chat-session-id.vo';
import { ChatSessionMessagesUpdatedEvent } from '../../../shared/events/chat-session/chat-session.events';
import type { IChatSessionRepository } from '../../repositories/interfaces/chat-session.repository.interface';
import type { IChatMessageRepository } from '../../repositories/interfaces/chat-message.repository.interface';
import type { ChatSession } from '../../../shared/entities/chat-session.entity';
import type { SaveChatSessionMessagesParams } from './types';

export async function saveChatSessionMessages(
  params: SaveChatSessionMessagesParams,
  sessionRepository: IChatSessionRepository,
  messageRepository: IChatMessageRepository
): Promise<Result<ChatSession, Error>> {
  try {
    const sessionId = new ChatSessionId(params.sessionId);
    const userId = new UserId(params.userId);

    const chatSession = await sessionRepository.findById(sessionId, userId);
    if (!chatSession) {
      return Result.error(new Error('Chat session not found'));
    }

    const existingMessages = await messageRepository.findBySessionId(sessionId);
    const baseIndex = existingMessages.length;

    const appendMessages = params.appendMessages as Array<{
      id?: string;
      role: string;
      parts?: unknown[];
    }>;
    if (appendMessages.length === 0) {
      return Result.success(chatSession);
    }

    await messageRepository.insertMany(sessionId, appendMessages, baseIndex);

    chatSession.updatedAt = new Date();
    await sessionRepository.update(chatSession);

    const event = new ChatSessionMessagesUpdatedEvent(
      sessionId,
      { chatSessionId: sessionId, messageCount: appendMessages.length },
      chatSession.updatedAt
    );
    await event.handle();

    return Result.success(chatSession);
  } catch (error) {
    return Result.error(
      error instanceof Error
        ? error
        : new Error('Failed to save chat session messages')
    );
  }
}
