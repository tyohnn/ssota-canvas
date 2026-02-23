import { desc, eq, and } from 'drizzle-orm';
import { adminDb } from '@/db';
import { chatSessions } from '@/db/schemas/public';
import type { NewChatSession } from '@/db/schemas/public';
import type { IChatSessionRepository } from '../interfaces/chat-session.repository.interface';
import { ChatSession } from '../../../shared/entities/chat-session.entity';
import { ChatSessionId } from '../../../shared/value-objects/chat-session-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';

const CHAT_SESSIONS_PKEY = 'chat_sessions_pkey';

export class DrizzleChatSessionRepository implements IChatSessionRepository {
  /**
   * Create chat session.
   * 23505 (unique violation) on pkey: retry with new UUID, max 3 attempts.
   */
  async create(chatSession: ChatSession): Promise<void> {
    let currentId = chatSession.id.value;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const newSession: NewChatSession = {
          id: currentId,
          workspace_id: chatSession.workspaceId.value,
          user_id: chatSession.userId.value,
          title: chatSession.title,
          messages: chatSession.messages,
          created_at: chatSession.createdAt,
          updated_at: chatSession.updatedAt,
        };

        await adminDb.insert(chatSessions).values(newSession);
        return;
      } catch (error) {
        const code = (error as { code?: string }).code;
        const constraint = (error as { constraint?: string }).constraint;

        const isRetryable = code === '23505' && constraint === CHAT_SESSIONS_PKEY;

        if (isRetryable) {
          attempts++;
          if (attempts < maxAttempts) {
            currentId = ChatSessionId.generate().value;
            console.warn(
              `[DrizzleChatSessionRepository] ID collision (attempt ${attempts}), retrying with new ID: ${currentId}`
            );
          } else {
            console.error(
              '[DrizzleChatSessionRepository] Failed to generate unique ID after multiple attempts'
            );
            throw new Error(
              'Failed to generate unique ID after multiple attempts'
            );
          }
        } else {
          throw error;
        }
      }
    }
  }

  async update(chatSession: ChatSession): Promise<void> {
    await adminDb
      .update(chatSessions)
      .set({
        title: chatSession.title,
        messages: chatSession.messages,
        updated_at: chatSession.updatedAt,
      })
      .where(
        and(
          eq(chatSessions.id, chatSession.id.value),
          eq(chatSessions.user_id, chatSession.userId.value)
        )
      );
  }

  async findById(
    sessionId: ChatSessionId,
    userId: UserId
  ): Promise<ChatSession | null> {
    const [row] = await adminDb
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.id, sessionId.value),
          eq(chatSessions.user_id, userId.value)
        )
      )
      .limit(1);

    if (!row) return null;

    return ChatSession.reconstitute({
      id: new ChatSessionId(row.id),
      workspaceId: new WorkspaceId(row.workspace_id),
      userId: new UserId(row.user_id),
      title: row.title,
      messages: row.messages as unknown[],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  async findByWorkspaceAndUser(
    workspaceId: WorkspaceId,
    userId: UserId
  ): Promise<ChatSession[]> {
    const rows = await adminDb
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.workspace_id, workspaceId.value),
          eq(chatSessions.user_id, userId.value)
        )
      )
      .orderBy(desc(chatSessions.updated_at));

    return rows.map(row =>
      ChatSession.reconstitute({
        id: new ChatSessionId(row.id),
        workspaceId: new WorkspaceId(row.workspace_id),
        userId: new UserId(row.user_id),
        title: row.title,
        messages: row.messages as unknown[],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })
    );
  }

  async delete(sessionId: ChatSessionId, userId: UserId): Promise<void> {
    await adminDb
      .delete(chatSessions)
      .where(
        and(
          eq(chatSessions.id, sessionId.value),
          eq(chatSessions.user_id, userId.value)
        )
      );
  }
}
