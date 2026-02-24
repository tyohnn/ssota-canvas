import { ChatSession } from '../../../shared/entities/chat-session.entity';
import { ChatSessionId } from '../../../shared/value-objects/chat-session-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';

export interface IChatSessionRepository {
  /**
   * Create a new chat session
   */
  create(chatSession: ChatSession): Promise<void>;

  /**
   * Update an existing chat session
   */
  update(chatSession: ChatSession): Promise<void>;

  /**
   * Find a chat session by ID
   */
  findById(
    sessionId: ChatSessionId,
    userId: UserId
  ): Promise<ChatSession | null>;

  /**
   * List all chat sessions for a workspace and user
   */
  findByWorkspaceAndUser(
    workspaceId: WorkspaceId,
    userId: UserId
  ): Promise<ChatSession[]>;

  /**
   * Delete a chat session
   */
  delete(sessionId: ChatSessionId, userId: UserId): Promise<void>;
}
