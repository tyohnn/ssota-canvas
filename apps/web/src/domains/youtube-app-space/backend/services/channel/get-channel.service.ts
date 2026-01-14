/**
 * Channel 조회 서비스 로직
 */
import { Result } from '@/utils/result';

import { ChannelAggregate } from '../../../shared/aggregates/channel.aggregate';
import type { GetChannelRequest } from '../../../shared/dtos/requests/channel.requests';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import { YoutubeChannelId } from '../../../shared/value-objects/youtube-channel-id.vo';
import type { IChannelRepository } from '../../repositories/interfaces/channel.repository.interface';

/**
 * Channel 조회
 *
 * @param safeDto - 검증된 Channel 조회 요청 (SafeDTO)
 * @param channelRepository - Channel Repository
 * @returns Channel Aggregate 또는 null
 */
export async function getChannel(
  safeDto: GetChannelRequest,
  channelRepository: IChannelRepository
): Promise<Result<ChannelAggregate | null, YoutubeError>> {
  try {
    // 1. YoutubeChannelId Value Object 생성 (형식 검증)
    const channelId = new YoutubeChannelId(safeDto.youtubeChannelId);

    // 2. Channel 조회 (YouTube Channel ID로)
    const aggregate = await channelRepository.findByChannelId(channelId.value);

    return Result.success(aggregate);
  } catch (error) {
    // YoutubeError인 경우 그대로 반환
    if (error instanceof YoutubeError) {
      return Result.error(error);
    }

    return Result.error(
      new YoutubeError(
        'CHANNEL_QUERY_FAILED',
        error instanceof Error ? error.message : 'Failed to get channel',
        {
          youtubeChannelId: safeDto.youtubeChannelId,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}
