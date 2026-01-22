/**
 * Video Summary Aggregate
 *
 * VideoSummary Entity의 생명주기와 비즈니스 규칙을 관리
 * - Command를 받아 비즈니스 로직 실행
 * - Domain Event 발생 (1 Command : 1 Event)
 * - 불변성 보장
 */
import type {
  CreateVideoSummaryCommand,
  UpdateVideoSummaryCommand,
} from '../commands/video-summary.commands';
import type { VideoSummaryView } from '../dtos/views';
import { VideoSummaryEntity } from '../entities/video-summary.entity';
import type { DomainEvent } from '../events/domain-event';
import {
  VideoSummaryCreatedEvent,
  VideoSummaryUpdatedEvent,
} from '../events/video-summary.events';
import { VideoSummaryId } from '../value-objects/video-summary-id.vo';

export class VideoSummaryAggregate {
  private _uncommittedEvents: DomainEvent[] = [];
  private _summary: VideoSummaryEntity;

  constructor(summary: VideoSummaryEntity) {
    this._summary = summary;
  }

  /**
   * Aggregate의 Entity 반환
   */
  getSummary(): VideoSummaryEntity {
    return this._summary;
  }

  /**
   * VideoSummary 생성 (Factory Method)
   *
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Entity 생성
   * - Domain Event 발생 (1 Command : 1 Event)
   *
   * @param command - VideoSummary 생성 Command
   * @returns VideoSummaryAggregate
   */
  static createVideoSummary(
    command: CreateVideoSummaryCommand
  ): VideoSummaryAggregate {
    // 1. VideoSummaryId 생성
    const summaryId = VideoSummaryId.generate();

    // 2. VideoSummaryEntity 생성
    const summary = VideoSummaryEntity.reconstitute({
      id: summaryId,
      videoId: command.videoId,
      language: command.language,
      summary: command.summary,
      keywords: command.keywords || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. VideoSummaryCreatedEvent 생성
    const event = new VideoSummaryCreatedEvent(
      summary.id.value,
      {
        videoId: command.videoId.value,
        language: command.language.value,
      },
      new Date()
    );

    // 4. Aggregate 생성 및 이벤트 추가
    const aggregate = new VideoSummaryAggregate(summary);
    aggregate._uncommittedEvents.push(event);

    return aggregate;
  }

  /**
   * Summary 업데이트 (Command Handler)
   *
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Entity 상태 변경
   * - Domain Event 발생 (1 Command : 1 Event)
   *
   * @param command - Summary 업데이트 Command
   */
  updateSummary(command: UpdateVideoSummaryCommand): void {
    // Entity 데이터 업데이트
    this._summary.updateSummary(command.summary, command.keywords);

    // VideoSummaryUpdatedEvent 생성
    const event = new VideoSummaryUpdatedEvent(
      this._summary.id.value,
      {
        videoId: this._summary.videoId.value,
        language: this._summary.language.value,
      },
      new Date()
    );

    this._uncommittedEvents.push(event);
  }

  /**
   * 커밋되지 않은 이벤트들 조회
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  /**
   * 이벤트들을 커밋된 것으로 표시
   */
  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  /**
   * Aggregate 재구성 (Repository에서 사용)
   *
   * DB에서 조회한 Entity로부터 Aggregate 재구성
   */
  static reconstitute(summary: VideoSummaryEntity): VideoSummaryAggregate {
    return new VideoSummaryAggregate(summary);
  }

  /**
   * View로 변환 (DTO용)
   *
   * Aggregate를 plain object View로 변환
   * - Value Objects는 .value로 변환
   * - Date는 ISO string으로 변환
   * - 직렬화 가능한 plain object 반환
   *
   * @returns VideoSummaryView (plain object)
   */
  toView(): VideoSummaryView {
    const summary = this._summary;

    return {
      id: summary.id.value,
      videoId: summary.videoId.value,
      language: summary.language.value,
      summary: summary.summary,
      keywords: summary.keywords,
      createdAt: summary.createdAt.toISOString(),
      updatedAt: summary.updatedAt.toISOString(),
    };
  }
}
