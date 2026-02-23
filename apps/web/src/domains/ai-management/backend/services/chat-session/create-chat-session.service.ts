import { Result } from '@/utils/result';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { ChatSessionAggregate } from '../../../shared/aggregates/chat-session.aggregate';
import { ChatSessionId } from '../../../shared/value-objects/chat-session-id.vo';
import type { IChatSessionRepository } from '../../repositories/interfaces/chat-session.repository.interface';
import type { ChatSession } from '../../../shared/entities/chat-session.entity';
import type { CreateChatSessionParams } from './types';

export async function createChatSession(
  params: CreateChatSessionParams,
  repository: IChatSessionRepository
): Promise<Result<ChatSession, Error>> {
  try {
    const chatSessionId = ChatSessionId.generate();
    const workspaceId = new WorkspaceId(params.workspaceId);
    const userId = new UserId(params.userId);

    const aggregate = ChatSessionAggregate.create({
      chatSessionId,
      workspaceId,
      userId,
    });

    await repository.create(aggregate.getChatSession());

    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(e => e.handle()));
    aggregate.markEventsAsCommitted();

    return Result.success(aggregate.getChatSession());
  } catch (error) {
    return Result.error(
      error instanceof Error ? error : new Error('Failed to create chat session')
    );
  }
}
