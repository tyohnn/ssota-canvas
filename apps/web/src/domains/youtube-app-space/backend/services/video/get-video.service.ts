/**
 * Video 조회 서비스 로직
 */
import { Result } from '@/utils/result';

import { VideoAggregate } from '../../../shared/aggregates/video.aggregate';
import type { GetVideoRequest } from '../../../shared/dtos/requests/video.requests';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import { VideoSlug } from '../../../shared/value-objects/video-slug.vo';
import type { IVideoRepository } from '../../repositories/interfaces/video.repository.interface';

/**
 * Video 조회
 *
 * @param safeDto - 검증된 Video 조회 요청 (SafeDTO)
 * @param videoRepository - Video Repository
 * @returns Video Aggregate 또는 null
 */
export async function getVideo(
  safeDto: GetVideoRequest,
  videoRepository: IVideoRepository
): Promise<Result<VideoAggregate | null, YoutubeError>> {
  try {
    // 1. VideoSlug Value Object 생성 (형식 검증)
    const videoSlug = new VideoSlug(safeDto.slug);

    // 2. Video 조회 (slug로)
    const aggregate = await videoRepository.findBySlug(videoSlug.value);

    return Result.success(aggregate);
  } catch (error) {
    // YoutubeError인 경우 그대로 반환
    if (error instanceof YoutubeError) {
      return Result.error(error);
    }

    return Result.error(
      new YoutubeError(
        'VIDEO_QUERY_FAILED',
        error instanceof Error ? error.message : 'Failed to get video',
        {
          slug: safeDto.slug,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}
