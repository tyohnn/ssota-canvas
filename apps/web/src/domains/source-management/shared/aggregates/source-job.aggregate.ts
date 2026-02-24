/**
 * Source Job Aggregate
 *
 * Source Job Entity의 생명주기와 비즈니스 규칙 관리
 * - Command를 받아 비즈니스 로직 실행
 * - Domain Event 발생 (1 Command : 1 Event)
 * - startExtracting/startSummarizing은 이벤트 없이 entity 상태만 변경 (Realtime은 repo.update로 전파)
 */
import type {
  CompleteSourceJobCommand,
  CreateSourceJobCommand,
  FailSourceJobCommand,
  RegisterSourceJobCompletedCommand,
} from '../commands/source-job.commands';
import type { SourceJobView } from '../dtos/views/source-job.views';
import { SourceJobEntity } from '../entities/source-job.entity';
import {
  SourceJobCompletedEvent,
  SourceJobCreatedEvent,
  SourceJobFailedEvent,
  SourceJobRegisteredCompletedEvent,
} from '../events/source-job.events';
import type { DomainEvent } from '../events/domain-event';
import { SourceJobId } from '../value-objects/source-job-id.vo';

export class SourceJobAggregate {
  private _uncommittedEvents: DomainEvent[] = [];
  private _job: SourceJobEntity;

  constructor(job: SourceJobEntity) {
    this._job = job;
  }

  getJob(): SourceJobEntity {
    return this._job;
  }

  /**
   * Pending Source Job 생성 (Factory)
   * Command → Entity 생성 → SourceJobCreatedEvent
   */
  static createSourceJob(command: CreateSourceJobCommand): SourceJobAggregate {
    const id = SourceJobId.generate();
    const language = command.language || 'en';
    const entity = SourceJobEntity.reconstitute({
      id,
      sourceId: command.sourceId,
      blockId: command.blockId,
      orgId: command.orgId,
      language,
      pgmqMsgId: undefined,
      status: 'pending',
      currentStep: null,
      createdAt: new Date(),
      startedAt: undefined,
      completedAt: undefined,
      errorMessage: undefined,
    });
    const event = new SourceJobCreatedEvent(
      id.value,
      {
        jobId: id.value,
        blockId: command.blockId.value,
        orgId: command.orgId.value,
        sourceId: command.sourceId.value,
        language,
      },
      new Date()
    );
    const aggregate = new SourceJobAggregate(entity);
    aggregate._uncommittedEvents.push(event);
    return aggregate;
  }

  /**
   * 기존 row 업데이트용 aggregate 생성 (이벤트 없음).
   * findByBlockIdAndLanguage로 찾은 기존 id로 state 교체 시 사용
   */
  static reconstituteForReplace(params: {
    id: SourceJobId;
    blockId: CreateSourceJobCommand['blockId'];
    orgId: CreateSourceJobCommand['orgId'];
    sourceId: CreateSourceJobCommand['sourceId'];
    language: string;
    status: 'pending' | 'completed';
    completedAt?: Date;
  }): SourceJobAggregate {
    const entity = SourceJobEntity.reconstitute({
      id: params.id,
      sourceId: params.sourceId,
      blockId: params.blockId,
      orgId: params.orgId,
      language: params.language,
      pgmqMsgId: undefined,
      status: params.status,
      currentStep: null,
      createdAt: new Date(),
      startedAt: undefined,
      completedAt: params.status === 'completed' ? (params.completedAt ?? new Date()) : undefined,
      errorMessage: undefined,
    });
    return new SourceJobAggregate(entity);
  }

  /**
   * Completed 상태로 Source Job 등록 (Factory)
   * Command → Entity 생성 → SourceJobRegisteredCompletedEvent
   */
  static createCompletedSourceJob(
    command: RegisterSourceJobCompletedCommand
  ): SourceJobAggregate {
    const id = SourceJobId.generate();
    const language = command.language || 'en';
    const now = new Date();
    const entity = SourceJobEntity.reconstitute({
      id,
      sourceId: command.sourceId,
      blockId: command.blockId,
      orgId: command.orgId,
      language,
      pgmqMsgId: undefined,
      status: 'completed',
      currentStep: null,
      createdAt: now,
      startedAt: undefined,
      completedAt: now,
      errorMessage: undefined,
    });
    const event = new SourceJobRegisteredCompletedEvent(
      id.value,
      {
        jobId: id.value,
        blockId: command.blockId.value,
        orgId: command.orgId.value,
        sourceId: command.sourceId.value,
        language,
      },
      new Date()
    );
    const aggregate = new SourceJobAggregate(entity);
    aggregate._uncommittedEvents.push(event);
    return aggregate;
  }

  /**
   * Extract 단계 시작 (Realtime UI용 - 이벤트 없음)
   */
  startExtracting(): void {
    this._job.startExtracting();
  }

  /**
   * Summarize 단계 시작 (Realtime UI용 - 이벤트 없음)
   */
  startSummarizing(): void {
    this._job.startSummarizing();
  }

  /**
   * Job 완료 처리 (Command Handler)
   */
  complete(command: CompleteSourceJobCommand): void {
    this._job.markCompleted();
    const event = new SourceJobCompletedEvent(
      this._job.id.value,
      { jobId: command.jobId.value },
      new Date()
    );
    this._uncommittedEvents.push(event);
  }

  /**
   * Job 실패 처리 (Command Handler)
   */
  fail(command: FailSourceJobCommand): void {
    this._job.markFailed(command.errorMessage);
    const event = new SourceJobFailedEvent(
      this._job.id.value,
      { jobId: command.jobId.value, errorMessage: command.errorMessage },
      new Date()
    );
    this._uncommittedEvents.push(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  static reconstitute(entity: SourceJobEntity): SourceJobAggregate {
    return new SourceJobAggregate(entity);
  }

  toView(): SourceJobView {
    const job = this._job;
    return {
      id: job.id.value,
      sourceId: job.sourceId.value,
      blockId: job.blockId.value,
      orgId: job.orgId.value,
      language: job.language,
      status: job.status,
      currentStep: job.currentStep,
      createdAt: job.createdAt.toISOString(),
      startedAt: job.startedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      errorMessage: job.errorMessage,
    };
  }
}
