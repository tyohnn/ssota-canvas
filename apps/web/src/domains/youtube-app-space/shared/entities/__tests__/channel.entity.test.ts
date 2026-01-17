import { describe, it, expect, beforeEach } from 'vitest';
import { ChannelEntity } from '../channel.entity';
import { YoutubeChannelId } from '../../value-objects/youtube-channel-id.vo';

describe('ChannelEntity', () => {
  let channelId: string;
  let youtubeChannelId: YoutubeChannelId;
  let now: Date;

  beforeEach(() => {
    channelId = '550e8400-e29b-41d4-a716-446655440000';
    youtubeChannelId = new YoutubeChannelId('UC_x5XG1OV2P6uZZ5FSM9Ttw');
    now = new Date();
  });

  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다', () => {
      // Given
      const channelName = 'Test Channel';
      const channelDescription = 'Test Description';
      const channelThumbnailUrl = 'https://example.com/thumb.jpg';
      const subscriberCount = 10000;
      const videoCount = 500;

      // When
      const channel = new ChannelEntity(
        channelId,
        youtubeChannelId,
        channelName,
        channelDescription,
        channelThumbnailUrl,
        subscriberCount,
        videoCount,
        now,
        now
      );

      // Then
      expect(channel.id).toBe(channelId);
      expect(channel.channelId).toBe(youtubeChannelId);
      expect(channel.channelName).toBe(channelName);
      expect(channel.channelDescription).toBe(channelDescription);
      expect(channel.channelThumbnailUrl).toBe(channelThumbnailUrl);
      expect(channel.subscriberCount).toBe(subscriberCount);
      expect(channel.videoCount).toBe(videoCount);
      expect(channel.createdAt).toBe(now);
      expect(channel.updatedAt).toBe(now);
    });

    it('선택적 속성이 없어도 생성되어야 한다', () => {
      // When
      const channel = new ChannelEntity(
        channelId,
        youtubeChannelId,
        'Test Channel',
        undefined, // channelDescription
        undefined, // channelThumbnailUrl
        undefined, // subscriberCount
        undefined, // videoCount
        now,
        now
      );

      // Then
      expect(channel.channelDescription).toBeUndefined();
      expect(channel.channelThumbnailUrl).toBeUndefined();
      expect(channel.subscriberCount).toBeUndefined();
      expect(channel.videoCount).toBeUndefined();
    });
  });

  describe('reconstitute', () => {
    it('기존 데이터로 Channel을 재구성해야 한다', () => {
      // Given
      const params = {
        id: channelId,
        channelId: youtubeChannelId,
        channelName: 'Test Channel',
        channelDescription: 'Test Description',
        channelThumbnailUrl: 'https://example.com/thumb.jpg',
        subscriberCount: 10000,
        videoCount: 500,
        createdAt: now,
        updatedAt: now,
      };

      // When
      const channel = ChannelEntity.reconstitute(params);

      // Then
      expect(channel.id).toBe(params.id);
      expect(channel.channelId).toBe(params.channelId);
      expect(channel.channelName).toBe(params.channelName);
      expect(channel.channelDescription).toBe(params.channelDescription);
      expect(channel.channelThumbnailUrl).toBe(params.channelThumbnailUrl);
      expect(channel.subscriberCount).toBe(params.subscriberCount);
      expect(channel.videoCount).toBe(params.videoCount);
      expect(channel.createdAt).toBe(params.createdAt);
      expect(channel.updatedAt).toBe(params.updatedAt);
    });

    it('선택적 속성이 없어도 재구성되어야 한다', () => {
      // Given
      const params = {
        id: channelId,
        channelId: youtubeChannelId,
        channelName: 'Test Channel',
        channelDescription: undefined,
        channelThumbnailUrl: undefined,
        subscriberCount: undefined,
        videoCount: undefined,
        createdAt: now,
        updatedAt: now,
      };

      // When
      const channel = ChannelEntity.reconstitute(params);

      // Then
      expect(channel.channelDescription).toBeUndefined();
      expect(channel.channelThumbnailUrl).toBeUndefined();
      expect(channel.subscriberCount).toBeUndefined();
      expect(channel.videoCount).toBeUndefined();
    });
  });
});
