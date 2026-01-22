/**
 * 사용 가능한 요약 언어 목록 조회 Action
 *
 * 패턴: withYoutubeBlockSecureAction HOF 사용
 *
 * ⚠️ Security: withYoutubeBlockSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Block 권한 및 타입 검증 (YouTube 블록인지 확인)
 *
 * ✅ 서버 액션에서 서비스들을 조합해서 사용하는 방식
 * 1. Block의 summaryAccessGrantedLanguages 확인 (빠른 경로)
 * 2. 없으면 org의 action_transactions에서 언어 목록 조회
 * 3. 언어 목록만 반환 (summary 내용은 X)
 *
 * 사용 사례:
 * - summaryAccessGrantedLanguages가 비어있는 새 블록
 * - Language selector에 표시할 언어 목록 필요
 * - 실제 summary 내용은 로드하지 않고 언어 목록만 필요
 */

'use server';

import { ActionResult, err, ok } from '@/lib';

import { DrizzleActionTransactionRepository } from '../../backend/repositories/implementations/drizzle-action-transaction.repository';
import {
  getSummaryActionTransactionLanguages,
} from '../../backend/services/action-transaction';
import {
  type GetAvailableSummaryLangListRequest,
  GetAvailableSummaryLangListRequestSchema,
} from '../../shared/dtos/requests/video-summary.requests';
import type { GetAvailableSummaryLanguagesDTO } from '../../shared/dtos/responses/video-summary.responses';
import {
  type YoutubeBlockActionContext,
  withYoutubeBlockSecureAction,
} from '../secure-action';

/**
 * 사용 가능한 요약 언어 목록 조회 Action
 */
export const getAvailableSummaryLangListAction = withYoutubeBlockSecureAction(
  GetAvailableSummaryLangListRequestSchema,
  'getAvailableSummaryLangListAction',
  getAvailableSummaryLangListInternal,
  {
    getLogMetadata: req => ({
      blockId: req.blockId,
      youtubeId: req.youtubeId,
    }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 * - Block 권한 및 타입 검증 완료 (withYoutubeBlockSecureAction에서 수행)
 * - youtubeId 검증 완료 (요청에 있는 경우)
 * - Block Entity와 YouTube Properties가 context에 포함됨
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스, Block 정보
 */
async function getAvailableSummaryLangListInternal(
  safeDto: GetAvailableSummaryLangListRequest,
  context: YoutubeBlockActionContext
): Promise<ActionResult<GetAvailableSummaryLanguagesDTO>> {
  try {
    // Note: Block 조회, 타입 검증, youtubeId 검증은 withYoutubeBlockSecureAction에서 이미 수행됨

    // 1. 1단계: 블록의 summaryAccessGrantedLanguages 확인 (빠른 경로)
    if (
      context.youtubeProperties.summaryAccessGrantedLanguages &&
      context.youtubeProperties.summaryAccessGrantedLanguages.length > 0
    ) {
      // 블록에 이미 언어 목록이 있으면 즉시 반환
      return ok({
        languages: context.youtubeProperties.summaryAccessGrantedLanguages,
      });
    }

    // 2. 2단계: Org의 action_transactions에서 언어 목록 조회
    if (!context.organization?.id) {
      // 익명 유저는 action_transaction 확인 불가
      return ok({ languages: [] });
    }

    const actionTransactionRepository =
      new DrizzleActionTransactionRepository();

    // 서비스를 통해 언어 목록 조회
    const languagesResult = await getSummaryActionTransactionLanguages(
      {
        orgId: context.organization.id,
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
      '[getAvailableSummaryLangListInternal] Internal error:',
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
