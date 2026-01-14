/**
 * Action Transaction Repository Interface
 *
 * Domain Layer에서 사용할 Repository 인터페이스 정의
 *
 * DDD 원칙: Infrastructure 레이어(Drizzle)에 의존하지 않음
 */
import type { ActionTransactionAggregate } from '../../../shared/aggregates/action-transaction.aggregate';

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
   * Aggregate 업데이트
   */
  update(aggregate: ActionTransactionAggregate): Promise<void>;
}
