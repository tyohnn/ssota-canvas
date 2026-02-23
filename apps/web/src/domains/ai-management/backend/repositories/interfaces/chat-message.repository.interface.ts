import { ChatMessage } from '../../../shared/entities/chat-message.entity';
import { ChatSessionId } from '../../../shared/value-objects/chat-session-id.vo';

/** UIMessage-like shape: { id?, role, parts } */
export type UIMessageLike = { id?: string; role: string; parts?: unknown[] };

export interface IChatMessageRepository {
  /**
   * Insert multiple messages for a session (append).
   * Messages are stored with index = baseIndex, baseIndex+1, ...
   */
  insertMany(
    sessionId: ChatSessionId,
    messages: UIMessageLike[],
    baseIndex: number
  ): Promise<void>;

  /**
   * Find all messages for a session, ordered by index.
   */
  findBySessionId(sessionId: ChatSessionId): Promise<ChatMessage[]>;

  /**
   * Find messages with pagination (for lazy loading).
   * - No beforeIndex: returns the latest `limit` messages (by index), in ascending order.
   * - With beforeIndex: returns up to `limit` messages where index < beforeIndex, in ascending order.
   */
  findBySessionIdPaginated(
    sessionId: ChatSessionId,
    options: { limit: number; beforeIndex?: number }
  ): Promise<{
    messages: ChatMessage[];
    totalCount: number;
    hasMore: boolean;
  }>;
}
