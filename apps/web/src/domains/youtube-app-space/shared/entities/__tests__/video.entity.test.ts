import { describe, it, expect, beforeEach } from 'vitest';
import { VideoEntity } from '../video.entity';
import { VideoId } from '../../value-objects/video-id.vo';
import { VideoSlug } from '../../value-objects/video-slug.vo';
import type { YoutubeScript } from '../../types/transcript.types';

describe('VideoEntity', () => {
  let videoId: VideoId;
  let videoSlug: VideoSlug;
  let now: Date;

  beforeEach(() => {
    videoId = VideoId.generate();
    videoSlug = new VideoSlug('dQw4w9WgXcQ');
    now = new Date();
  });

  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다', () => {
      // Given
      const title = 'Test Video';
      const description = 'Test Description';
      const channelId = 'channel-123';
      const publishedAt = new Date('2024-01-01');
      const durationSeconds = 300;
      const thumbnailUrl = 'https://example.com/thumb.jpg';
      const thumbnailHighUrl = 'https://example.com/thumb-high.jpg';
      const viewCount = 1000;
      const likeCount = 50;
      const commentCount = 10;

      // When
      const video = new VideoEntity(
        videoId,
        videoSlug,
        title,
        description,
        channelId,
        publishedAt,
        durationSeconds,
        thumbnailUrl,
        thumbnailHighUrl,
        undefined, // script
        undefined, // scriptLanguage
        undefined, // scriptExtractedAt
        viewCount,
        likeCount,
        commentCount,
        now,
        now
      );

      // Then
      expect(video.id).toBe(videoId);
      expect(video.slug).toBe(videoSlug);
      expect(video.title).toBe(title);
      expect(video.description).toBe(description);
      expect(video.channelId).toBe(channelId);
      expect(video.publishedAt).toBe(publishedAt);
      expect(video.durationSeconds).toBe(durationSeconds);
      expect(video.thumbnailUrl).toBe(thumbnailUrl);
      expect(video.thumbnailHighUrl).toBe(thumbnailHighUrl);
      expect(video.viewCount).toBe(viewCount);
      expect(video.likeCount).toBe(likeCount);
      expect(video.commentCount).toBe(commentCount);
      expect(video.createdAt).toBe(now);
      expect(video.updatedAt).toBe(now);
    });

    it('선택적 속성이 없어도 생성되어야 한다', () => {
      // When
      const video = new VideoEntity(
        videoId,
        videoSlug,
        'Test Video',
        undefined, // description
        'channel-123',
        undefined, // publishedAt
        undefined, // durationSeconds
        undefined, // thumbnailUrl
        undefined, // thumbnailHighUrl
        undefined, // script
        undefined, // scriptLanguage
        undefined, // scriptExtractedAt
        0, // viewCount
        0, // likeCount
        0, // commentCount
        now,
        now
      );

      // Then
      expect(video.description).toBeUndefined();
      expect(video.publishedAt).toBeUndefined();
      expect(video.durationSeconds).toBeUndefined();
      expect(video.thumbnailUrl).toBeUndefined();
      expect(video.thumbnailHighUrl).toBeUndefined();
      expect(video.script).toBeUndefined();
    });
  });

  describe('reconstitute', () => {
    it('기존 데이터로 Video를 재구성해야 한다', () => {
      // Given
      const params = {
        id: videoId,
        slug: videoSlug,
        title: 'Test Video',
        description: 'Test Description',
        channelId: 'channel-123',
        publishedAt: new Date('2024-01-01'),
        durationSeconds: 300,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        thumbnailHighUrl: 'https://example.com/thumb-high.jpg',
        script: undefined,
        scriptLanguage: undefined,
        scriptExtractedAt: undefined,
        viewCount: 1000,
        likeCount: 50,
        commentCount: 10,
        createdAt: now,
        updatedAt: now,
      };

      // When
      const video = VideoEntity.reconstitute(params);

      // Then
      expect(video.id).toBe(params.id);
      expect(video.slug).toBe(params.slug);
      expect(video.title).toBe(params.title);
      expect(video.description).toBe(params.description);
      expect(video.channelId).toBe(params.channelId);
      expect(video.publishedAt).toBe(params.publishedAt);
      expect(video.durationSeconds).toBe(params.durationSeconds);
      expect(video.viewCount).toBe(params.viewCount);
    });
  });

  describe('hasScript', () => {
    it('스크립트가 없으면 false를 반환해야 한다', () => {
      // Given
      const video = new VideoEntity(
        videoId,
        videoSlug,
        'Test Video',
        undefined,
        'channel-123',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined, // script
        undefined, // scriptLanguage
        undefined, // scriptExtractedAt
        0,
        0,
        0,
        now,
        now
      );

      // When & Then
      expect(video.hasScript()).toBe(false);
    });

    it('스크립트가 있으면 true를 반환해야 한다', () => {
      // Given
      const script: YoutubeScript = {
        transcript: [
          {
            text: 'Hello',
            start: 0,
            duration: 1,
          },
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          totalDuration: 100,
          totalSegments: 1,
          language: 'en',
        },
      };

      const video = new VideoEntity(
        videoId,
        videoSlug,
        'Test Video',
        undefined,
        'channel-123',
        undefined,
        undefined,
        undefined,
        undefined,
        script,
        'en', // scriptLanguage
        undefined, // scriptExtractedAt
        0,
        0,
        0,
        now,
        now
      );

      // When & Then
      expect(video.hasScript()).toBe(true);
    });
  });

  describe('updateScript', () => {
    it('스크립트가 없을 때 스크립트를 업데이트해야 한다', () => {
      // Given
      const video = new VideoEntity(
        videoId,
        videoSlug,
        'Test Video',
        undefined,
        'channel-123',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined, // script
        undefined, // scriptLanguage
        undefined, // scriptExtractedAt
        0,
        0,
        0,
        now,
        now
      );

      const newScript: YoutubeScript = {
        transcript: [
          {
            text: 'Hello World',
            start: 0,
            duration: 2,
          },
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          totalDuration: 100,
          totalSegments: 1,
          language: 'en',
        },
      };
      const scriptLanguage = 'en';
      const originalUpdatedAt = video.updatedAt;

      // When
      video.updateScript(newScript, scriptLanguage);

      // Then
      expect(video.script).toBe(newScript);
      expect(video.scriptLanguage).toBe(scriptLanguage);
      expect(video.scriptExtractedAt).toBeInstanceOf(Date);
      expect(video.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });

    it('이미 스크립트가 있으면 업데이트하지 않아야 한다', () => {
      // Given
      const existingScript: YoutubeScript = {
        transcript: [
          {
            text: 'Existing',
            start: 0,
            duration: 1,
          },
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          totalDuration: 100,
          totalSegments: 1,
          language: 'en',
        },
      };

      const video = new VideoEntity(
        videoId,
        videoSlug,
        'Test Video',
        undefined,
        'channel-123',
        undefined,
        undefined,
        undefined,
        undefined,
        existingScript,
        'en', // scriptLanguage
        undefined, // scriptExtractedAt
        0,
        0,
        0,
        now,
        now
      );

      const newScript: YoutubeScript = {
        transcript: [
          {
            text: 'New Script',
            start: 0,
            duration: 1,
          },
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          totalDuration: 100,
          totalSegments: 1,
          language: 'ko',
        },
      };

      // When
      video.updateScript(newScript, 'ko');

      // Then
      expect(video.script).toBe(existingScript); // 변경되지 않음
      expect(video.scriptLanguage).toBe('en'); // 변경되지 않음
    });

    it('스크립트 업데이트 시 updatedAt이 갱신되어야 한다', () => {
      // Given
      const video = new VideoEntity(
        videoId,
        videoSlug,
        'Test Video',
        undefined,
        'channel-123',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined, // script
        undefined, // scriptLanguage
        undefined, // scriptExtractedAt
        0,
        0,
        0,
        now,
        now
      );
      const originalUpdatedAt = video.updatedAt;

      const script: YoutubeScript = {
        transcript: [
          {
            text: 'Test',
            start: 0,
            duration: 1,
          },
        ],
        metadata: {
          extractedAt: new Date().toISOString(),
          totalDuration: 100,
          totalSegments: 1,
          language: 'en',
        },
      };

      // When
      // 약간의 시간 차이를 만들기 위해
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      sleep(10);
      video.updateScript(script, 'en');

      // Then
      expect(video.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });

});
