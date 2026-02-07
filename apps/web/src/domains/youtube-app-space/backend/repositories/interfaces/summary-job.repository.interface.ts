/**
 * Summary Job Repository Interface
 *
 * Domain contract for summary_jobs table (queue state / Realtime).
 * edge 패턴: Aggregate로 주고받음
 */
import type { SummaryJobAggregate } from '../../../shared/aggregates/summary-job.aggregate';

export interface ISummaryJobRepository {
  /**
   * Aggregate 저장 (block_id + language 기준 upsert, 새 row면 id 반영)
   * Pending/Completed 생성 시 사용
   */
  save(aggregate: SummaryJobAggregate): Promise<{ id: string }>;

  findById(id: string): Promise<SummaryJobAggregate | null>;

  update(aggregate: SummaryJobAggregate): Promise<void>;

  updatePgmqMsgId(jobId: string, pgmqMsgId: number): Promise<void>;
}
