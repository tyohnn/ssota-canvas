/**
 * Video Summary 생성 서비스 로직
 */
import { Result } from '@/utils/result';

import { VideoSummaryAggregate } from '../../../shared/aggregates/video-summary.aggregate';
import type { CreateVideoSummaryCommand } from '../../../shared/commands/video-summary.commands';
import type { CreateVideoSummaryRequest } from '../../../shared/dtos/requests/video-summary.requests';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import { LanguageCode } from '../../../shared/value-objects/language-code.vo';
import { VideoId } from '../../../shared/value-objects/video-id.vo';
import type { IVideoSummaryRepository } from '../../repositories/interfaces/video-summary.repository.interface';

/**
 * Video Summary 생성
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음
 * - Value Object로 변환
 * - Aggregate에 Command 전달
 * - Domain Event 처리
 *
 * @param safeDto - 검증된 Video Summary 생성 요청 (SafeDTO)
 * @param videoSummaryRepository - Video Summary Repository
 * @returns Video Summary Aggregate
 */
export async function createVideoSummary(
  safeDto: CreateVideoSummaryRequest,
  videoSummaryRepository: IVideoSummaryRepository
): Promise<Result<VideoSummaryAggregate, YoutubeError>> {
  try {
    // 1. Value Objects 생성
    const videoId = new VideoId(safeDto.videoId);
    const language = new LanguageCode(safeDto.language);

    // 2. CreateVideoSummaryCommand 생성
    const command: CreateVideoSummaryCommand = {
      videoId,
      language,
      summary: safeDto.summary,
      keywords: safeDto.keywords,
    };

    // 3. Aggregate 생성 (Command 전달)
    const aggregate = VideoSummaryAggregate.createVideoSummary(command);

    // 4. Aggregate 저장 (트랜잭션)
    await videoSummaryRepository.create(aggregate);

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
        'VIDEO_SUMMARY_CREATION_FAILED',
        error instanceof Error ? error.message : 'Failed to create video summary',
        {
          videoId: safeDto.videoId,
          language: safeDto.language,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}
