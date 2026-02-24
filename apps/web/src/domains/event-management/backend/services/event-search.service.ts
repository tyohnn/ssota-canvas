import { EventLogRepository } from '../repositories/interfaces/event-log.repository.interface';
import { EventLog } from '../../shared/entities/event-log.entity';
import {
  EventManagementError,
  EventManagementErrorCode,
} from '../../shared/errors/event-management.error';

export type SearchStrategy = 'bm25' | 'metadata' | 'hybrid';

export interface LongTermMemoryResult {
  events: EventLog[];
  totalCount: number;
  searchStrategy: SearchStrategy;
}

/**
 * EventSearchService
 * Long-term event search (BM25, metadata, hybrid).
 */
export class EventSearchService {
  constructor(private readonly eventLogRepository: EventLogRepository) {}

  async searchLongTermMemory(
    queryText: string,
    pageId: string,
    topK: number = 10,
    timeWeightFactor: number = 7,
    searchStrategy: SearchStrategy = 'hybrid'
  ): Promise<LongTermMemoryResult> {
    this.validateSearchInput(queryText, pageId, topK, timeWeightFactor);

    let events: EventLog[];

    try {
      switch (searchStrategy) {
        case 'bm25':
          events = await this.eventLogRepository.searchByBM25(
            queryText,
            pageId,
            topK,
            timeWeightFactor
          );
          break;
        case 'metadata': {
          const filters = this.parseQueryToMetadataFilters(queryText);
          events = await this.eventLogRepository.searchByMetadata(
            filters,
            pageId,
            topK,
            timeWeightFactor
          );
          break;
        }
        case 'hybrid':
        default:
          events = await this.eventLogRepository.searchHybrid(
            queryText,
            {},
            pageId,
            topK,
            timeWeightFactor
          );
          break;
      }

      return {
        events,
        totalCount: events.length,
        searchStrategy,
      };
    } catch (error) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_INPUT,
        `Failed to search events: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async searchByBM25(
    queryText: string,
    pageId: string,
    topK: number,
    timeWeightFactor: number = 7
  ): Promise<EventLog[]> {
    return this.eventLogRepository.searchByBM25(
      queryText,
      pageId,
      topK,
      timeWeightFactor
    );
  }

  async searchByMetadata(
    metadataFilters: Record<string, unknown>,
    pageId: string,
    topK: number,
    timeWeightFactor: number = 7
  ): Promise<EventLog[]> {
    return this.eventLogRepository.searchByMetadata(
      metadataFilters,
      pageId,
      topK,
      timeWeightFactor
    );
  }

  async searchHybrid(
    queryText: string,
    metadataFilters: Record<string, unknown>,
    pageId: string,
    topK: number,
    timeWeightFactor: number = 7
  ): Promise<EventLog[]> {
    return this.eventLogRepository.searchHybrid(
      queryText,
      metadataFilters,
      pageId,
      topK,
      timeWeightFactor
    );
  }

  /** Time-ordered page events with optional filters and groupByExecution */
  async getPageEvents(params: {
    pageId: string;
    since?: string;
    until?: string;
    eventTypes?: string[];
    userId?: string;
    blockMountId?: string;
    groupByExecution?: boolean;
    limit?: number;
  }): Promise<{
    events: EventLog[];
    groups?: { executionId: string; events: EventLog[] }[];
  }> {
    const sinceDate = params.since ? parseRelativeOrISO(params.since) : undefined;
    const untilDate = params.until ? parseRelativeOrISO(params.until) : undefined;
    const events = await this.eventLogRepository.findByFilters({
      pageId: params.pageId,
      userId: params.userId,
      eventTypes: params.eventTypes,
      blockMountId: params.blockMountId,
      since: sinceDate,
      until: untilDate,
      limit: params.limit ?? 30,
    });
    if (!params.groupByExecution) {
      return { events };
    }
    const groups = groupEventsByExecution(events);
    return { events, groups };
  }

  /** Keyword search (BM25) over events with optional filters */
  async grepEvents(params: {
    query: string;
    pageId: string;
    eventTypes?: string[];
    actor?: 'user' | 'agent' | 'system' | 'all';
    userId?: string;
    blockMountId?: string;
    since?: string;
    limit?: number;
  }): Promise<EventLog[]> {
    const sinceDate = params.since ? parseRelativeOrISO(params.since) : undefined;
    let events = await this.eventLogRepository.searchByBM25(
      params.query,
      params.pageId,
      params.limit ?? 20
    );
    if (params.userId) {
      events = events.filter((e) => e.userId.value === params.userId);
    }
    if (params.blockMountId) {
      events = events.filter((e) => {
        const p = e.metadata;
        if (!p) return false;
        if (p.blockMountId === params.blockMountId) return true;
        const ids = p.blockMountIds as string[] | undefined;
        return Array.isArray(ids) && ids.includes(params.blockMountId!);
      });
    }
    if (params.eventTypes?.length) {
      events = events.filter((e) => params.eventTypes!.includes(e.eventType.value));
    }
    if (params.actor && params.actor !== 'all') {
      events = events.filter((e) => {
        const actor =
          e.eventType.isUserUtterance()
            ? 'user'
            : e.eventType.isToolCall() || e.eventType.isAIResponse()
              ? 'agent'
              : 'system';
        return actor === params.actor;
      });
    }
    if (sinceDate) {
      events = events.filter((e) => e.timestamp >= sinceDate);
    }
    return events.slice(0, params.limit ?? 20);
  }

  private validateSearchInput(
    queryText: string,
    pageId: string,
    topK: number,
    timeWeightFactor: number
  ): void {
    if (!queryText || queryText.trim().length === 0) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_INPUT,
        'Query text cannot be empty'
      );
    }
    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!pageId || !UUID_REGEX.test(pageId)) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_INPUT,
        'Page ID must be a valid UUID'
      );
    }
    if (topK < 1 || topK > 100) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_INPUT,
        'topK must be between 1 and 100'
      );
    }
    if (timeWeightFactor < 1 || timeWeightFactor > 365) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_INPUT,
        'timeWeightFactor must be between 1 and 365 days'
      );
    }
  }

  private parseQueryToMetadataFilters(
    queryText: string
  ): Record<string, unknown> {
    const filters: Record<string, unknown> = {};
    const keyValuePattern = /(\w+):(\w+)/g;
    let match;
    while ((match = keyValuePattern.exec(queryText)) !== null) {
      const [, key, value] = match;
      if (key && value) filters[key] = value;
    }
    return filters;
  }
}

function parseRelativeOrISO(value: string): Date {
  const trimmed = value.trim().toLowerCase();
  const now = new Date();
  if (trimmed === '1d' || trimmed === '1day') {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }
  if (trimmed === '1w' || trimmed === '1week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return now;
  return parsed;
}

function groupEventsByExecution(
  events: EventLog[]
): { executionId: string; events: EventLog[] }[] {
  const map = new Map<string, EventLog[]>();
  for (const e of events) {
    const id = e.agentExecutionId ?? e.id.value;
    if (!map.has(id)) map.set(id, []);
    map.get(id)!.push(e);
  }
  return Array.from(map.entries()).map(([executionId, evs]) => ({
    executionId,
    events: evs,
  }));
}
