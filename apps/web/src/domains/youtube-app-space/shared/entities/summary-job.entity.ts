/**
 * Summary Job Entity
 *
 * summary_jobs 테이블의 도메인 엔티티 (큐 상태 / Realtime)
 */
import { SummaryJobId } from '../value-objects/summary-job-id.vo';

export type SummaryJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export class SummaryJobEntity {
  constructor(
    public readonly id: SummaryJobId,
    public readonly blockId: string,
    public readonly orgId: string,
    public readonly youtubeId: string,
    public readonly language: string,
    public pgmqMsgId: number | undefined,
    public status: SummaryJobStatus,
    public readonly createdAt: Date,
    public startedAt: Date | undefined,
    public completedAt: Date | undefined,
    public errorMessage: string | undefined
  ) { }

  static reconstitute(params: {
    id: SummaryJobId;
    blockId: string;
    orgId: string;
    youtubeId: string;
    language: string;
    pgmqMsgId?: number;
    status: SummaryJobStatus;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    errorMessage?: string;
  }): SummaryJobEntity {
    return new SummaryJobEntity(
      params.id,
      params.blockId,
      params.orgId,
      params.youtubeId,
      params.language,
      params.pgmqMsgId,
      params.status,
      params.createdAt,
      params.startedAt,
      params.completedAt,
      params.errorMessage
    );
  }

  markCompleted(): void {
    this.status = 'completed';
    this.completedAt = new Date();
  }

  markFailed(message: string): void {
    this.status = 'failed';
    this.errorMessage = message;
  }

  setPgmqMsgId(n: number): void {
    this.pgmqMsgId = n;
  }
}
