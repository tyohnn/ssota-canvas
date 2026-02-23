import { Result } from '@/utils/result';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ChatSessionAggregate } from '../../../shared/aggregates/chat-session.aggregate';
import { ChatSessionId } from '../../../shared/value-objects/chat-session-id.vo';
import type { IChatSessionRepository } from '../../repositories/interfaces/chat-session.repository.interface';
import type { ChatSession } from '../../../shared/entities/chat-session.entity';
import type { UpdateChatSessionTitleParams } from './types';

export async function updateChatSessionTitle(
  params: UpdateChatSessionTitleParams,
  repository: IChatSessionRepository
): Promise<Result<ChatSession, Error>> {
  try {
    const sessionId = new ChatSessionId(params.sessionId);
    const userId = new UserId(params.userId);

    const chatSession = await repository.findById(sessionId, userId);
    if (!chatSession) {
      return Result.error(new Error('Chat session not found'));
    }

    const aggregate = ChatSessionAggregate.reconstitute(chatSession);
    aggregate.updateTitle({
      newTitle: params.title,
      userId,
    });

    await repository.update(aggregate.getChatSession());

    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(e => e.handle()));
    aggregate.markEventsAsCommitted();

    return Result.success(aggregate.getChatSession());
  } catch (error) {
    return Result.error(
      error instanceof Error ? error : new Error('Failed to update chat session title')
    );
  }
}
