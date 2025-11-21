import { EventLogRepository } from '../repositories/interfaces/event-log.repository.interface';
import { EventLog } from '../../shared/entities/event-log.entity';
import {
  AIManagementError,
  AIManagementErrorCode,
} from '../../shared/errors/ai-management.error';

/**
 * 검색 전략
 */
export type SearchStrategy = 'bm25' | 'metadata' | 'hybrid';

/**
 * Long-Term Memory 검색 결과
 */
export interface LongTermMemoryResult {
  events: EventLog[];
  totalCount: number;
  searchStrategy: SearchStrategy;
}

/**
 * MemorySearchService
 * Long-Term Memory 검색을 담당하는 Domain Service
 *
 * 기능:
 * - BM25 전문 검색 (자연어 이벤트)
 * - 메타데이터 패턴 매칭 (정형 이벤트)
 * - 하이브리드 검색 (BM25 + 메타데이터)
 * - 시간 가중치 적용 (exp(-t/τ))
 */
export class MemorySearchService {
  constructor(private readonly eventLogRepository: EventLogRepository) {}

  /**
   * Long-Term Memory 검색
   */
  async searchLongTermMemory(
    queryText: string,
    pageId: string,
    topK: number = 10,
    timeWeightFactor: number = 7,
    searchStrategy: SearchStrategy = 'hybrid'
  ): Promise<LongTermMemoryResult> {
    // 1. 입력 검증
    this.validateSearchInput(queryText, pageId, topK, timeWeightFactor);

    // 2. 검색 전략에 따라 실행
    let events: EventLog[];

    try {
      switch (searchStrategy) {
        case 'bm25':
          events = await this.searchByBM25(
            queryText,
            pageId,
            topK,
            timeWeightFactor
          );
          break;

        case 'metadata':
          // 메타데이터만 검색 (queryText를 파싱하여 필터 생성)
          const filters = this.parseQueryToMetadataFilters(queryText);
          events = await this.searchByMetadata(
            filters,
            pageId,
            topK,
            timeWeightFactor
          );
          break;

        case 'hybrid':
        default:
          events = await this.searchHybrid(
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
      throw new AIManagementError(
        AIManagementErrorCode.MEMORY_SEARCH_FAILED,
        `Failed to search long-term memory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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
    return this.eventLogRepository.searchByBM25(
      queryText,
      pageId,
      topK,
      timeWeightFactor
    );
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
    return this.eventLogRepository.searchByMetadata(
      metadataFilters,
      pageId,
      topK,
      timeWeightFactor
    );
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
    return this.eventLogRepository.searchHybrid(
      queryText,
      metadataFilters,
      pageId,
      topK,
      timeWeightFactor
    );
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * 검색 입력 검증
   */
  private validateSearchInput(
    queryText: string,
    pageId: string,
    topK: number,
    timeWeightFactor: number
  ): void {
    // 1. 쿼리 텍스트 검증
    if (!queryText || queryText.trim().length === 0) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_SEARCH_QUERY,
        'Query text cannot be empty'
      );
    }

    // 2. 페이지 ID 검증
    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!pageId || !UUID_REGEX.test(pageId)) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_INPUT,
        'Page ID must be a valid UUID'
      );
    }

    // 3. topK 검증
    if (topK < 1 || topK > 100) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_INPUT,
        'topK must be between 1 and 100'
      );
    }

    // 4. timeWeightFactor 검증
    if (timeWeightFactor < 1 || timeWeightFactor > 365) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_INPUT,
        'timeWeightFactor must be between 1 and 365 days'
      );
    }
  }

  /**
   * 쿼리 텍스트를 메타데이터 필터로 파싱 (간단한 구현)
   */
  private parseQueryToMetadataFilters(
    queryText: string
  ): Record<string, unknown> {
    // 간단한 키워드 추출 (향후 개선 가능)
    const filters: Record<string, unknown> = {};

    // 예: "toolName:addBlock" 같은 패턴 파싱
    const keyValuePattern = /(\w+):(\w+)/g;
    let match;

    while ((match = keyValuePattern.exec(queryText)) !== null) {
      const [, key, value] = match;
      if (key && value) {
        filters[key] = value;
      }
    }

    return filters;
  }
}
