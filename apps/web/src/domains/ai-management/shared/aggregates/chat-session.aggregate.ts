import { ChatSession } from '../entities/chat-session.entity';
import {
  CreateChatSessionCommand,
  UpdateChatSessionTitleCommand,
  DeleteChatSessionCommand,
} from '../commands/chat-session.commands';
import {
  ChatSessionCreatedEvent,
  ChatSessionTitleUpdatedEvent,
  ChatSessionDeletedEvent,
} from '../events/chat-session/chat-session.events';
import type { DomainEvent } from '../events/domain-event';

export class ChatSessionAggregate {
  private _uncommittedEvents: DomainEvent[] = [];
  private _chatSession: ChatSession;

  constructor(chatSession: ChatSession) {
    this._chatSession = chatSession;
  }

  getChatSession(): ChatSession {
    return this._chatSession;
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  /**
   * Create new chat session (Factory Method)
   */
  static create(command: CreateChatSessionCommand): ChatSessionAggregate {
    const title = command.title ?? 'New Chat';
    const now = new Date();

    const chatSession = new ChatSession(
      command.chatSessionId,
      command.workspaceId,
      command.userId,
      title,
      now,
      now
    );

    const event = new ChatSessionCreatedEvent(
      command.chatSessionId,
      {
        chatSessionId: command.chatSessionId,
        workspaceId: command.workspaceId,
        userId: command.userId,
        title,
      },
      new Date()
    );

    const aggregate = new ChatSessionAggregate(chatSession);
    aggregate._uncommittedEvents.push(event);

    return aggregate;
  }

  /**
   * Reconstitute aggregate from existing entity (for updates)
   */
  static reconstitute(chatSession: ChatSession): ChatSessionAggregate {
    return new ChatSessionAggregate(chatSession);
  }

  /**
   * Update chat session title
   */
  updateTitle(command: UpdateChatSessionTitleCommand): void {
    const previousTitle = this._chatSession.title;
    
    // Business logic in entity
    this._chatSession.updateTitle(command.newTitle);

    // Emit domain event
    const event = new ChatSessionTitleUpdatedEvent(
      this._chatSession.id,
      {
        chatSessionId: this._chatSession.id,
        previousTitle,
        newTitle: command.newTitle,
      },
      this._chatSession.updatedAt
    );
    this._uncommittedEvents.push(event);
  }

  /**
   * Delete chat session
   */
  delete(command: DeleteChatSessionCommand): void {
    // Emit domain event
    const event = new ChatSessionDeletedEvent(
      this._chatSession.id,
      {
        chatSessionId: this._chatSession.id,
      },
      new Date()
    );
    this._uncommittedEvents.push(event);
  }
}
