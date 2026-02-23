import { asc, eq } from 'drizzle-orm';
import { adminDb } from '@/db';
import { chatMessages } from '@/db/schemas/public';
import type { NewChatMessage } from '@/db/schemas/public';
import type {
  IChatMessageRepository,
  UIMessageLike,
} from '../interfaces/chat-message.repository.interface';
import { ChatMessage } from '../../../shared/entities/chat-message.entity';
import { ChatMessageId } from '../../../shared/value-objects/chat-message-id.vo';
import { ChatSessionId } from '../../../shared/value-objects/chat-session-id.vo';
import { transformPartsForStorage } from '../../../shared/utils/message-parts-transformer';

export class DrizzleChatMessageRepository implements IChatMessageRepository {
  async insertMany(
    sessionId: ChatSessionId,
    messages: UIMessageLike[],
    baseIndex: number
  ): Promise<void> {
    if (messages.length === 0) return;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const rows: NewChatMessage[] = messages.map((msg, i) => {
      const parts = Array.isArray(msg.parts) ? msg.parts : [];
      const transformedParts = transformPartsForStorage(parts);
      const rawId = typeof msg.id === 'string' ? msg.id : null;
      const id =
        rawId && uuidRegex.test(rawId) ? rawId : ChatMessageId.generate().value;
      return {
        id,
        session_id: sessionId.value,
        index: baseIndex + i,
        role: msg.role ?? 'user',
        parts: transformedParts,
        created_at: new Date(),
      };
    });

    await adminDb.insert(chatMessages).values(rows);
  }

  async findBySessionId(
    sessionId: ChatSessionId
  ): Promise<ChatMessage[]> {
    const rows = await adminDb
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.session_id, sessionId.value))
      .orderBy(asc(chatMessages.index));

    return rows.map((row) =>
      ChatMessage.reconstitute({
        id: new ChatMessageId(row.id),
        sessionId: new ChatSessionId(row.session_id),
        index: row.index,
        role: row.role,
        parts: (row.parts ?? []) as unknown[],
        createdAt: row.created_at,
      })
    );
  }
}
