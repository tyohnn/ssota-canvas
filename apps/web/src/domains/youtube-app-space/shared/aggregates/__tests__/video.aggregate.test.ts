import { describe, it, expect, beforeEach } from 'vitest';
import { VideoAggregate } from '../video.aggregate';
import { VideoEntity } from '../../entities/video.entity';
import { VideoId } from '../../value-objects/video-id.vo';
import { VideoSlug } from '../../value-objects/video-slug.vo';
import { ChannelId } from '../../value-objects/channel-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import type { CreateVideoCommand } from '../../commands/video.commands';
import { VideoCreatedEvent } from '../../events/video.events';

describe('VideoAggregate', () => {
  let videoId: VideoId;
  let videoSlug: VideoSlug;
  let channelId: ChannelId;
  let userId: UserId;
  let now: Date;

  beforeEach(() => {
    videoId = VideoId.generate();
    videoSlug = new VideoSlug('dQw4w9WgXcQ');
    channelId = ChannelId.generate();
    userId = new UserId('550e8400-e29b-41d4-a716-446655440001');
    now = new Date();
  });

  describe('createVideo (팩토리 메서드)', () => {
    it('유효한 Command로 Video를 생성해야 한다', () => {
      // Given
      const command: CreateVideoCommand = {
        videoId: videoId,
        slug: videoSlug,
        title: 'Test Video',
        description: 'Test Description',
        channelId: channelId,
        publishedAt: new Date('2024-01-01'),
        durationSeconds: 300,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        thumbnailHighUrl: 'https://example.com/thumb-high.jpg',
        userId: userId,
      };

      // When
      const aggregate = VideoAggregate.createVideo(command);

      // Then
      expect(aggregate).toBeInstanceOf(VideoAggregate);
      const video = aggregate.getVideo();
      expect(video.id).toBeInstanceOf(VideoId);
      expect(video.slug.value).toBe(command.slug.value);
      expect(video.title).toBe(command.title);
      expect(video.description).toBe(command.description);
      expect(video.channelId).toBe(command.channelId?.value);
      expect(video.publishedAt).toBe(command.publishedAt);
      expect(video.durationSeconds).toBe(command.durationSeconds);
      expect(video.thumbnailUrl).toBe(command.thumbnailUrl);
      expect(video.thumbnailHighUrl).toBe(command.thumbnailHighUrl);
      expect(video.viewCount).toBe(0);
      expect(video.likeCount).toBe(0);
      expect(video.commentCount).toBe(0);
    });

    it('VideoId가 자동으로 생성되어야 한다', () => {
      // Given
      const videoId1 = VideoId.generate();
      const videoId2 = VideoId.generate();
      const command1: CreateVideoCommand = {
        videoId: videoId1,
        slug: videoSlug,
        title: 'Test Video',
        userId: userId,
      };
      const command2: CreateVideoCommand = {
        videoId: videoId2,
        slug: videoSlug,
        title: 'Test Video',
        userId: userId,
      };

      // When
      const aggregate1 = VideoAggregate.createVideo(command1);
      const aggregate2 = VideoAggregate.createVideo(command2);

      // Then
      const video1 = aggregate1.getVideo();
      const video2 = aggregate2.getVideo();
      expect(video1.id.value).not.toBe(video2.id.value); // 서로 다른 UUID
    });

    it('VideoCreatedEvent가 발행되어야 한다', () => {
      // Given
      const command: CreateVideoCommand = {
        videoId: videoId,
        slug: videoSlug,
        title: 'Test Video',
        channelId: channelId,
        userId: userId,
      };

      // When
      const aggregate = VideoAggregate.createVideo(command);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!).toBeInstanceOf(VideoCreatedEvent);
      expect(events[0]!.type).toBe('VideoCreated');
      const event = events[0] as VideoCreatedEvent;
      expect(event.data.videoId).toBe(aggregate.getVideo().id.value);
      expect(event.data.slug).toBe(command.slug.value);
      expect(event.data.title).toBe(command.title);
      expect(event.data.channelId).toBe(command.channelId?.value);
    });

    it('선택적 속성이 없어도 Video를 생성해야 한다', () => {
      // Given
      const command: CreateVideoCommand = {
        videoId: videoId,
        slug: videoSlug,
        title: 'Test Video',
        userId: userId,
      };

      // When
      const aggregate = VideoAggregate.createVideo(command);
      const video = aggregate.getVideo();

      // Then
      expect(video.description).toBeUndefined();
      expect(video.channelId).toBe('');
      expect(video.publishedAt).toBeUndefined();
      expect(video.durationSeconds).toBeUndefined();
      expect(video.thumbnailUrl).toBeUndefined();
      expect(video.thumbnailHighUrl).toBeUndefined();
    });
  });

  describe('getUncommittedEvents', () => {
    it('발행된 이벤트 목록을 반환해야 한다', () => {
      // Given
      const command: CreateVideoCommand = {
        videoId: videoId,
        slug: videoSlug,
        title: 'Test Video',
        userId: userId,
      };
      const aggregate = VideoAggregate.createVideo(command);

      // When
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('VideoCreated');
    });

    it('이벤트를 반환해도 이벤트 목록은 유지되어야 한다', () => {
      // Given
      const command: CreateVideoCommand = {
        videoId: videoId,
        slug: videoSlug,
        title: 'Test Video',
        userId: userId,
      };
      const aggregate = VideoAggregate.createVideo(command);

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
      const command: CreateVideoCommand = {
        videoId: videoId,
        slug: videoSlug,
        title: 'Test Video',
        userId: userId,
      };
      const aggregate = VideoAggregate.createVideo(command);
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
    it('기존 VideoEntity로 Aggregate를 재구성해야 한다', () => {
      // Given
      const video = VideoEntity.reconstitute({
        id: videoId,
        slug: videoSlug,
        title: 'Test Video',
        description: 'Test Description',
        channelId: channelId.value,
        publishedAt: new Date('2024-01-01'),
        durationSeconds: 300,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        thumbnailHighUrl: 'https://example.com/thumb-high.jpg',
        viewCount: 1000,
        likeCount: 50,
        commentCount: 10,
        createdAt: now,
        updatedAt: now,
      });

      // When
      const aggregate = VideoAggregate.reconstitute(video);

      // Then
      expect(aggregate).toBeInstanceOf(VideoAggregate);
      expect(aggregate.getVideo()).toBe(video);
      expect(aggregate.getUncommittedEvents()).toHaveLength(0); // 재구성 시 이벤트 없음
    });
  });

  describe('toView', () => {
    it('Aggregate를 View로 변환해야 한다', () => {
      // Given
      const command: CreateVideoCommand = {
        videoId: videoId,
        slug: videoSlug,
        title: 'Test Video',
        description: 'Test Description',
        channelId: channelId,
        publishedAt: new Date('2024-01-01'),
        durationSeconds: 300,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        thumbnailHighUrl: 'https://example.com/thumb-high.jpg',
        userId: userId,
      };
      const aggregate = VideoAggregate.createVideo(command);
      const video = aggregate.getVideo();

      // When
      const view = aggregate.toView();

      // Then
      expect(view.id).toBe(video.id.value);
      expect(view.slug).toBe(video.slug.value);
      expect(view.title).toBe(video.title);
      expect(view.description).toBe(video.description);
      expect(view.channelId).toBe(video.channelId);
      expect(view.publishedAt).toBe(video.publishedAt?.toISOString());
      expect(view.durationSeconds).toBe(video.durationSeconds);
      expect(view.thumbnailUrl).toBe(video.thumbnailUrl);
      expect(view.thumbnailHighUrl).toBe(video.thumbnailHighUrl);
      expect(view.viewCount).toBe(video.viewCount);
      expect(view.likeCount).toBe(video.likeCount);
      expect(view.commentCount).toBe(video.commentCount);
      expect(view.createdAt).toBe(video.createdAt.toISOString());
      expect(view.updatedAt).toBe(video.updatedAt.toISOString());
    });

    it('선택적 속성이 없어도 View로 변환해야 한다', () => {
      // Given
      const command: CreateVideoCommand = {
        videoId: videoId,
        slug: videoSlug,
        title: 'Test Video',
        userId: userId,
      };
      const aggregate = VideoAggregate.createVideo(command);

      // When
      const view = aggregate.toView();

      // Then
      expect(view.description).toBeUndefined();
      expect(view.publishedAt).toBeUndefined();
      expect(view.durationSeconds).toBeUndefined();
      expect(view.thumbnailUrl).toBeUndefined();
      expect(view.thumbnailHighUrl).toBeUndefined();
    });
  });
});
