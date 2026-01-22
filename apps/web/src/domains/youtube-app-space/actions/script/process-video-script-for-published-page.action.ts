/**
 * Published Page용 Video 스크립트 처리 Action
 *
 * 패턴: withPublishedPageSecureAction HOF 사용
 *
 * ⚠️ Security: withPublishedPageSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Publish Token 검증
 * 2. Block 소속 확인 (해당 published page에 속하는지)
 * 3. YouTube ID 일치 확인
 * 4. Org Scope 제한 (해당 page의 org만 조회)
 *
 * ✅ 서버 액션에서 서비스들을 조합해서 사용하는 방식
 * 1. 스크립트 확인 및 처리 (있으면 그대로, 없으면 자동 처리)
 * 2. Action Transaction 생성 및 완료
 */

'use server';

import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../../../block-management/backend/repositories/implementations/drizzle-block.repository';
import { DrizzleActionTransactionRepository } from '../../backend/repositories/implementations/drizzle-action-transaction.repository';
import { DrizzleVideoRepository } from '../../backend/repositories/implementations/drizzle-video.repository';
import { processVideoScriptService } from '../../backend/services/script';
import {
  type ProcessVideoScriptForPublishedPageRequest,
  ProcessVideoScriptForPublishedPageRequestSchema,
} from '../../shared/dtos/requests/video.requests';
import type { ProcessVideoScriptDTO } from '../../shared/dtos/responses/video.responses';
import {
  type PublishedPageContext,
  withPublishedPageSecureAction,
} from '../secure-action';

/**
 * Published Page용 Video 스크립트 처리 Action
 */
export const processVideoScriptForPublishedPageAction = withPublishedPageSecureAction(
  ProcessVideoScriptForPublishedPageRequestSchema,
  'processVideoScriptForPublishedPageAction',
  processVideoScriptForPublishedPageInternal,
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
 * ⚠️ 이 함수는 이미 검증된 요청만 받습니다
 * - Publish Token 검증 완료
 * - Block 소속 확인 완료
 * - YouTube ID 일치 확인 완료
 * - PublishedPageContext에 block, orgId, youtubeProperties 포함됨
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 Published Page 정보
 */
async function processVideoScriptForPublishedPageInternal(
  safeDto: ProcessVideoScriptForPublishedPageRequest,
  context: PublishedPageContext
): Promise<ActionResult<ProcessVideoScriptDTO>> {
  try {
    // Note: Publish Token, Block 소속, YouTube ID 검증은 withPublishedPageSecureAction에서 이미 수행됨
    // context.block과 context.youtubeProperties는 이미 검증된 안전한 데이터

    // 스크립트 처리 서비스 호출 (Action Transaction 포함)
    const blockRepository = new DrizzleBlockRepository();
    const videoRepository = new DrizzleVideoRepository();
    const actionTransactionRepository = new DrizzleActionTransactionRepository();

    const processScriptResult = await processVideoScriptService(
      {
        orgId: context.orgId, // Published page의 org ID
        videoId: safeDto.youtubeId,
        block: context.block, // 검증된 Block Entity 직접 사용
        youtubeProperties: context.youtubeProperties, // 검증된 YouTube Properties
      },
      {
        videoRepository,
        blockRepository,
        actionTransactionRepository,
      }
    );

    if (processScriptResult.isError()) {
      return err(processScriptResult.error.message, {
        code: processScriptResult.error.code,
        meta: processScriptResult.error.details,
      });
    }

    // Response DTO 생성 (스크립트가 없을 때는 script: undefined)
    const response: ProcessVideoScriptDTO = {
      youtube: processScriptResult.value.videoAggregate.toView(),
    };

    return ok(response);
  } catch (error) {
    console.error('[processVideoScriptForPublishedPageInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
