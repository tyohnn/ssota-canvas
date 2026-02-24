import { ChatMessageId } from '../value-objects/chat-message-id.vo';
import { ChatSessionId } from '../value-objects/chat-session-id.vo';

export class ChatMessage {
  constructor(
    public readonly id: ChatMessageId,
    public readonly sessionId: ChatSessionId,
    public readonly index: number,
    public readonly role: string,
    public readonly parts: unknown[],
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * Reconstitute ChatMessage from database
   */
  static reconstitute(params: {
    id: ChatMessageId;
    sessionId: ChatSessionId;
    index: number;
    role: string;
    parts: unknown[];
    createdAt: Date;
  }): ChatMessage {
    return new ChatMessage(
      params.id,
      params.sessionId,
      params.index,
      params.role,
      params.parts,
      params.createdAt
    );
  }
}
