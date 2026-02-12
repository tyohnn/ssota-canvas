/**
 * Source Job Repository Interface
 *
 * Domain contract for source_jobs table (queue state / Realtime).
 * Aggregate 패턴: Aggregate로 주고받음
 */
import type { SourceJobAggregate } from '../../../shared/aggregates/source-job.aggregate';

export interface ISourceJobRepository {
  /**
   * 새 Source Job 생성 (INSERT only).
   * UUID 충돌 시 재시도 (block mount 패턴)
   */
  create(aggregate: SourceJobAggregate): Promise<{ id: string }>;

  /**
   * (block_id, language)로 기존 job 조회
   */
  findByBlockIdAndLanguage(
    blockId: string,
    language: string
  ): Promise<SourceJobAggregate | null>;

  findById(id: string): Promise<SourceJobAggregate | null>;

  update(aggregate: SourceJobAggregate): Promise<void>;

  updatePgmqMsgId(jobId: string, pgmqMsgId: number): Promise<void>;

  /**
   * 진행 중(pending/processing)인 source job 조회 (block_id 기준)
   */
  findInProgressByBlockId(blockId: string): Promise<SourceJobAggregate | null>;

  /**
   * 페이지 내 진행 중(pending/processing)인 source job 전체 조회 (created_at 내림차순).
   * 새로고침 시 다중 job 복원용.
   */
  findAllInProgressJobsByPageId(pageId: string): Promise<
    Array<{
      id: string;
      block_id: string;
      language: string;
      status: string;
      current_step: string | null;
      error_message: string | null;
      created_at: Date;
      started_at: Date | null;
      completed_at: Date | null;
    }>
  >;
}
