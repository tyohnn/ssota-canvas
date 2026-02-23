import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { ChatSessionId } from '../value-objects/chat-session-id.vo';

export class ChatSession {
  constructor(
    public readonly id: ChatSessionId,
    public readonly workspaceId: WorkspaceId,
    public readonly userId: UserId,
    public title: string,
    public messages: unknown[],
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  /**
   * Update chat session title
   */
  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim() === '') {
      throw new Error('Title cannot be empty');
    }
    this.title = newTitle.trim();
    this.updatedAt = new Date();
  }

  /**
   * Update chat session messages
   */
  updateMessages(newMessages: unknown[]): void {
    this.messages = newMessages;
    this.updatedAt = new Date();
  }

  /**
   * Reconstitute ChatSession from database
   */
  static reconstitute(params: {
    id: ChatSessionId;
    workspaceId: WorkspaceId;
    userId: UserId;
    title: string;
    messages: unknown[];
    createdAt: Date;
    updatedAt: Date;
  }): ChatSession {
    return new ChatSession(
      params.id,
      params.workspaceId,
      params.userId,
      params.title,
      params.messages,
      params.createdAt,
      params.updatedAt
    );
  }
}
