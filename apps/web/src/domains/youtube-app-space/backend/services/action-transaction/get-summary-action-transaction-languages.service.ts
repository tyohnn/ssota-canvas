/**
 * Summary Action Transaction 언어 목록 조회 서비스 로직
 *
 * 특정 org + video + action_type에 대한 언어 목록을 조회합니다.
 * 주로 extract_summary 액션의 언어 목록 조회에 사용됩니다.
 */
import { Result } from '@/utils/result';

import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import type { IActionTransactionRepository } from '../../repositories/interfaces/action-transaction.repository.interface';

/**
 * Summary Action Transaction 언어 목록 조회 요청
 */
export interface GetSummaryActionTransactionLanguagesRequest {
  orgId: string;
  videoId: string;
}

/**
 * Summary Action Transaction 언어 목록 조회
 *
 * @param request - 조회 요청 (orgId, videoId, actionType)
 * @param transactionRepository - Action Transaction Repository
 * @returns 언어 목록 (중복 제거, 정렬됨)
 */
export async function getSummaryActionTransactionLanguages(
  request: GetSummaryActionTransactionLanguagesRequest,
  transactionRepository: IActionTransactionRepository
): Promise<Result<string[], YoutubeError>> {
  try {
    // 1. Repository에서 언어 목록 조회
    const languages =
      await transactionRepository.findAllLanguagesByOrgAndVideoOfSummaryType(
        request.orgId,
        request.videoId
      );

    return Result.success(languages);
  } catch (error) {
    // YoutubeError인 경우 그대로 반환
    if (error instanceof YoutubeError) {
      return Result.error(error);
    }

    return Result.error(
      new YoutubeError(
        'ACTION_TRANSACTION_LANGUAGES_QUERY_FAILED',
        error instanceof Error
          ? error.message
          : 'Failed to get summary action transaction languages',
        {
          orgId: request.orgId,
          videoId: request.videoId,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}
