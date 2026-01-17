/**
 * Channel Aggregate
 *
 * Channel Entity의 생명주기와 비즈니스 규칙을 관리
 * - Command를 받아 비즈니스 로직 실행
 * - Domain Event 발생 (1 Command : 1 Event)
 * - 불변성 보장
 */
import type { CreateChannelCommand } from '../commands/channel.commands';
import type { ChannelView } from '../dtos/views';
import { ChannelEntity } from '../entities/channel.entity';
import { ChannelCreatedEvent } from '../events/channel.events';
import type { DomainEvent } from '../events/domain-event';
import { YoutubeChannelId } from '../value-objects/youtube-channel-id.vo';

export class ChannelAggregate {
  private _uncommittedEvents: DomainEvent[] = [];
  private _channel: ChannelEntity;

  constructor(channel: ChannelEntity) {
    this._channel = channel;
  }

  /**
   * Aggregate의 Entity 반환
   */
  getChannel(): ChannelEntity {
    return this._channel;
  }

  /**
   * Channel 생성 (Factory Method)
   *
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Entity 생성
   * - Domain Event 발생 (1 Command : 1 Event)
   *
   * @param command - Channel 생성 Command
   * @returns ChannelAggregate
   */
  static createChannel(command: CreateChannelCommand): ChannelAggregate {
    // 1. ChannelEntity 생성
    const channel = ChannelEntity.reconstitute({
      id: command.channelId.value,
      channelId: command.youtubeChannelId,
      channelName: command.channelName,
      channelDescription: command.channelDescription,
      channelThumbnailUrl: command.channelThumbnailUrl,
      subscriberCount: command.subscriberCount,
      videoCount: command.videoCount,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. ChannelCreatedEvent 생성 (Entity 데이터 사용)
    const event = new ChannelCreatedEvent(
      channel.id,
      {
        channelId: channel.id,
        youtubeChannelId: channel.channelId.value,
        channelName: channel.channelName,
      },
      new Date()
    );

    // 3. Aggregate 생성 및 이벤트 추가
    const aggregate = new ChannelAggregate(channel);
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
  static reconstitute(channel: ChannelEntity): ChannelAggregate {
    return new ChannelAggregate(channel);
  }

  /**
   * View로 변환 (DTO용)
   *
   * Aggregate를 plain object View로 변환
   * - Value Objects는 .value로 변환
   * - Date는 ISO string으로 변환
   * - 직렬화 가능한 plain object 반환
   *
   * @returns ChannelView (plain object)
   */
  toView(): ChannelView {
    const channel = this._channel;

    return {
      id: channel.id,
      channelId: channel.channelId.value,
      channelName: channel.channelName,
      channelDescription: channel.channelDescription,
      channelThumbnailUrl: channel.channelThumbnailUrl,
      subscriberCount: channel.subscriberCount,
      videoCount: channel.videoCount,
      createdAt: channel.createdAt.toISOString(),
      updatedAt: channel.updatedAt.toISOString(),
    };
  }
}
