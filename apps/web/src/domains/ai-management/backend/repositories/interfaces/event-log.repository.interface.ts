import { EventLog } from '../../../shared/entities/event-log.entity';
import { EventId } from '../../../shared/value-objects/event-id.vo';
import { EventType } from '../../../shared/value-objects/event-type.vo';

/**
 * EventLogRepository Interface
 *
 * Event Log 영속성을 담당하는 Repository
 *
 * 특징:
 * - Append-Only: save() 메서드만 존재 (update/delete 없음)
 * - BM25 전문 검색 지원
 * - JSONB 메타데이터 필터링 지원
 * - 시간 가중치 적용 검색
 * - 페이지 범위 격리
 */
export interface EventLogRepository {
  /**
   * Event Log 저장 (Append-Only)
   * @param eventLog - 저장할 EventLog Entity
   */
  save(eventLog: EventLog): Promise<void>;

  /**
   * ID로 Event Log 조회
   * @param eventId - 이벤트 ID
   * @returns EventLog Entity 또는 null
   */
  findById(eventId: EventId): Promise<EventLog | null>;

  /**
   * 페이지별 최근 이벤트 조회 (Short-Term Memory)
   * @param pageId - 페이지 ID
   * @param limit - 최대 개수 (기본값 20)
   * @returns 최근 이벤트 목록 (timestamp DESC 정렬)
   */
  findRecentByPageId(pageId: string, limit?: number): Promise<EventLog[]>;

  /**
   * BM25 전문 검색 (자연어 이벤트)
   * @param queryText - 검색 쿼리 텍스트
   * @param pageId - 페이지 ID
   * @param topK - 반환할 최대 개수
   * @param timeWeightFactor - 시간 가중치 τ (일 단위, 기본값 7일)
   * @returns 검색된 이벤트 목록 (점수순 정렬)
   */
  searchByBM25(
    queryText: string,
    pageId: string,
    topK: number,
    timeWeightFactor?: number
  ): Promise<EventLog[]>;

  /**
   * 메타데이터 패턴 매칭 (정형 이벤트)
   * @param metadataFilters - JSONB 필터 조건
   * @param pageId - 페이지 ID
   * @param topK - 반환할 최대 개수
   * @param timeWeightFactor - 시간 가중치 τ (일 단위, 기본값 7일)
   * @returns 필터링된 이벤트 목록 (점수순 정렬)
   */
  searchByMetadata(
    metadataFilters: Record<string, unknown>,
    pageId: string,
    topK: number,
    timeWeightFactor?: number
  ): Promise<EventLog[]>;

  /**
   * 하이브리드 검색 (BM25 + 메타데이터)
   * @param queryText - 검색 쿼리 텍스트
   * @param metadataFilters - JSONB 필터 조건
   * @param pageId - 페이지 ID
   * @param topK - 반환할 최대 개수
   * @param timeWeightFactor - 시간 가중치 τ (일 단위, 기본값 7일)
   * @returns BM25 결과 + 시간 윈도우 내 관련 툴 호출 패턴
   */
  searchHybrid(
    queryText: string,
    metadataFilters: Record<string, unknown>,
    pageId: string,
    topK: number,
    timeWeightFactor?: number
  ): Promise<EventLog[]>;

  /**
   * 이벤트 타입별 개수 조회
   * @param pageId - 페이지 ID
   * @returns 타입별 개수 맵
   */
  countByType(pageId: string): Promise<Map<string, number>>;

  /**
   * Agent 실행 ID로 이벤트 그룹 조회
   * @param agentExecutionId - Agent 실행 ID
   * @returns 해당 Agent 실행의 모든 이벤트 (timestamp 순 정렬)
   */
  findByAgentExecutionId(agentExecutionId: string): Promise<EventLog[]>;
}
