import { and, asc, count, desc, eq, lt } from 'drizzle-orm';
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

  async findBySessionIdPaginated(
    sessionId: ChatSessionId,
    options: { limit: number; beforeIndex?: number }
  ): Promise<{
    messages: ChatMessage[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const { limit, beforeIndex } = options;
    const sessionIdVal = sessionId.value;

    const baseConditions = eq(chatMessages.session_id, sessionIdVal);

    const [countResult] = await adminDb
      .select({ count: count() })
      .from(chatMessages)
      .where(baseConditions);
    const totalCount = countResult?.count ?? 0;

    let rows: typeof chatMessages.$inferSelect[];
    if (beforeIndex === undefined) {
      rows = await adminDb
        .select()
        .from(chatMessages)
        .where(baseConditions)
        .orderBy(desc(chatMessages.index))
        .limit(limit);
      rows.reverse();
    } else {
      rows = await adminDb
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.session_id, sessionIdVal),
            lt(chatMessages.index, beforeIndex)
          )
        )
        .orderBy(desc(chatMessages.index))
        .limit(limit);
      rows.reverse();
    }

    const messages = rows.map((row) =>
      ChatMessage.reconstitute({
        id: new ChatMessageId(row.id),
        sessionId: new ChatSessionId(row.session_id),
        index: row.index,
        role: row.role,
        parts: (row.parts ?? []) as unknown[],
        createdAt: row.created_at,
      })
    );

    const minIndex = rows.length > 0 ? Math.min(...rows.map((r) => r.index)) : 0;
    const hasMore = minIndex > 0;

    return { messages, totalCount, hasMore };
  }
}
