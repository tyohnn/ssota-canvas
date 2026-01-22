/**
 * Published Page용 사용 가능한 요약 언어 목록 조회 Action
 *
 * ⚠️ Security: Publish Token 기반 인증 (비로그인 유저 지원)
 * 3단계 검증은 withPublishedPageSecureAction HOF에서 처리
 * 4. Org Scope 제한 (해당 page의 org만 조회)
 *
 * ✅ 서버 액션에서 서비스들을 조합해서 사용하는 방식
 * 1. summaryAccessGrantedLanguages 확인 (빠른 경로)
 * 2. 없으면 action_transactions에서 언어 목록 조회 (해당 page의 org만)
 * 3. 언어 목록만 반환 (summary 내용은 X)
 */

'use server';

import { ActionResult, err, ok } from '@/lib';

import { DrizzleActionTransactionRepository } from '../../backend/repositories/implementations/drizzle-action-transaction.repository';
import {
  getSummaryActionTransactionLanguages,
} from '../../backend/services/action-transaction';
import {
  type GetAvailableSummaryLangListForPublishedPageRequest,
  GetAvailableSummaryLangListForPublishedPageRequestSchema,
} from '../../shared/dtos/requests/video-summary.requests';
import type { GetAvailableSummaryLanguagesDTO } from '../../shared/dtos/responses/video-summary.responses';
import {
  type PublishedPageContext,
  withPublishedPageSecureAction,
} from '../secure-action';

/**
 * Published Page용 사용 가능한 요약 언어 목록 조회 Action
 */
export const getAvailableSummaryLangListForPublishedPageAction =
  withPublishedPageSecureAction(
    GetAvailableSummaryLangListForPublishedPageRequestSchema,
    'getAvailableSummaryLangListForPublishedPageAction',
    getAvailableSummaryLangListForPublishedPageInternal,
    {
      getLogMetadata: req => ({
        publishToken: req.publishToken,
        blockId: req.blockId,
        youtubeId: req.youtubeId,
      }),
    }
  );

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 PublishedPageContext만 받습니다
 * - Publish Token 검증 완료
 * - Block 소속 확인 완료
 * - YouTube ID 일치 확인 완료
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 PublishedPageContext
 */
async function getAvailableSummaryLangListForPublishedPageInternal(
  safeDto: GetAvailableSummaryLangListForPublishedPageRequest,
  context: PublishedPageContext
): Promise<ActionResult<GetAvailableSummaryLanguagesDTO>> {
  try {
    const { youtubeProperties, orgId } = context;

    // 1. 1단계: 블록의 summaryAccessGrantedLanguages 확인 (빠른 경로)
    if (
      youtubeProperties.summaryAccessGrantedLanguages &&
      youtubeProperties.summaryAccessGrantedLanguages.length > 0
    ) {
      return ok({
        languages: youtubeProperties.summaryAccessGrantedLanguages,
      });
    }

    // 2. 2단계: Layer 4 - Org Scope 제한 (해당 page의 org만 조회)
    const actionTransactionRepository =
      new DrizzleActionTransactionRepository();

    const languagesResult = await getSummaryActionTransactionLanguages(
      {
        orgId,
        videoId: safeDto.youtubeId,
      },
      actionTransactionRepository
    );

    if (languagesResult.isError()) {
      return err(languagesResult.error.message, {
        code: languagesResult.error.code,
      });
    }

    return ok({ languages: languagesResult.value });
  } catch (error) {
    console.error(
      '[getAvailableSummaryLangListForPublishedPageInternal] Internal error:',
      error
    );
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
