/**
 * Video Summary 추출 서비스
 *
 * 비즈니스 로직 오케스트레이션을 담당하는 서비스
 * - 기존 요약 확인
 * - 요약 생성
 * - VideoSummary 저장
 * - 블록 권한 업데이트
 *
 * ⚠️ Action Transaction 관리는 Action 레이어에서 처리합니다.
 */

import { Result } from '@/utils/result';

import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import { YoutubeBlockPropertiesVO } from '@/domains/block-management/shared/value-objects/block-properties';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { DrizzleVideoSummaryRepository } from '../../repositories/implementations/drizzle-video-summary.repository';
import { createVideoSummary } from './create-video-summary.service';
import { generateVideoSummary } from './generate-video-summary.service';
import type { CreateVideoSummaryRequest } from '../../../shared/dtos/requests/video-summary.requests';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import { VideoAggregate } from '../../../shared/aggregates/video.aggregate';
import { VideoSummaryAggregate } from '../../../shared/aggregates/video-summary.aggregate';

export interface ExtractVideoSummaryServiceRequest {
  videoAggregate: VideoAggregate;
  blockAggregate: BlockAggregate;
  youtubeProperties: YoutubeBlockPropertiesVO;
  language: string;
}

export interface ExtractVideoSummaryServiceResult {
  summaryText: string;
  summaryAggregate: VideoSummaryAggregate;
}

/**
 * Video Summary 추출 서비스
 *
 * 비즈니스 로직 오케스트레이션:
 * 1. 기존 요약 확인
 * 2. 요약 생성
 * 3. VideoSummary 저장
 * 4. 블록 권한 업데이트
 *
 * ⚠️ Action Transaction 관리는 Action 레이어에서 처리합니다.
 *
 * @param request - 추출 요청
 * @param repositories - 필요한 Repository들
 * @returns 추출 결과
 */
export async function extractVideoSummaryService(
  request: ExtractVideoSummaryServiceRequest,
  repositories: {
    videoSummaryRepository: DrizzleVideoSummaryRepository;
    blockRepository: DrizzleBlockRepository;
  }
): Promise<Result<ExtractVideoSummaryServiceResult, YoutubeError>> {
  const {
    videoAggregate,
    blockAggregate,
    youtubeProperties,
    language,
  } = request;

  const { videoSummaryRepository, blockRepository } = repositories;

  const videoId = videoAggregate.getVideo().id.value;

  try {
    // 1. 이미 해당 언어의 요약이 있는지 확인
    const existingSummary = await videoSummaryRepository.findByVideoIdAndLanguage(
      videoId,
      language
    );

    if (existingSummary) {
      // 이미 존재하면 기존 요약 반환
      return Result.success({
        summaryText: existingSummary.getSummary().summary,
        summaryAggregate: existingSummary,
      });
    }

    // 2. 요약 생성
    const generateResult = await generateVideoSummary({
      videoAggregate,
      language,
    });

    if (generateResult.isError()) {
      return Result.error(generateResult.error);
    }

    const summaryText = generateResult.value;

    // 3. VideoSummary 생성 및 저장
    const createSummaryRequest: CreateVideoSummaryRequest = {
      videoId,
      language,
      summary: summaryText,
    };

    const createSummaryResult = await createVideoSummary(
      createSummaryRequest,
      videoSummaryRepository
    );

    if (createSummaryResult.isError()) {
      return Result.error(createSummaryResult.error);
    }

    const summaryAggregate = createSummaryResult.value;

    // 4. 블록 레벨 권한 설정 (summaryAccessGrantedLanguages)
    // 언어별 접근 권한을 배열로 관리
    const currentLanguages =
      youtubeProperties.summaryAccessGrantedLanguages || [];
    if (!currentLanguages.includes(language)) {
      const block = blockAggregate.getBlock();
      block.updatePropertiesFromRecord({
        summaryAccessGrantedLanguages: [...currentLanguages, language],
      });
      await blockRepository.update(block);
    }

    return Result.success({
      summaryText,
      summaryAggregate,
    });
  } catch (error) {
    return Result.error(
      new YoutubeError(
        'EXTRACT_SUMMARY_FAILED',
        error instanceof Error ? error.message : 'Failed to extract video summary',
        {
          videoId,
          language,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}
