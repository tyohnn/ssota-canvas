/**
 * Channel ID로 조회 서비스 로직
 */
import { Result } from '@/utils/result';

import { ChannelAggregate } from '../../../shared/aggregates/channel.aggregate';
import type { GetChannelByIdRequest } from '../../../shared/dtos/requests/channel.requests';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import { ChannelId } from '../../../shared/value-objects/channel-id.vo';
import type { IChannelRepository } from '../../repositories/interfaces/channel.repository.interface';

/**
 * Channel ID로 조회
 *
 * @param safeDto - 검증된 Channel ID 조회 요청 (SafeDTO)
 * @param channelRepository - Channel Repository
 * @returns Channel Aggregate 또는 null
 */
export async function getChannelById(
  safeDto: GetChannelByIdRequest,
  channelRepository: IChannelRepository
): Promise<Result<ChannelAggregate | null, YoutubeError>> {
  try {
    // 1. ChannelId Value Object 생성 (형식 검증)
    const channelIdVO = new ChannelId(safeDto.channelId);

    // 2. Channel 조회 (Channel Aggregate ID로)
    const aggregate = await channelRepository.findById(channelIdVO.value);

    return Result.success(aggregate);
  } catch (error) {
    // YoutubeError인 경우 그대로 반환
    if (error instanceof YoutubeError) {
      return Result.error(error);
    }

    return Result.error(
      new YoutubeError(
        'CHANNEL_QUERY_FAILED',
        error instanceof Error ? error.message : 'Failed to get channel by ID',
        {
          channelId: safeDto.channelId,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}
