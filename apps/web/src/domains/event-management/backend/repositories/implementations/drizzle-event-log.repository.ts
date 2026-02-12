import { randomUUID } from 'crypto';
import { eq, desc, and, gte, lte, sql, inArray } from 'drizzle-orm';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { EventLogRepository } from '../interfaces/event-log.repository.interface';
import { EventLog } from '../../../shared/entities/event-log.entity';
import { EventId } from '../../../shared/value-objects/event-id.vo';
import { EventType } from '../../../shared/value-objects/event-type.vo';
import { UtteranceContent } from '../../../shared/value-objects/utterance-content.vo';
import { AIResponse } from '../../../shared/value-objects/ai-response.vo';
import { ToolCallResult } from '../../../shared/value-objects/tool-call-result.vo';
import { adminDb } from '@/db';
import { eventLogs } from '@/db/schema';
import type { EventLog as DBEventLog } from '@/db/schema';

const MAX_SAVE_ATTEMPTS = 3;

export class DrizzleEventLogRepository implements EventLogRepository {
  async save(eventLog: EventLog): Promise<void> {
    let currentLog = eventLog;
    let attempts = 0;

    while (attempts < MAX_SAVE_ATTEMPTS) {
      try {
        const { type, action } = this.extractTypeAndAction(
          currentLog.eventType
        );
        await adminDb.insert(eventLogs).values({
          id: currentLog.id.value,
          page_id: currentLog.pageId.value,
          user_id: currentLog.userId.value,
          event_type: type as (typeof eventLogs.$inferInsert)['event_type'],
          action: action as (typeof eventLogs.$inferInsert)['action'],
          payload: this.serializeContent(currentLog),
          search_content: currentLog.extractSearchableText(),
          agent_execution_id: currentLog.agentExecutionId,
          timestamp: currentLog.timestamp,
          created_at: currentLog.createdAt,
        });
        return;
      } catch (error) {
        const err = error as { code?: string; constraint?: string };
        if (
          err.code === '23505' &&
          (err.constraint === 'event_logs_pkey' ||
            err.constraint === 'event_logs_id_unique')
        ) {
          attempts++;
          if (attempts < MAX_SAVE_ATTEMPTS) {
            const newId = new EventId(randomUUID());
            currentLog = new EventLog(
              newId,
              currentLog.eventType,
              currentLog.pageId,
              currentLog.userId,
              currentLog.timestamp,
              currentLog.content,
              currentLog.metadata,
              currentLog.agentExecutionId,
              currentLog.createdAt
            );
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }
  }

  async findById(eventId: EventId): Promise<EventLog | null> {
    const results = await adminDb
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.id, eventId.value))
      .limit(1);

    if (results.length === 0) return null;
    return this.mapToDomain(results[0]!);
  }

  async findRecentByPageId(
    pageId: string,
    limit: number = 20
  ): Promise<EventLog[]> {
    const results = await adminDb
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.page_id, pageId))
      .orderBy(desc(eventLogs.timestamp))
      .limit(limit);

