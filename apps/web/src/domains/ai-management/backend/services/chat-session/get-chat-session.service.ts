import { Result } from '@/utils/result';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ChatSessionId } from '../../../shared/value-objects/chat-session-id.vo';
import type { IChatSessionRepository } from '../../repositories/interfaces/chat-session.repository.interface';
import type { ChatSession } from '../../../shared/entities/chat-session.entity';
import type { GetChatSessionParams } from './types';

export async function getChatSession(
  params: GetChatSessionParams,
  repository: IChatSessionRepository
): Promise<Result<ChatSession | null, Error>> {
  try {
    const sessionId = new ChatSessionId(params.sessionId);
    const userId = new UserId(params.userId);

    const session = await repository.findById(sessionId, userId);
    return Result.success(session);
  } catch (error) {
    return Result.error(
      error instanceof Error ? error : new Error('Failed to get chat session')
    );
  }
}
