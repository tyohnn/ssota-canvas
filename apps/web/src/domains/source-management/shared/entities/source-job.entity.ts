/**
 * Source Job Entity
 *
 * source_jobs 테이블의 도메인 엔티티 (큐 상태 / Realtime)
 * current_step으로 extract → summarize 순차 진행 UI 표시
 */
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';

import { OrgId } from '../value-objects/org-id.vo';
import { SourceId } from '../value-objects/source-id.vo';
import { SourceJobId } from '../value-objects/source-job-id.vo';

export type SourceJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export type SourceJobCurrentStep = 'extracting' | 'summarizing' | null;

export class SourceJobEntity {
  constructor(
    public readonly id: SourceJobId,
    public readonly sourceId: SourceId,
    public readonly blockId: BlockId,
    public readonly orgId: OrgId,
    public readonly language: string,
    public pgmqMsgId: number | undefined,
    public status: SourceJobStatus,
    public currentStep: SourceJobCurrentStep,
    public readonly createdAt: Date,
    public startedAt: Date | undefined,
    public completedAt: Date | undefined,
    public errorMessage: string | undefined
  ) {}

  static reconstitute(params: {
    id: SourceJobId;
    sourceId: SourceId;
    blockId: BlockId;
    orgId: OrgId;
    language: string;
    pgmqMsgId?: number;
    status: SourceJobStatus;
    currentStep?: SourceJobCurrentStep;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    errorMessage?: string;
  }): SourceJobEntity {
    return new SourceJobEntity(
      params.id,
      params.sourceId,
      params.blockId,
      params.orgId,
      params.language,
      params.pgmqMsgId,
      params.status,
      params.currentStep ?? null,
      params.createdAt,
      params.startedAt,
      params.completedAt,
      params.errorMessage
    );
  }

  startExtracting(): void {
    this.currentStep = 'extracting';
  }

  startSummarizing(): void {
    this.currentStep = 'summarizing';
  }

  markCompleted(): void {
    this.status = 'completed';
    this.completedAt = new Date();
    this.currentStep = null;
  }

  markFailed(message: string): void {
    this.status = 'failed';
    this.errorMessage = message;
    // Keep currentStep for diagnosis
  }

  setPgmqMsgId(n: number): void {
    this.pgmqMsgId = n;
  }
}
