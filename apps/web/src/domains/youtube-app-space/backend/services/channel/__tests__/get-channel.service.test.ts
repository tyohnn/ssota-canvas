import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getChannel } from '../get-channel.service';
import type { IChannelRepository } from '../../../repositories/interfaces/channel.repository.interface';
import type { GetChannelRequest } from '../../../../shared/dtos/requests/channel.requests';
import { YoutubeError } from '../../../../shared/errors/youtube-app-space.error';
import { ChannelAggregate as ChannelAggregateImpl } from '../../../../shared/aggregates/channel.aggregate';
import { ChannelId } from '../../../../shared/value-objects/channel-id.vo';
import { YoutubeChannelId } from '../../../../shared/value-objects/youtube-channel-id.vo';
import { ChannelEntity } from '../../../../shared/entities/channel.entity';

describe('getChannel Service', () => {
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
    it('존재하는 Channel을 조회해야 한다', async () => {
      // Given
      const safeDto: GetChannelRequest = {
        youtubeChannelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      };

      const channelId = ChannelId.generate();
      const youtubeChannelId = new YoutubeChannelId(safeDto.youtubeChannelId);
      const channel = ChannelEntity.reconstitute({
        id: channelId.value,
        channelId: youtubeChannelId,
        channelName: 'Test Channel',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const aggregate = ChannelAggregateImpl.reconstitute(channel);

      mockRepository.findByChannelId = vi.fn(async () => {
        console.log('[MockRepository] findByChannelId called:', {
          channelId: safeDto.youtubeChannelId,
        });
        return aggregate;
      });

      // When
      const result = await getChannel(safeDto, mockRepository);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(aggregate);
        expect(result.value?.getChannel().channelId.value).toBe(
          safeDto.youtubeChannelId
        );
      }

      expect(mockRepository.findByChannelId).toHaveBeenCalledWith(
        safeDto.youtubeChannelId
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MockRepository] findByChannelId called:'),
        expect.any(Object)
      );
    });

    it('존재하지 않는 Channel은 null을 반환해야 한다', async () => {
      // Given
      const safeDto: GetChannelRequest = {
        youtubeChannelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      };

      // When
      const result = await getChannel(safeDto, mockRepository);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBeNull();
      }

      expect(mockRepository.findByChannelId).toHaveBeenCalledWith(
        safeDto.youtubeChannelId
      );
    });
  });

  describe('에러 케이스', () => {
    it('잘못된 YouTube Channel ID 형식 시 YoutubeError를 반환해야 한다', async () => {
      // Given
      const safeDto: GetChannelRequest = {
        youtubeChannelId: '', // 빈 문자열은 스키마 검증에서 걸러지지만, 혹시 모를 경우
      };

      // When & Then
      // YoutubeChannelId 생성 시 에러 발생
      const result = await getChannel(safeDto, mockRepository);
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(YoutubeError);
      }
    });

    it('Repository 에러 시 YoutubeError를 반환해야 한다', async () => {
      // Given
      const safeDto: GetChannelRequest = {
        youtubeChannelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      };

      const errorRepository: IChannelRepository = {
        ...mockRepository,
        findByChannelId: vi.fn(async () => {
          console.log('[MockRepository] findByChannelId failed');
          throw new Error('Database error');
        }),
      };

      // When
      const result = await getChannel(safeDto, errorRepository);

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(YoutubeError);
        expect(result.error.code).toBe('CHANNEL_QUERY_FAILED');
      }
    });

    it('YoutubeError는 그대로 전파되어야 한다', async () => {
      // Given
      const safeDto: GetChannelRequest = {
        youtubeChannelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      };

      const youtubeError = new YoutubeError(
        'CHANNEL_NOT_FOUND',
        'Channel not found',
        { youtubeChannelId: safeDto.youtubeChannelId }
      );

      const errorRepository: IChannelRepository = {
        ...mockRepository,
        findByChannelId: vi.fn(async () => {
          console.log('[MockRepository] findByChannelId failed with YoutubeError');
          throw youtubeError;
        }),
      };

      // When
      const result = await getChannel(safeDto, errorRepository);

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBe(youtubeError);
        expect(result.error.code).toBe('CHANNEL_NOT_FOUND');
      }
    });
  });
});
