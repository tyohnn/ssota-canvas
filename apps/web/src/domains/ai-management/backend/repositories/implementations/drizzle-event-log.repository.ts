import { eq, desc, and, sql, inArray } from 'drizzle-orm';
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

/**
 * DrizzleEventLogRepository
 * Drizzle ORM + RLS를 사용한 EventLog Repository 구현
 */
export class DrizzleEventLogRepository implements EventLogRepository {
  /**
   * Event Log 저장 (Append-Only)
   */
  async save(eventLog: EventLog): Promise<void> {
    const { type, action } = this.extractTypeAndAction(eventLog.eventType);

    await adminDb.insert(eventLogs).values({
      id: eventLog.id.value,
      page_id: eventLog.pageId,
      user_id: eventLog.userId,
      event_type: type as any,
      action: action as any,
      payload: this.serializeContent(eventLog),
      search_content: eventLog.extractSearchableText(),
      agent_execution_id: eventLog.agentExecutionId,
      timestamp: eventLog.timestamp,
      created_at: eventLog.createdAt,
    });
  }

  /**
   * ID로 Event Log 조회
   */
  async findById(eventId: EventId): Promise<EventLog | null> {
    const results = await adminDb
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.id, eventId.value))
      .limit(1);

    if (results.length === 0) return null;

    return this.mapToDomain(results[0]!);
  }

  /**
   * 페이지별 최근 이벤트 조회 (Short-Term Memory)
   */
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

  /**
   * BM25 전문 검색 (자연어 이벤트)
   */
  async searchByBM25(
    queryText: string,
    pageId: string,
    topK: number,
    timeWeightFactor: number = 7
  ): Promise<EventLog[]> {
    // BM25 검색 쿼리 (PostgreSQL ts_rank 사용)
    const results = await adminDb
      .select({
        event: eventLogs,
        rank: sql<number>`ts_rank(
            to_tsvector('simple', ${eventLogs.search_content}),
            plainto_tsquery('simple', ${queryText})
          )`.as('rank'),
        time_weight: sql<number>`exp(
            -extract(epoch from (now() - ${eventLogs.timestamp})) / (${timeWeightFactor} * 86400)
          )`.as('time_weight'),
        final_score: sql<number>`
            ts_rank(
              to_tsvector('simple', ${eventLogs.search_content}),
              plainto_tsquery('simple', ${queryText})
            ) * exp(
              -extract(epoch from (now() - ${eventLogs.timestamp})) / (${timeWeightFactor} * 86400)
            )
          `.as('final_score'),
      })
      .from(eventLogs)
      .where(
        and(
          eq(eventLogs.page_id, pageId),
          sql`${eventLogs.search_content} IS NOT NULL`,
          sql`to_tsvector('simple', ${eventLogs.search_content}) @@ plainto_tsquery('simple', ${queryText})`
        )
      )
      .orderBy(sql`final_score DESC`)
      .limit(topK);

    return results.map(row => this.mapToDomain(row.event));
  }

  /**
   * 메타데이터 패턴 매칭 (정형 이벤트)
   */
  async searchByMetadata(
    metadataFilters: Record<string, unknown>,
    pageId: string,
    topK: number,
    timeWeightFactor: number = 7
  ): Promise<EventLog[]> {
    // JSONB 필터링 쿼리
    const jsonbConditions = Object.entries(metadataFilters).map(
      ([key, value]) => sql`${eventLogs.payload}->>${key} = ${String(value)}`
    );

    const results = await adminDb
      .select({
        event: eventLogs,
        time_weight: sql<number>`exp(
            -extract(epoch from (now() - ${eventLogs.timestamp})) / (${timeWeightFactor} * 86400)
          )`.as('time_weight'),
      })
      .from(eventLogs)
      .where(
        and(
          eq(eventLogs.page_id, pageId),
          inArray(eventLogs.event_type, [
            'tool_call',
            'block',
            'edge',
            'component',
            'instance',
            'property',
          ] as any),
          ...jsonbConditions
        )
      )
      .orderBy(sql`time_weight DESC`)
      .limit(topK);

    return results.map(row => this.mapToDomain(row.event));
  }

  /**
   * 하이브리드 검색 (BM25 + 메타데이터)
   */
  async searchHybrid(
    queryText: string,
    metadataFilters: Record<string, unknown>,
    pageId: string,
    topK: number,
    timeWeightFactor: number = 7
  ): Promise<EventLog[]> {
    // 1. BM25 검색 결과
    const bm25Results = await this.searchByBM25(
      queryText,
      pageId,
      topK,
      timeWeightFactor
    );

    // 2. 메타데이터 검색 결과
    const metadataResults = await this.searchByMetadata(
      metadataFilters,
      pageId,
      topK,
      timeWeightFactor
    );

    // 3. 중복 제거 및 병합
    const eventMap = new Map<string, EventLog>();

    bm25Results.forEach(event => {
      eventMap.set(event.id.value, event);
    });

    metadataResults.forEach(event => {
      if (!eventMap.has(event.id.value)) {
        eventMap.set(event.id.value, event);
      }
    });

    // 4. 상위 topK개 반환
    return Array.from(eventMap.values()).slice(0, topK);
  }

  /**
   * 이벤트 타입별 개수 조회
   */
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

  /**
   * Agent 실행 ID로 이벤트 그룹 조회
   */
  async findByAgentExecutionId(agentExecutionId: string): Promise<EventLog[]> {
    const results = await adminDb
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.agent_execution_id, agentExecutionId))
      .orderBy(eventLogs.timestamp);

    return results.map(row => this.mapToDomain(row));
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * DB Row → Domain Entity 변환
   */
  private mapToDomain(row: DBEventLog): EventLog {
    const eventId = new EventId(row.id);
    const combinedType = this.combineTypeAndAction(row);
    const eventType = new EventType(combinedType as any);

    // Content 타입 결정
    let content;
    if (eventType.isUserUtterance()) {
      content = new UtteranceContent(
        (row.payload as any).utterance || row.search_content || ''
      );
    } else if (eventType.isAIResponse()) {
      content = new AIResponse(
        (row.payload as any).response || row.search_content || ''
      );
    } else {
      // tool_call, block, edge 등은 ToolCallResult로 처리
      content = new ToolCallResult(JSON.stringify(row.payload));
    }

    return new EventLog(
      eventId,
      eventType,
      row.page_id,
      row.user_id,
      new Date(row.timestamp),
      content,
      row.payload as Record<string, unknown>,
      row.agent_execution_id || undefined,
      new Date(row.created_at)
    );
  }

  /**
   * Domain Entity → DB Row 변환 (type과 action 분리)
   * EventType VO의 조합된 값을 DB의 type + action으로 분리
   */
  private extractTypeAndAction(eventType: EventType): {
    type: string;
    action: string | null;
  } {
    const typeValue = eventType.value;

    // user_utterance, ai_response, tool_call은 action이 null
    if (
      eventType.isUserUtterance() ||
      eventType.isAIResponse() ||
      eventType.isToolCall()
    ) {
      return { type: typeValue, action: null };
    }

    // block_created -> type='block', action='created'
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

    // 기본값 (fallback)
    return { type: typeValue, action: null };
  }

  /**
   * DB Row → EventType 변환 (type + action 조합)
   */
  private combineTypeAndAction(row: DBEventLog): string {
    if (!row.action) {
      return row.event_type;
    }

    // block + created -> block_created
    return `${row.event_type}_${row.action}`;
  }

  /**
   * EventLog Content → JSONB Payload 변환
   */
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

    // tool_call, block, edge 등은 content가 이미 JSON
    try {
      return JSON.parse(contentString);
    } catch {
      return { raw: contentString };
    }
  }
}
