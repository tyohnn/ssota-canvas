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

  /**
   * 페이지 내 진행 중(pending/processing)인 summary job 전체 조회 (created_at 내림차순).
   * 새로고침 시 다중 job 복원용.
   */
  findAllInProgressJobsByPageId(pageId: string): Promise<
    Array<{
      id: string;
      block_id: string;
      status: string;
      error_message: string | null;
      created_at: Date;
      started_at: Date | null;
      completed_at: Date | null;
    }>
  >;
}
