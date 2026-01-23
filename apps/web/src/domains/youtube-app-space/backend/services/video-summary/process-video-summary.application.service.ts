/**
 * Video Summary 처리 서비스
 *
 * 비즈니스 로직 오케스트레이션을 담당하는 서비스
 * - 스크립트 확인 및 처리 (없으면 자동 처리)
 * - 요약 액세스 권한 확인 (summaryAccessGrantedLanguages 또는 action_transactions)
 * - 권한이 있으면 요약 추출
 * - 권한이 없으면 에러
 */

import { Result } from '@/utils/result';

import { Block } from '@/domains/block-management/shared/entities/block.entity';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import { VideoSummaryAggregate } from '../../../shared/aggregates/video-summary.aggregate';
import type { IActionTransactionRepository } from '../../repositories/interfaces/action-transaction.repository.interface';
import type { IVideoRepository } from '../../repositories/interfaces/video.repository.interface';
import type { IVideoSummaryRepository } from '../../repositories/interfaces/video-summary.repository.interface';
import type { YoutubeBlockPropertiesVO } from '@/domains/block-management/shared/value-objects/block-properties';
import type { IBlockRepository } from '@/domains/block-management/backend/repositories/interfaces/block.repository.interface';
import { extractAndUpdateSummary } from './extract-and-update-summary.service';

export interface ProcessVideoSummaryServiceRequest {
  orgId: string; // Action Transaction 생성을 위한 orgId
  videoId: string; // Video ID (UUID)
  block: Block; // 검증된 Block Entity
  youtubeProperties: YoutubeBlockPropertiesVO;
  language?: string; // 요청에서 명시적 language (선택적)
  videoScriptLanguage?: string; // 비디오의 scriptLanguage (fallback용)
}

export interface ProcessVideoSummaryServiceResult {
  summaryAggregate: VideoSummaryAggregate; // 생성된 요약 Aggregate
}

/**
 * Process Video Summary Service Repositories Interface
 *
 * 테스트 용이성을 위한 Repository 인터페이스 모음
 */
export interface ProcessVideoSummaryServiceRepositories {
  videoRepository: IVideoRepository;
  blockRepository: IBlockRepository;
  videoSummaryRepository: IVideoSummaryRepository;
  actionTransactionRepository: IActionTransactionRepository;
}

/**
 * 사용자 선호 언어 결정 (fallback 체인)
 *
 * 1차: 요청에서 명시적 language 파라미터
 * 2차 (향후): user profile의 preferredLanguage
 * 3차 (fallback): 비디오의 scriptLanguage 또는 'en'
 */
function getUserPreferredLanguage(
  requestedLanguage?: string,
  videoScriptLanguage?: string
): string {
  // 1차: 요청에서 명시적 language
  if (requestedLanguage) {
    return requestedLanguage;
  }

  // TODO: 향후 user profile에서 preferredLanguage 가져오기
  // const userProfile = context.authenticatedUser.profile;
  // if (userProfile?.preferredLanguage) {
  //   return userProfile.preferredLanguage;
  // }

  // 3차 (fallback): 비디오의 scriptLanguage 또는 'en'
  return videoScriptLanguage || 'en';
}

/**
 * Video Summary 처리 서비스
 *
 * 비즈니스 로직 오케스트레이션:
 * 1. 스크립트 처리 (있으면 그대로, 없으면 자동 처리)
 * 2. 요약 액세스 권한 확인 (summaryAccessGrantedLanguages 또는 action_transactions)
 * 3. 권한이 있으면 요약 추출
 * 4. 권한이 없으면 에러
 *
 * @param request - 처리 요청
 * @param repositories - 필요한 Repository들
 * @returns 처리 결과 (생성된 요약 Aggregate)
 */
export async function processVideoSummaryService(
  request: ProcessVideoSummaryServiceRequest,
  repositories: ProcessVideoSummaryServiceRepositories
): Promise<Result<ProcessVideoSummaryServiceResult, YoutubeError>> {
  const { orgId, videoId, block, youtubeProperties, language: requestedLanguage, videoScriptLanguage } = request;
  const { videoRepository, blockRepository, videoSummaryRepository, actionTransactionRepository } = repositories;

  // 1. 언어 결정 (fallback 체인)
  const language = getUserPreferredLanguage(requestedLanguage, videoScriptLanguage);

  // 2. 요약 액세스 권한 확인
  // 2-1. 블록의 summaryAccessGrantedLanguages 확인 (빠른 경로)
  if (youtubeProperties.summaryAccessGrantedLanguages?.includes(language)) {
    // 권한이 있으면 요약 확인 후 바로 반환
    const existingSummary = await videoSummaryRepository.findByVideoIdAndLanguage(
      videoId,
      language
    );

    if (existingSummary) {
      // 이미 요약이 있으면 바로 반환
      return Result.success({
        summaryAggregate: existingSummary,
      });
    }

    // 요약이 없으면 새로 생성
    // 권한이 존재하는데 요약이 없는 예상치 못한 케이스. 거의 존재하지 않음
    return await extractAndUpdateSummary({
      block,
      orgId,
      videoId,
      language,
      repositories,
      youtubeProperties,
    });
  }

  // 2-2. org의 action_transactions 확인
  // 이미 추출했던 요약을 새롭게 추가한 경우에 summaryAccessGrantedLanguages에 없을 수 있음
  const actionTransaction = await actionTransactionRepository.findByOrgVideoAndLanguage(
    orgId,
    videoId,
    'extract_summary',
    language
  );

  if (actionTransaction) {
    // action transaction이 있으면 먼저 요약이 이미 존재하는지 확인
    // (같은 org의 다른 블록에서 이미 생성되었을 수 있음)
    const existingSummary = await videoSummaryRepository.findByVideoIdAndLanguage(
      videoId,
      language
    );

    if (existingSummary) {
      // 이미 요약이 있으면 블록의 access granted만 업데이트하고 반환
      const currentLanguages = block.getAllProperties().summaryAccessGrantedLanguages || [];
      if (!currentLanguages.includes(language)) {
        block.updatePropertiesFromRecord({
          summaryAccessGrantedLanguages: [...currentLanguages, language],
        });
        await blockRepository.update(block);
      }

      return Result.success({
        summaryAggregate: existingSummary,
      });
    }

    // 요약이 없으면 새로 생성
    // 권한이 존재하는데 요약이 없는 예상치 못한 케이스. 거의 존재하지 않음
    return await extractAndUpdateSummary({
      block,
      orgId,
      videoId,
      language,
      repositories,
      youtubeProperties,
      existingActionTransaction: actionTransaction,
    });
  }

  // 권한 없음
  return Result.error(
    new YoutubeError(
      'EXTRACT_SUMMARY_FAILED',
      'Summary not extracted. Please extract summary first.',
      {
        videoId,
        language,
      }
    )
  );
}