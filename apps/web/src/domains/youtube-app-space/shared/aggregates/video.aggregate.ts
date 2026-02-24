/**
 * Video Aggregate
 *
 * Video Entity의 생명주기와 비즈니스 규칙을 관리
 * - Command를 받아 비즈니스 로직 실행
 * - Domain Event 발생 (1 Command : 1 Event)
 * - 불변성 보장
 */
import type { CreateVideoCommand } from '../commands/video.commands';
import type { YoutubeView } from '../dtos/views';
import { VideoEntity } from '../entities/video.entity';
import type { DomainEvent } from '../events/domain-event';
import { VideoCreatedEvent } from '../events/video.events';

export class VideoAggregate {
  private _uncommittedEvents: DomainEvent[] = [];
  private _video: VideoEntity;

  constructor(video: VideoEntity) {
    this._video = video;
  }

  /**
   * Aggregate의 Entity 반환
   */
  getVideo(): VideoEntity {
    return this._video;
  }

  /**
   * Video 생성 (Factory Method)
   *
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Entity 생성
   * - Domain Event 발생 (1 Command : 1 Event)
   *
   * @param command - Video 생성 Command
   * @returns VideoAggregate
   */
  static createVideo(command: CreateVideoCommand): VideoAggregate {
    // 1. VideoId는 Command에서 이미 제공됨 (Value Object)
    const videoId = command.videoId;

    // 2. VideoSlug Value Object는 Command에서 이미 제공됨
    const slug = command.slug;

    // 3. VideoEntity 생성 (임시 Entity - DB 저장 전)
    // 실제로는 DB에서 저장 후 Entity를 생성하지만,
    // Aggregate 패턴에서는 Command로부터 직접 생성
    const video = VideoEntity.reconstitute({
      id: videoId,
      slug: slug,
      title: command.title,
      description: command.description,
      channelId: command.channelId?.value ?? '',
      publishedAt: command.publishedAt,
      durationSeconds: command.durationSeconds,
      thumbnailUrl: command.thumbnailUrl,
      thumbnailHighUrl: command.thumbnailHighUrl,
      viewCount: command.viewCount ?? 0,
      likeCount: command.likeCount ?? 0,
      commentCount: command.commentCount ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 4. VideoCreatedEvent 생성 (Entity 데이터 사용)
    const event = new VideoCreatedEvent(
      video.id.value,
      {
        videoId: video.id.value,
        slug: video.slug.value,
        title: video.title,
        channelId: video.channelId,
      },
      new Date()
    );

    // 5. Aggregate 생성 및 이벤트 추가
    const aggregate = new VideoAggregate(video);
    aggregate._uncommittedEvents.push(event);

    return aggregate;
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
  static reconstitute(video: VideoEntity): VideoAggregate {
    return new VideoAggregate(video);
  }

  /**
   * View로 변환 (DTO용)
   *
   * Aggregate를 plain object View로 변환
   * - Value Objects는 .value로 변환
   * - Date는 ISO string으로 변환
   * - 직렬화 가능한 plain object 반환
   *
   * @returns YoutubeView (plain object)
   */
  toView(): YoutubeView {
    const video = this._video;

    return {
      id: video.id.value,
      slug: video.slug.value,
      title: video.title,
      description: video.description,
      channelId: video.channelId,
      publishedAt: video.publishedAt?.toISOString(),
      durationSeconds: video.durationSeconds,
      thumbnailUrl: video.thumbnailUrl,
      thumbnailHighUrl: video.thumbnailHighUrl,
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      commentCount: video.commentCount,
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
    };
  }
}
