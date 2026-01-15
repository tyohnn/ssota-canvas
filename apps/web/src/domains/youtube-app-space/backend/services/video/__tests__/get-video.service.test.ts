import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getVideo } from '../get-video.service';
import type { IVideoRepository } from '../../../repositories/interfaces/video.repository.interface';
import type { GetVideoRequest } from '../../../../shared/dtos/requests/video.requests';
import { YoutubeError } from '../../../../shared/errors/youtube-app-space.error';
import { VideoAggregate as VideoAggregateImpl } from '../../../../shared/aggregates/video.aggregate';
import { VideoId } from '../../../../shared/value-objects/video-id.vo';
import { VideoSlug } from '../../../../shared/value-objects/video-slug.vo';
import { VideoEntity } from '../../../../shared/entities/video.entity';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

describe('getVideo Service', () => {
  let mockRepository: IVideoRepository;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 로그만 출력하는 Mock Repository 생성
    mockRepository = {
      create: vi.fn(async () => {
        console.log('[MockRepository] create called');
      }),
      findById: vi.fn(async (id: string) => {
        console.log('[MockRepository] findById called:', { id });
        return null;
      }),
      findBySlug: vi.fn(async (slug: string) => {
        console.log('[MockRepository] findBySlug called:', { slug });
        return null;
      }),
      update: vi.fn(async () => {
        console.log('[MockRepository] update called');
      }),
    };

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('성공 케이스', () => {
    it('존재하는 Video를 slug로 조회해야 한다', async () => {
      // Given
      const safeDto: GetVideoRequest = {
        slug: 'dQw4w9WgXcQ',
      };

      const videoId = VideoId.generate();
      const videoSlug = new VideoSlug(safeDto.slug);
      const userId = new UserId('550e8400-e29b-41d4-a716-446655440001');
      const video = VideoEntity.reconstitute({
        id: videoId,
        slug: videoSlug,
        title: 'Test Video',
        channelId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
      });
      const aggregate = VideoAggregateImpl.reconstitute(video);

      mockRepository.findBySlug = vi.fn(async (slug: string) => {
        console.log('[MockRepository] findBySlug called:', { slug });
        return aggregate;
      });

      // When
      const result = await getVideo(safeDto, mockRepository);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(aggregate);
        expect(result.value?.getVideo().slug.value).toBe(safeDto.slug);
      }

      expect(mockRepository.findBySlug).toHaveBeenCalledWith(safeDto.slug);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MockRepository] findBySlug called:'),
        expect.any(Object)
      );
    });

    it('존재하지 않는 Video는 null을 반환해야 한다', async () => {
      // Given
      const safeDto: GetVideoRequest = {
        slug: 'dQw4w9WgXcQ',
      };

      // When
      const result = await getVideo(safeDto, mockRepository);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBeNull();
      }

      expect(mockRepository.findBySlug).toHaveBeenCalledWith(safeDto.slug);
    });
  });

  describe('에러 케이스', () => {
    it('잘못된 Video Slug 형식 시 YoutubeError를 반환해야 한다', async () => {
      // Given
      const safeDto: GetVideoRequest = {
        slug: 'invalid', // 잘못된 slug 형식 (11자리가 아님)
      };

      // When & Then
      // VideoSlug 생성 시 에러 발생
      const result = await getVideo(safeDto, mockRepository);
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(YoutubeError);
      }
    });

    it('Repository 에러 시 YoutubeError를 반환해야 한다', async () => {
      // Given
      const safeDto: GetVideoRequest = {
        slug: 'dQw4w9WgXcQ',
      };

      const errorRepository: IVideoRepository = {
        ...mockRepository,
        findBySlug: vi.fn(async () => {
          console.log('[MockRepository] findBySlug failed');
          throw new Error('Database error');
        }),
      };

      // When
      const result = await getVideo(safeDto, errorRepository);

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(YoutubeError);
        expect(result.error.code).toBe('VIDEO_QUERY_FAILED');
      }
    });

    it('YoutubeError는 그대로 전파되어야 한다', async () => {
      // Given
      const safeDto: GetVideoRequest = {
        slug: 'dQw4w9WgXcQ',
      };

      const youtubeError = new YoutubeError(
        'VIDEO_SLUG_NOT_FOUND',
        'Video not found',
        { slug: safeDto.slug }
      );

      const errorRepository: IVideoRepository = {
        ...mockRepository,
        findBySlug: vi.fn(async () => {
          console.log('[MockRepository] findBySlug failed with YoutubeError');
          throw youtubeError;
        }),
      };

      // When
      const result = await getVideo(safeDto, errorRepository);

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBe(youtubeError);
        expect(result.error.code).toBe('VIDEO_SLUG_NOT_FOUND');
      }
    });
  });
});
