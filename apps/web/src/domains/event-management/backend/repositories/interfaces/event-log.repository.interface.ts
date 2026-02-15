import { EventLog } from '../../../shared/entities/event-log.entity';
import { EventId } from '../../../shared/value-objects/event-id.vo';

export interface EventLogRepository {
  save(eventLog: EventLog): Promise<void>;

  findById(eventId: EventId): Promise<EventLog | null>;

  /**
   * 최근 이벤트 조회.
   * @param options.excludeCombinedTypes - 제외할 복합 타입 (예: ['block_mount_updated']) → 컨텍스트용 조회 시 repo 선에서 제외
   */
  findRecentByPageId(
    pageId: string,
    limit?: number,
    options?: { excludeCombinedTypes?: string[] }
  ): Promise<EventLog[]>;

  /** 최근 이벤트 조회 (페이지 + 유저 스코프) */
  findRecentByPageIdAndUserId(
    pageId: string,
    userId: string,
    limit?: number
  ): Promise<EventLog[]>;

  /** 블록 관련 이벤트 조회 (payload에 blockMountId/blockId 포함) */
  findByBlockMountId(
    pageId: string,
    blockMountId: string,
    limit?: number
  ): Promise<EventLog[]>;

  /** 유저/타입/블록/기간 필터로 조회 */
  findByFilters(params: {
    pageId: string;
    userId?: string;
    eventTypes?: string[];
    blockMountId?: string;
    since?: Date;
    until?: Date;
    limit?: number;
  }): Promise<EventLog[]>;

  searchByBM25(
    queryText: string,
    pageId: string,
    topK: number,
    timeWeightFactor?: number
  ): Promise<EventLog[]>;

  searchByMetadata(
    metadataFilters: Record<string, unknown>,
    pageId: string,
    topK: number,
    timeWeightFactor?: number
  ): Promise<EventLog[]>;

  searchHybrid(
    queryText: string,
    metadataFilters: Record<string, unknown>,
    pageId: string,
    topK: number,
    timeWeightFactor?: number
  ): Promise<EventLog[]>;

  countByType(pageId: string): Promise<Map<string, number>>;

  findByAgentExecutionId(agentExecutionId: string): Promise<EventLog[]>;
}
