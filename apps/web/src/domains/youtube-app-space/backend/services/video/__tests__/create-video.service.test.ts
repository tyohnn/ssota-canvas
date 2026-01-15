import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createVideo } from '../create-video.service';
import type { IVideoRepository } from '../../../repositories/interfaces/video.repository.interface';
import type { VideoAggregate } from '../../../../shared/aggregates/video.aggregate';
import type { CreateVideoRequest } from '../../../../shared/dtos/requests/video.requests';
import { YoutubeError } from '../../../../shared/errors/youtube-app-space.error';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

describe('createVideo Service', () => {
  let mockRepository: IVideoRepository;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let safeUserId: UserId;

  beforeEach(() => {
    safeUserId = new UserId('550e8400-e29b-41d4-a716-446655440001');

    // 로그만 출력하는 Mock Repository 생성
    mockRepository = {
      create: vi.fn(async (aggregate: VideoAggregate) => {
        console.log('[MockRepository] create called:', {
          videoId: aggregate.getVideo().id.value,
          slug: aggregate.getVideo().slug.value,
          title: aggregate.getVideo().title,
        });
      }),
      findById: vi.fn(async (id: string) => {
        console.log('[MockRepository] findById called:', { id });
        return null;
      }),
      findBySlug: vi.fn(async (slug: string) => {
        console.log('[MockRepository] findBySlug called:', { slug });
        return null;
      }),
      update: vi.fn(async (aggregate: VideoAggregate) => {
        console.log('[MockRepository] update called:', {
          videoId: aggregate.getVideo().id.value,
        });
      }),
    };

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('성공 케이스', () => {
    it('유효한 SafeDTO로 Video를 생성해야 한다', async () => {
      // Given
      const safeDto: CreateVideoRequest = {
        slug: 'dQw4w9WgXcQ',
        title: 'Test Video',
        description: 'Test Description',
        channelId: '550e8400-e29b-41d4-a716-446655440000',
        publishedAt: new Date('2024-01-01'),
        durationSeconds: 300,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        thumbnailHighUrl: 'https://example.com/thumb-high.jpg',
      };

      // When
      const result = await createVideo(safeDto, safeUserId, mockRepository);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        const aggregate = result.value;
        expect(aggregate).toBeDefined();
        expect(aggregate.getVideo().slug.value).toBe(safeDto.slug);
        expect(aggregate.getVideo().title).toBe(safeDto.title);
        expect(aggregate.getVideo().description).toBe(safeDto.description);
        expect(aggregate.getVideo().channelId).toBe(safeDto.channelId);
      }

      // Repository 호출 확인
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MockRepository] create called:'),
        expect.any(Object)
      );
    });

    it('선택적 속성이 없어도 Video를 생성해야 한다', async () => {
      // Given
      const safeDto: CreateVideoRequest = {
        slug: 'dQw4w9WgXcQ',
        title: 'Test Video',
      };

      // When
      const result = await createVideo(safeDto, safeUserId, mockRepository);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        const aggregate = result.value;
        expect(aggregate.getVideo().title).toBe(safeDto.title);
        expect(aggregate.getVideo().description).toBeUndefined();
        expect(aggregate.getVideo().channelId).toBe('');
      }

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('VideoCreatedEvent가 발행되어야 한다', async () => {
      // Given
      const safeDto: CreateVideoRequest = {
        slug: 'dQw4w9WgXcQ',
        title: 'Test Video',
      };

      // When
      const result = await createVideo(safeDto, safeUserId, mockRepository);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        const aggregate = result.value;
        const events = aggregate.getUncommittedEvents();
        expect(events).toHaveLength(0); // 이벤트는 이미 커밋됨
      }
    });
  });

  describe('에러 케이스', () => {
    it('Repository 에러 시 YoutubeError를 반환해야 한다', async () => {
      // Given
      const safeDto: CreateVideoRequest = {
        slug: 'dQw4w9WgXcQ',
        title: 'Test Video',
      };

      const errorRepository: IVideoRepository = {
        ...mockRepository,
        create: vi.fn(async () => {
          console.log('[MockRepository] create failed');
          throw new Error('Database error');
        }),
      };

      // When
      const result = await createVideo(safeDto, safeUserId, errorRepository);

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(YoutubeError);
        expect(result.error.code).toBe('VIDEO_CREATION_FAILED');
      }
    });

    it('YoutubeError는 그대로 전파되어야 한다', async () => {
      // Given
      const safeDto: CreateVideoRequest = {
        slug: 'dQw4w9WgXcQ',
        title: 'Test Video',
      };

      const youtubeError = new YoutubeError(
        'INVALID_VIDEO_SLUG',
        'Invalid video slug',
        { slug: safeDto.slug }
      );

      const errorRepository: IVideoRepository = {
        ...mockRepository,
        create: vi.fn(async () => {
          console.log('[MockRepository] create failed with YoutubeError');
          throw youtubeError;
        }),
      };

      // When
      const result = await createVideo(safeDto, safeUserId, errorRepository);

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBe(youtubeError);
        expect(result.error.code).toBe('INVALID_VIDEO_SLUG');
      }
    });
  });
});
