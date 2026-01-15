/**
 * Video 생성 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { VideoAggregate } from '../../../shared/aggregates/video.aggregate';
import type { CreateVideoRequest } from '../../../shared/dtos/requests/video.requests';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import { ChannelId } from '../../../shared/value-objects/channel-id.vo';
import { VideoId } from '../../../shared/value-objects/video-id.vo';
import { VideoSlug } from '../../../shared/value-objects/video-slug.vo';
import type { IVideoRepository } from '../../repositories/interfaces/video.repository.interface';

/**
 * Video 생성
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음
 * - Value Object로 변환
 * - Aggregate에 Command 전달
 * - Domain Event 처리
 *
 * @param safeDto - 검증된 Video 생성 요청 (SafeDTO)
 * @param videoRepository - Video Repository
 * @returns Video Aggregate
 */
export async function createVideo(
  safeDto: CreateVideoRequest,
  safeUserId: UserId,
  videoRepository: IVideoRepository
): Promise<Result<VideoAggregate, YoutubeError>> {
  try {
    // 1. Value Objects 생성
    const videoId = VideoId.generate();
    const slug = new VideoSlug(safeDto.slug);
    const userId = safeUserId;
    const channelId = safeDto.channelId
      ? new ChannelId(safeDto.channelId)
      : undefined;

    // 2. CreateVideoCommand 생성
    const command = {
      videoId,
      slug,
      title: safeDto.title,
      description: safeDto.description,
      channelId,
      publishedAt: safeDto.publishedAt,
      durationSeconds: safeDto.durationSeconds,
      thumbnailUrl: safeDto.thumbnailUrl,
      thumbnailHighUrl: safeDto.thumbnailHighUrl,
      viewCount: safeDto.viewCount,
      likeCount: safeDto.likeCount,
      commentCount: safeDto.commentCount,
      userId,
    };

    // 3. Aggregate 생성 (Command 전달)
    const aggregate = VideoAggregate.createVideo(command);

    // 4. Aggregate 저장 (트랜잭션)
    await videoRepository.create(aggregate);

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
        'VIDEO_CREATION_FAILED',
        error instanceof Error ? error.message : 'Failed to create video',
        {
          slug: safeDto.slug,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}
