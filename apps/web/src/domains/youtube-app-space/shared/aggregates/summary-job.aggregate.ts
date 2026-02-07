/**
 * Summary Job Aggregate
 *
 * Summary Job Entity의 생명주기와 비즈니스 규칙 관리
 * - Command를 받아 비즈니스 로직 실행
 * - Domain Event 발생 (1 Command : 1 Event)
 */
import type {
  CompleteSummaryJobCommand,
  CreateSummaryJobCommand,
  FailSummaryJobCommand,
  RegisterSummaryJobCompletedCommand,
} from '../commands/summary-job.commands';
import type { SummaryJobView } from '../dtos/views/summary-job.views';
import { SummaryJobEntity } from '../entities/summary-job.entity';
import {
  SummaryJobCompletedEvent,
  SummaryJobCreatedEvent,
  SummaryJobFailedEvent,
  SummaryJobRegisteredCompletedEvent,
} from '../events/summary-job.events';
import type { DomainEvent } from '../events/domain-event';
import { SummaryJobId } from '../value-objects/summary-job-id.vo';

export class SummaryJobAggregate {
  private _uncommittedEvents: DomainEvent[] = [];
  private _job: SummaryJobEntity;

  constructor(job: SummaryJobEntity) {
    this._job = job;
  }

  getJob(): SummaryJobEntity {
    return this._job;
  }

  /**
   * Pending Summary Job 생성 (Factory)
   * Command → Entity 생성 → SummaryJobCreatedEvent
   */
  static createSummaryJob(
    command: CreateSummaryJobCommand
  ): SummaryJobAggregate {
    const id = SummaryJobId.generate();
    const language = command.language || 'en';
    const entity = SummaryJobEntity.reconstitute({
      id,
      blockId: command.blockId,
      orgId: command.orgId,
      youtubeId: command.youtubeId,
      language,
      pgmqMsgId: undefined,
      status: 'pending',
      createdAt: new Date(),
      startedAt: undefined,
      completedAt: undefined,
      errorMessage: undefined,
    });
    const event = new SummaryJobCreatedEvent(
      id.value,
      {
        jobId: id.value,
        blockId: command.blockId,
        orgId: command.orgId,
        youtubeId: command.youtubeId,
        language,
      },
      new Date()
    );
    const aggregate = new SummaryJobAggregate(entity);
    aggregate._uncommittedEvents.push(event);
    return aggregate;
  }

  /**
   * Completed 상태로 Summary Job 등록 (Factory)
   * Command → Entity 생성 → SummaryJobRegisteredCompletedEvent
   */
  static createCompletedSummaryJob(
    command: RegisterSummaryJobCompletedCommand
  ): SummaryJobAggregate {
    const id = SummaryJobId.generate();
    const language = command.language || 'en';
    const now = new Date();
    const entity = SummaryJobEntity.reconstitute({
      id,
      blockId: command.blockId,
      orgId: command.orgId,
      youtubeId: command.youtubeId,
      language,
      pgmqMsgId: undefined,
      status: 'completed',
      createdAt: now,
      startedAt: undefined,
      completedAt: now,
      errorMessage: undefined,
    });
    const event = new SummaryJobRegisteredCompletedEvent(
      id.value,
      {
        jobId: id.value,
        blockId: command.blockId,
        orgId: command.orgId,
        youtubeId: command.youtubeId,
        language,
      },
      new Date()
    );
    const aggregate = new SummaryJobAggregate(entity);
    aggregate._uncommittedEvents.push(event);
    return aggregate;
  }

  /**
   * Job 완료 처리 (Command Handler)
   */
  complete(command: CompleteSummaryJobCommand): void {
    this._job.markCompleted();
    const event = new SummaryJobCompletedEvent(
      this._job.id.value,
      { jobId: command.jobId },
      new Date()
    );
    this._uncommittedEvents.push(event);
  }

  /**
   * Job 실패 처리 (Command Handler)
   */
  fail(command: FailSummaryJobCommand): void {
    this._job.markFailed(command.errorMessage);
    const event = new SummaryJobFailedEvent(
      this._job.id.value,
      { jobId: command.jobId, errorMessage: command.errorMessage },
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

  static reconstitute(entity: SummaryJobEntity): SummaryJobAggregate {
    return new SummaryJobAggregate(entity);
  }

  toView(): SummaryJobView {
    const job = this._job;
    return {
      id: job.id.value,
      blockId: job.blockId,
      orgId: job.orgId,
      youtubeId: job.youtubeId,
      language: job.language,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      startedAt: job.startedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      errorMessage: job.errorMessage,
    };
  }
}
