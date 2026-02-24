import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { ChatSessionId } from '../../value-objects/chat-session-id.vo';
import type { DomainEvent } from '../domain-event';

/**
 * Chat session created event
 */
export class ChatSessionCreatedEvent implements DomainEvent {
  readonly type = 'ChatSessionCreated';

  constructor(
    public readonly aggregateId: ChatSessionId,
    public readonly data: {
      chatSessionId: ChatSessionId;
      workspaceId: WorkspaceId;
      userId: UserId;
      title: string;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(context?: unknown): Promise<void> {
    // Future: Add event log policy, analytics, notifications
    await Promise.allSettled([]);
  }
}

/**
 * Chat session title updated event
 */
export class ChatSessionTitleUpdatedEvent implements DomainEvent {
  readonly type = 'ChatSessionTitleUpdated';

  constructor(
    public readonly aggregateId: ChatSessionId,
    public readonly data: {
      chatSessionId: ChatSessionId;
      previousTitle: string;
      newTitle: string;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(context?: unknown): Promise<void> {
    // Future: Add event log policy
    await Promise.allSettled([]);
  }
}

/**
 * Chat session messages updated event
 */
export class ChatSessionMessagesUpdatedEvent implements DomainEvent {
  readonly type = 'ChatSessionMessagesUpdated';

  constructor(
    public readonly aggregateId: ChatSessionId,
    public readonly data: {
      chatSessionId: ChatSessionId;
      messageCount: number;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(context?: unknown): Promise<void> {
    // Future: Add event log policy, analytics
    await Promise.allSettled([]);
  }
}

/**
 * Chat session deleted event
 */
export class ChatSessionDeletedEvent implements DomainEvent {
  readonly type = 'ChatSessionDeleted';

  constructor(
    public readonly aggregateId: ChatSessionId,
    public readonly data: {
      chatSessionId: ChatSessionId;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(context?: unknown): Promise<void> {
    // Future: Add event log policy, cleanup
    await Promise.allSettled([]);
  }
}
