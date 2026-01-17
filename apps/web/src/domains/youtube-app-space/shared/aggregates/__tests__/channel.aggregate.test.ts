import { describe, it, expect, beforeEach } from 'vitest';
import { ChannelAggregate } from '../channel.aggregate';
import { ChannelEntity } from '../../entities/channel.entity';
import { YoutubeChannelId } from '../../value-objects/youtube-channel-id.vo';
import { ChannelId } from '../../value-objects/channel-id.vo';
import type { CreateChannelCommand } from '../../commands/channel.commands';
import { ChannelCreatedEvent } from '../../events/channel.events';

describe('ChannelAggregate', () => {
  let channelId: ChannelId;
  let youtubeChannelId: YoutubeChannelId;
  let now: Date;

  beforeEach(() => {
    channelId = new ChannelId('550e8400-e29b-41d4-a716-446655440000');
    youtubeChannelId = new YoutubeChannelId('UC_x5XG1OV2P6uZZ5FSM9Ttw');
    now = new Date();
  });

  describe('createChannel (팩토리 메서드)', () => {
    it('유효한 Command로 Channel을 생성해야 한다', () => {
      // Given
      const command: CreateChannelCommand = {
        channelId: channelId,
        youtubeChannelId: youtubeChannelId,
        channelName: 'Test Channel',
        channelDescription: 'Test Description',
        channelThumbnailUrl: 'https://example.com/thumb.jpg',
        subscriberCount: 10000,
        videoCount: 500,
      };

      // When
      const aggregate = ChannelAggregate.createChannel(command);

      // Then
      expect(aggregate).toBeInstanceOf(ChannelAggregate);
      const channel = aggregate.getChannel();
      expect(channel.id).toBe(channelId.value);
      expect(channel.channelId.value).toBe(command.youtubeChannelId.value);
      expect(channel.channelName).toBe(command.channelName);
      expect(channel.channelDescription).toBe(command.channelDescription);
      expect(channel.channelThumbnailUrl).toBe(command.channelThumbnailUrl);
      expect(channel.subscriberCount).toBe(command.subscriberCount);
      expect(channel.videoCount).toBe(command.videoCount);
    });

    it('YoutubeChannelId Value Object가 생성되어야 한다', () => {
      // Given
      const command: CreateChannelCommand = {
        channelId: channelId,
        youtubeChannelId: youtubeChannelId,
        channelName: 'Test Channel',
      };

      // When
      const aggregate = ChannelAggregate.createChannel(command);
      const channel = aggregate.getChannel();

      // Then
      expect(channel.channelId).toBeInstanceOf(YoutubeChannelId);
      expect(channel.channelId.value).toBe(command.youtubeChannelId.value);
    });

    it('ChannelCreatedEvent가 발행되어야 한다', () => {
      // Given
      const command: CreateChannelCommand = {
        channelId: channelId,
        youtubeChannelId: youtubeChannelId,
        channelName: 'Test Channel',
      };

      // When
      const aggregate = ChannelAggregate.createChannel(command);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!).toBeInstanceOf(ChannelCreatedEvent);
      expect(events[0]!.type).toBe('ChannelCreated');
      const event = events[0] as ChannelCreatedEvent;
      expect(event.aggregateId).toBe(channelId.value);
      expect(event.data.channelId).toBe(channelId.value);
      expect(event.data.youtubeChannelId).toBe(command.youtubeChannelId.value);
      expect(event.data.channelName).toBe(command.channelName);
    });

    it('선택적 속성이 없어도 Channel을 생성해야 한다', () => {
      // Given
      const command: CreateChannelCommand = {
        channelId: channelId,
        youtubeChannelId: youtubeChannelId,
        channelName: 'Test Channel',
      };

      // When
      const aggregate = ChannelAggregate.createChannel(command);
      const channel = aggregate.getChannel();

      // Then
      expect(channel.channelDescription).toBeUndefined();
      expect(channel.channelThumbnailUrl).toBeUndefined();
      expect(channel.subscriberCount).toBeUndefined();
      expect(channel.videoCount).toBeUndefined();
    });

    it('커스텀 채널 ID도 허용해야 한다', () => {
      // Given
      const customYoutubeChannelId = new YoutubeChannelId('channelname');
      const command: CreateChannelCommand = {
        channelId: channelId,
        youtubeChannelId: customYoutubeChannelId,
        channelName: 'Custom Channel',
      };

      // When
      const aggregate = ChannelAggregate.createChannel(command);
      const channel = aggregate.getChannel();

      // Then
      expect(channel.channelId.value).toBe('channelname');
    });
  });

  describe('getUncommittedEvents', () => {
    it('발행된 이벤트 목록을 반환해야 한다', () => {
      // Given
      const command: CreateChannelCommand = {
        channelId: channelId,
        youtubeChannelId: youtubeChannelId,
        channelName: 'Test Channel',
      };
      const aggregate = ChannelAggregate.createChannel(command);

      // When
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('ChannelCreated');
    });

    it('이벤트를 반환해도 이벤트 목록은 유지되어야 한다', () => {
      // Given
      const command: CreateChannelCommand = {
        channelId: channelId,
        youtubeChannelId: youtubeChannelId,
        channelName: 'Test Channel',
      };
      const aggregate = ChannelAggregate.createChannel(command);

      // When
      const events1 = aggregate.getUncommittedEvents();
      const events2 = aggregate.getUncommittedEvents();

      // Then
      expect(events1).toHaveLength(1);
      expect(events2).toHaveLength(1); // 유지됨 (복사본 반환)
    });
  });

  describe('markEventsAsCommitted', () => {
    it('이벤트들을 커밋된 것으로 표시해야 한다', () => {
      // Given
      const command: CreateChannelCommand = {
        channelId: channelId,
        youtubeChannelId: youtubeChannelId,
        channelName: 'Test Channel',
      };
      const aggregate = ChannelAggregate.createChannel(command);
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);

      // When
      aggregate.markEventsAsCommitted();
      const eventsAfter = aggregate.getUncommittedEvents();

      // Then
      expect(eventsAfter).toHaveLength(0);
    });
  });

  describe('reconstitute', () => {
    it('기존 ChannelEntity로 Aggregate를 재구성해야 한다', () => {
      // Given
      const channel = ChannelEntity.reconstitute({
        id: channelId.value,
        channelId: youtubeChannelId,
        channelName: 'Test Channel',
        channelDescription: 'Test Description',
        channelThumbnailUrl: 'https://example.com/thumb.jpg',
        subscriberCount: 10000,
        videoCount: 500,
        createdAt: now,
        updatedAt: now,
      });

      // When
      const aggregate = ChannelAggregate.reconstitute(channel);

      // Then
      expect(aggregate).toBeInstanceOf(ChannelAggregate);
      expect(aggregate.getChannel()).toBe(channel);
      expect(aggregate.getUncommittedEvents()).toHaveLength(0); // 재구성 시 이벤트 없음
    });
  });

  describe('toView', () => {
    it('Aggregate를 View로 변환해야 한다', () => {
      // Given
      const command: CreateChannelCommand = {
        channelId: channelId,
        youtubeChannelId: youtubeChannelId,
        channelName: 'Test Channel',
        channelDescription: 'Test Description',
        channelThumbnailUrl: 'https://example.com/thumb.jpg',
        subscriberCount: 10000,
        videoCount: 500,
      };
      const aggregate = ChannelAggregate.createChannel(command);
      const channel = aggregate.getChannel();

      // When
      const view = aggregate.toView();

      // Then
      expect(view.id).toBe(channel.id);
      expect(view.channelId).toBe(channel.channelId.value);
      expect(view.channelName).toBe(channel.channelName);
      expect(view.channelDescription).toBe(channel.channelDescription);
      expect(view.channelThumbnailUrl).toBe(channel.channelThumbnailUrl);
      expect(view.subscriberCount).toBe(channel.subscriberCount);
      expect(view.videoCount).toBe(channel.videoCount);
      expect(view.createdAt).toBe(channel.createdAt.toISOString());
      expect(view.updatedAt).toBe(channel.updatedAt.toISOString());
    });

    it('선택적 속성이 없어도 View로 변환해야 한다', () => {
      // Given
      const command: CreateChannelCommand = {
        channelId: channelId,
        youtubeChannelId: youtubeChannelId,
        channelName: 'Test Channel',
      };
      const aggregate = ChannelAggregate.createChannel(command);

      // When
      const view = aggregate.toView();

      // Then
      expect(view.channelDescription).toBeUndefined();
      expect(view.channelThumbnailUrl).toBeUndefined();
      expect(view.subscriberCount).toBeUndefined();
      expect(view.videoCount).toBeUndefined();
    });
  });
});