    return results.map(row => this.mapToDomain(row));
  }

  async findRecentByPageIdAndUserId(
    pageId: string,
    userId: string,
    limit: number = 20
  ): Promise<EventLog[]> {
    return this.findByFilters({ pageId, userId, limit });
  }

  async findByBlockMountId(
    pageId: string,
    blockMountId: string,
    limit: number = 50
  ): Promise<EventLog[]> {
    return this.findByFilters({ pageId, blockMountId, limit });
  }

  async findByFilters(params: {
    pageId: string;
    userId?: string;
    eventTypes?: string[];
    blockMountId?: string;
    since?: Date;
    until?: Date;
    limit?: number;
  }): Promise<EventLog[]> {
    const {
      pageId,
      userId,
      eventTypes,
      blockMountId,
      since,
      until,
      limit = 50,
    } = params;

    const conditions = [eq(eventLogs.page_id, pageId)];

    if (userId) {
      conditions.push(eq(eventLogs.user_id, userId));
    }
    if (eventTypes && eventTypes.length > 0) {
      type EventTypeEnum = (typeof eventLogs.$inferSelect)['event_type'];
      conditions.push(
        inArray(eventLogs.event_type, eventTypes as EventTypeEnum[])
      );
    }
    if (blockMountId) {
      conditions.push(
        sql`(${eventLogs.payload}->>'blockMountId' = ${blockMountId} OR (${eventLogs.payload}->'blockMountIds')::jsonb @> to_jsonb(${blockMountId}::text))`
      );
    }
    if (since) {
      conditions.push(gte(eventLogs.timestamp, since));
    }
    if (until) {
      conditions.push(lte(eventLogs.timestamp, until));
    }

    const results = await adminDb
      .select()
      .from(eventLogs)
      .where(and(...conditions))
      .orderBy(desc(eventLogs.timestamp))
      .limit(limit);

    return results.map(row => this.mapToDomain(row));
  }

  async searchByBM25(
    _queryText: string,
    _pageId: string,
    _topK: number,
    _timeWeightFactor: number = 7
  ): Promise<EventLog[]> {
    return [];
  }

  async searchByMetadata(
    _metadataFilters: Record<string, unknown>,
    _pageId: string,
    _topK: number,
    _timeWeightFactor: number = 7
  ): Promise<EventLog[]> {
    return [];
  }

  async searchHybrid(
    _queryText: string,
    _metadataFilters: Record<string, unknown>,
    _pageId: string,
    _topK: number,
    _timeWeightFactor: number = 7
  ): Promise<EventLog[]> {
    return [];
  }

  async countByType(pageId: string): Promise<Map<string, number>> {
    const results = await adminDb
      .select({
        event_type: eventLogs.event_type,
        action: eventLogs.action,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(eventLogs)
      .where(eq(eventLogs.page_id, pageId))
      .groupBy(eventLogs.event_type, eventLogs.action);

    const countMap = new Map<string, number>();
    results.forEach(row => {
      const key = row.action
        ? `${row.event_type}_${row.action}`
        : row.event_type;
      countMap.set(key, Number(row.count));
    });
    return countMap;
  }

  async findByAgentExecutionId(agentExecutionId: string): Promise<EventLog[]> {
    const results = await adminDb
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.agent_execution_id, agentExecutionId))
      .orderBy(eventLogs.timestamp);

    return results.map(row => this.mapToDomain(row));
  }

  private mapToDomain(row: DBEventLog): EventLog {
    const eventId = new EventId(row.id);
    const combinedType = this.combineTypeAndAction(row);
    const eventType = new EventType(combinedType as 'user_utterance' | 'ai_response' | 'tool_call' | 'block_created' | 'block_updated' | 'block_deleted');

    let content: EventLog['content'];
    if (eventType.isUserUtterance()) {
      content = new UtteranceContent(
        (row.payload as { utterance?: string }).utterance ||
          row.search_content ||
          ''
      );
    } else if (eventType.isAIResponse()) {
      content = new AIResponse(
        (row.payload as { response?: string }).response ||
          row.search_content ||
          ''
      );
    } else {
      content = new ToolCallResult(JSON.stringify(row.payload));
    }

    const pageId = new PageId(row.page_id);
    const userId = new UserId(row.user_id);
    return new EventLog(
      eventId,
      eventType,
      pageId,
      userId,
      new Date(row.timestamp),
      content,
      row.payload as Record<string, unknown>,
      row.agent_execution_id || undefined,
      new Date(row.created_at)
    );
  }

  private extractTypeAndAction(eventType: EventType): {
    type: string;
    action: string | null;
  } {
    const typeValue = eventType.value;

    if (
      eventType.isUserUtterance() ||
      eventType.isAIResponse() ||
      eventType.isToolCall()
    ) {
      return { type: typeValue, action: null };
    }

    if (typeValue.endsWith('_created')) {
      return { type: typeValue.replace('_created', ''), action: 'created' };
    }
    if (typeValue.endsWith('_updated')) {
      return { type: typeValue.replace('_updated', ''), action: 'updated' };
    }
    if (typeValue.endsWith('_deleted')) {
      return { type: typeValue.replace('_deleted', ''), action: 'deleted' };
    }
    if (typeValue.endsWith('_duplicated')) {
      return {
        type: typeValue.replace('_duplicated', ''),
        action: 'duplicated',
      };
    }
    if (typeValue.endsWith('_set')) {
      return { type: typeValue.replace('_set', ''), action: 'set' };
    }
    if (typeValue.endsWith('_reset')) {
      return { type: typeValue.replace('_reset', ''), action: 'reset' };
    }

    return { type: typeValue, action: null };
  }

  private combineTypeAndAction(row: DBEventLog): string {
    if (!row.action) {
      return row.event_type;
    }
    return `${row.event_type}_${row.action}`;
  }

  private serializeContent(eventLog: EventLog): Record<string, unknown> {
    const contentString = eventLog.getContentAsString();

    if (eventLog.eventType.isUserUtterance()) {
      return {
        utterance: contentString,
        ...(eventLog.metadata || {}),
      };
    }

    if (eventLog.eventType.isAIResponse()) {
      return {
        response: contentString,
        ...(eventLog.metadata || {}),
      };
    }

    try {
      return JSON.parse(contentString);
    } catch {
      return { raw: contentString };
    }
  }
}
