import { Result } from '@/utils/result';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ChatSessionAggregate } from '../../../shared/aggregates/chat-session.aggregate';
import { ChatSessionId } from '../../../shared/value-objects/chat-session-id.vo';
import type { IChatSessionRepository } from '../../repositories/interfaces/chat-session.repository.interface';
import type { DeleteChatSessionParams } from './types';

export async function deleteChatSession(
  params: DeleteChatSessionParams,
  repository: IChatSessionRepository
): Promise<Result<void, Error>> {
  try {
    const sessionId = new ChatSessionId(params.sessionId);
    const userId = new UserId(params.userId);

    const chatSession = await repository.findById(sessionId, userId);
    if (!chatSession) {
      return Result.error(new Error('Chat session not found'));
    }

    const aggregate = ChatSessionAggregate.reconstitute(chatSession);
    aggregate.delete({ userId });

    await repository.delete(sessionId, userId);

    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(e => e.handle()));
    aggregate.markEventsAsCommitted();

    return Result.success(undefined);
  } catch (error) {
    return Result.error(
      error instanceof Error ? error : new Error('Failed to delete chat session')
    );
  }
}
