/**
 * Action Transaction Repository Interface
 *
 * Domain Layer에서 사용할 Repository 인터페이스 정의
 *
 * DDD 원칙: Infrastructure 레이어(Drizzle)에 의존하지 않음
 */
import type { ActionTransactionAggregate } from '../../../shared/aggregates/action-transaction.aggregate';
import type { ActionType } from '../../../shared/entities/action-transaction.entity';

/**
 * Action Transaction Repository Interface
 *
 * Action Transaction 데이터 액세스 계약
 * edge 패턴: Aggregate로 주고받음
 */
export interface IActionTransactionRepository {
  /**
   * Action Transaction 생성
   */
  create(aggregate: ActionTransactionAggregate): Promise<void>;

  /**
   * ID로 Aggregate 조회
   */
  findById(id: string): Promise<ActionTransactionAggregate | null>;

  /**
   * Org ID와 Video ID, Action Type으로 Aggregate 조회
   *
   * language가 null인 액션 타입들 (extract_script, smart_summary)을 조회할 때 사용
   *
   * @param orgId - Organization ID
   * @param videoId - Video ID
   * @param actionType - 액션 타입 (language가 null인 타입: 'extract_script' | 'smart_summary')
   * @returns 찾은 Aggregate 또는 null
   */
  findByOrgAndVideo(
    orgId: string,
    videoId: string,
    actionType: Exclude<ActionType, 'extract_summary'>
  ): Promise<ActionTransactionAggregate | null>;

  /**
   * Org ID, Video ID, Action Type, Language로 Aggregate 조회
   *
   * 언어별 트랜잭션 조회 (extract_summary, smart_summary 등 language가 필요한 액션 타입)
   *
   * @param orgId - Organization ID
   * @param videoId - Video ID
   * @param actionType - 액션 타입 (language가 필요한 타입, 현재는 'extract_summary', 향후 확장 가능)
   * @param language - 언어 코드 (ISO 639-1, 2자리)
   * @returns 찾은 Aggregate 또는 null
   */
  findByOrgVideoAndLanguage(
    orgId: string,
    videoId: string,
    actionType: ActionType,
    language: string
  ): Promise<ActionTransactionAggregate | null>;

  /**
   * Aggregate 업데이트
   */
  update(aggregate: ActionTransactionAggregate): Promise<void>;

  /**
   * Org ID, Video ID로 Summary 타입의 모든 언어 목록 조회
   *
   * extract_summary 액션의 경우 여러 언어로 추출할 수 있으므로,
   * 해당 org + video의 모든 summary 언어 목록을 반환합니다.
   *
   * @param orgId - Organization ID
   * @param videoId - Video ID
   * @returns 언어 코드 배열 (중복 제거, 정렬됨)
   */
  findAllLanguagesByOrgAndVideoOfSummaryType(
    orgId: string,
    videoId: string
  ): Promise<string[]>;
}
