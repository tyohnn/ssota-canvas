import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createChannel } from '../create-channel.service';
import type { IChannelRepository } from '../../../repositories/interfaces/channel.repository.interface';
import type { ChannelAggregate } from '../../../../shared/aggregates/channel.aggregate';
import type { CreateChannelRequest } from '../../../../shared/dtos/requests/channel.requests';
import { YoutubeError } from '../../../../shared/errors/youtube-app-space.error';

describe('createChannel Service', () => {
  let mockRepository: IChannelRepository;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 로그만 출력하는 Mock Repository 생성
    mockRepository = {
      create: vi.fn(async (aggregate: ChannelAggregate) => {
        console.log('[MockRepository] create called:', {
          channelId: aggregate.getChannel().id,
          youtubeChannelId: aggregate.getChannel().channelId.value,
          channelName: aggregate.getChannel().channelName,
        });
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
    it('유효한 SafeDTO로 Channel을 생성해야 한다', async () => {
      // Given
      const safeDto: CreateChannelRequest = {
        youtubeChannelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        channelName: 'Test Channel',
        channelDescription: 'Test Description',
        channelThumbnailUrl: 'https://example.com/thumb.jpg',
        subscriberCount: 10000,
        videoCount: 500,
      };

      // When
      const result = await createChannel(safeDto, mockRepository);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        const aggregate = result.value;
        expect(aggregate).toBeDefined();
        expect(aggregate.getChannel().channelName).toBe(safeDto.channelName);
        expect(aggregate.getChannel().channelDescription).toBe(
          safeDto.channelDescription
        );
        expect(aggregate.getChannel().subscriberCount).toBe(
          safeDto.subscriberCount
        );
        expect(aggregate.getChannel().videoCount).toBe(safeDto.videoCount);
      }

      // Repository 호출 확인
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MockRepository] create called:'),
        expect.any(Object)
      );
    });

    it('선택적 속성이 없어도 Channel을 생성해야 한다', async () => {
      // Given
      const safeDto: CreateChannelRequest = {
        youtubeChannelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        channelName: 'Test Channel',
      };

      // When
      const result = await createChannel(safeDto, mockRepository);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        const aggregate = result.value;
        expect(aggregate.getChannel().channelName).toBe(safeDto.channelName);
        expect(aggregate.getChannel().channelDescription).toBeUndefined();
      }

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('ChannelCreatedEvent가 발행되어야 한다', async () => {
      // Given
      const safeDto: CreateChannelRequest = {
        youtubeChannelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        channelName: 'Test Channel',
      };

      // When
      const result = await createChannel(safeDto, mockRepository);

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
      const safeDto: CreateChannelRequest = {
        youtubeChannelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        channelName: 'Test Channel',
      };

      const errorRepository: IChannelRepository = {
        ...mockRepository,
        create: vi.fn(async () => {
          console.log('[MockRepository] create failed');
          throw new Error('Database error');
        }),
      };

      // When
      const result = await createChannel(safeDto, errorRepository);

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(YoutubeError);
        expect(result.error.code).toBe('CHANNEL_CREATION_FAILED');
      }
    });

    it('YoutubeError는 그대로 전파되어야 한다', async () => {
      // Given
      const safeDto: CreateChannelRequest = {
        youtubeChannelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        channelName: 'Test Channel',
      };

      const youtubeError = new YoutubeError(
        'INVALID_CHANNEL_ID',
        'Invalid channel ID',
        { youtubeChannelId: safeDto.youtubeChannelId }
      );

      const errorRepository: IChannelRepository = {
        ...mockRepository,
        create: vi.fn(async () => {
          console.log('[MockRepository] create failed with YoutubeError');
          throw youtubeError;
        }),
      };

      // When
      const result = await createChannel(safeDto, errorRepository);

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBe(youtubeError);
        expect(result.error.code).toBe('INVALID_CHANNEL_ID');
      }
    });
  });
});
