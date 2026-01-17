import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getChannelById } from '../get-channel-by-id.service';
import type { IChannelRepository } from '../../../repositories/interfaces/channel.repository.interface';
import type { GetChannelByIdRequest } from '../../../../shared/dtos/requests/channel.requests';
import { YoutubeError } from '../../../../shared/errors/youtube-app-space.error';
import { ChannelAggregate as ChannelAggregateImpl } from '../../../../shared/aggregates/channel.aggregate';
import { ChannelId } from '../../../../shared/value-objects/channel-id.vo';
import { YoutubeChannelId } from '../../../../shared/value-objects/youtube-channel-id.vo';
import { ChannelEntity } from '../../../../shared/entities/channel.entity';

describe('getChannelById Service', () => {
  let mockRepository: IChannelRepository;
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
      findByChannelId: vi.fn(async (channelId: string) => {
        console.log('[MockRepository] findByChannelId called:', { channelId });
        return null;
      }),
    };

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('성공 케이스', () => {
    it('존재하는 Channel을 ID로 조회해야 한다', async () => {
      // Given
      const channelId = ChannelId.generate();
      const safeDto: GetChannelByIdRequest = {
        channelId: channelId.value,
      };

      const youtubeChannelId = new YoutubeChannelId('UC_x5XG1OV2P6uZZ5FSM9Ttw');
      const channel = ChannelEntity.reconstitute({
        id: channelId.value,
        channelId: youtubeChannelId,
        channelName: 'Test Channel',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const aggregate = ChannelAggregateImpl.reconstitute(channel);

      mockRepository.findById = vi.fn(async (id: string) => {
        console.log('[MockRepository] findById called:', { id });
        return aggregate;
      });

      // When
      const result = await getChannelById(safeDto, mockRepository);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(aggregate);
        expect(result.value?.getChannel().id).toBe(channelId.value);
      }

      expect(mockRepository.findById).toHaveBeenCalledWith(channelId.value);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MockRepository] findById called:'),
        expect.any(Object)
      );
    });

    it('존재하지 않는 Channel은 null을 반환해야 한다', async () => {
      // Given
      const channelId = ChannelId.generate();
      const safeDto: GetChannelByIdRequest = {
        channelId: channelId.value,
      };

      // When
      const result = await getChannelById(safeDto, mockRepository);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBeNull();
      }

      expect(mockRepository.findById).toHaveBeenCalledWith(channelId.value);
    });
  });

  describe('에러 케이스', () => {
    it('잘못된 Channel ID 형식 시 YoutubeError를 반환해야 한다', async () => {
      // Given
      const safeDto: GetChannelByIdRequest = {
        channelId: 'invalid-uuid', // 잘못된 UUID 형식
      };

      // When & Then
      // ChannelId 생성 시 에러 발생
      const result = await getChannelById(safeDto, mockRepository);
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(YoutubeError);
      }
    });

    it('Repository 에러 시 YoutubeError를 반환해야 한다', async () => {
      // Given
      const channelId = ChannelId.generate();
      const safeDto: GetChannelByIdRequest = {
        channelId: channelId.value,
      };

      const errorRepository: IChannelRepository = {
        ...mockRepository,
        findById: vi.fn(async () => {
          console.log('[MockRepository] findById failed');
          throw new Error('Database error');
        }),
      };

      // When
      const result = await getChannelById(safeDto, errorRepository);

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(YoutubeError);
        expect(result.error.code).toBe('CHANNEL_QUERY_FAILED');
      }
    });

    it('YoutubeError는 그대로 전파되어야 한다', async () => {
      // Given
      const channelId = ChannelId.generate();
      const safeDto: GetChannelByIdRequest = {
        channelId: channelId.value,
      };

      const youtubeError = new YoutubeError(
        'CHANNEL_NOT_FOUND',
        'Channel not found',
        { channelId: channelId.value }
      );

      const errorRepository: IChannelRepository = {
        ...mockRepository,
        findById: vi.fn(async () => {
          console.log('[MockRepository] findById failed with YoutubeError');
          throw youtubeError;
        }),
      };

      // When
      const result = await getChannelById(safeDto, errorRepository);

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBe(youtubeError);
        expect(result.error.code).toBe('CHANNEL_NOT_FOUND');
      }
    });
  });
});
