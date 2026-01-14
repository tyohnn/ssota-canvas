/**
 * Channel 생성 서비스 로직
 */
import { YoutubeChannelId } from '@/domains/youtube-app-space/shared/value-objects/youtube-channel-id.vo';
import { Result } from '@/utils/result';

import { ChannelAggregate } from '../../../shared/aggregates/channel.aggregate';
import type { CreateChannelCommand } from '../../../shared/commands/channel.commands';
import type { CreateChannelRequest } from '../../../shared/dtos/requests/channel.requests';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import { ChannelId } from '../../../shared/value-objects/channel-id.vo';
import type { IChannelRepository } from '../../repositories/interfaces/channel.repository.interface';

/**
 * Channel 생성
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음 (Trust Boundary 통과)
 * - SafeDTO → Command 변환
 * - Aggregate에 Command 전달
 * - Domain Event 처리
 *
 * @param safeDto - 검증된 Channel 생성 요청 (SafeDTO)
 * @param channelRepository - Channel Repository
 * @returns Channel Aggregate
 */
export async function createChannel(
  safeDto: CreateChannelRequest,
  channelRepository: IChannelRepository
): Promise<Result<ChannelAggregate, YoutubeError>> {
  try {
    // 1. ChannelId 생성 (UUID)
    const channelId = ChannelId.generate();

    // 2. SafeDTO → Command 변환 (Value Object 활용)
    const command: CreateChannelCommand = {
      channelId: channelId, // ChannelId Value Object
      youtubeChannelId: new YoutubeChannelId(safeDto.youtubeChannelId), // YouTube Channel ID Value Object
      channelName: safeDto.channelName,
      channelDescription: safeDto.channelDescription,
      channelThumbnailUrl: safeDto.channelThumbnailUrl,
      subscriberCount: safeDto.subscriberCount,
      videoCount: safeDto.videoCount,
    };

    // 2. Aggregate 생성 (Command 전달)
    const aggregate = ChannelAggregate.createChannel(command);

    // 4. Aggregate 저장 (트랜잭션)
    await channelRepository.create(aggregate);

    // 5. 도메인 이벤트 처리
    const uncommittedEvents = aggregate.getUncommittedEvents();
    await Promise.allSettled(uncommittedEvents.map(event => event.handle()));

    // 6. 이벤트 커밋
    aggregate.markEventsAsCommitted();

    // 7. Result.success(aggregate) 반환
    return Result.success(aggregate);
  } catch (error) {
    // YoutubeError인 경우 그대로 반환
    if (error instanceof YoutubeError) {
      return Result.error(error);
    }

    return Result.error(
      new YoutubeError(
        'CHANNEL_CREATION_FAILED',
        error instanceof Error ? error.message : 'Failed to create channel',
        {
          youtubeChannelId: safeDto.youtubeChannelId,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}
