/**
 * Video 스크립트 처리 Action
 *
 * 패턴: withYoutubeBlockSecureAction HOF 사용
 *
 * ⚠️ Security: withYoutubeBlockSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Block 권한 및 타입 검증 (YouTube 블록인지 확인)
 *
 * ✅ 서버 액션에서 서비스들을 조합해서 사용하는 방식
 * 1. 스크립트 확인 및 처리 (있으면 그대로, 없으면 자동 처리)
 * 2. Action Transaction 생성 및 완료
 */

'use server';

import { ActionResult, err, ok } from '@/lib';

import { DrizzleActionTransactionRepository } from '../../backend/repositories/implementations/drizzle-action-transaction.repository';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { DrizzleVideoRepository } from '../../backend/repositories/implementations/drizzle-video.repository';
import { processVideoScriptService } from '../../backend/services/script';
import {
  type ProcessVideoScriptRequest,
  ProcessVideoScriptRequestSchema,
} from '../../shared/dtos/requests/video.requests';
import type { ProcessVideoScriptDTO } from '../../shared/dtos/responses/video.responses';
import {
  type YoutubeBlockActionContext,
  withYoutubeBlockSecureAction,
} from '../secure-action';

/**
 * Video 스크립트 처리 Action (blockId 기반)
 */
export const processVideoScriptAction = withYoutubeBlockSecureAction(
  ProcessVideoScriptRequestSchema,
  'processVideoScriptAction',
  processVideoScriptInternal,
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
 * - Block 권한 및 타입 검증 완료
 * - youtubeId 검증 완료 (요청에 있는 경우)
 * - Block Entity와 YouTube Properties가 context에 포함됨
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스, Block 정보
 */
async function processVideoScriptInternal(
  safeDto: ProcessVideoScriptRequest,
  context: YoutubeBlockActionContext
): Promise<ActionResult<ProcessVideoScriptDTO>> {
  try {
    // Note: Block 조회, 타입 검증, youtubeId 검증은 withYoutubeBlockSecureAction에서 이미 수행됨
    // context.block과 context.youtubeProperties는 이미 검증된 안전한 데이터
    // 스크립트 처리 서비스 호출 (Action Transaction 포함)
    const videoRepository = new DrizzleVideoRepository();
    const blockRepository = new DrizzleBlockRepository();
    const actionTransactionRepository = new DrizzleActionTransactionRepository();

    const processScriptResult = await processVideoScriptService(
      {
        orgId: context.organization.id,
        videoId: safeDto.youtubeId,
        block: context.block, // 검증된 Block Entity 직접 사용
        youtubeProperties: context.youtubeProperties,
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
    console.error('[processVideoScriptInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
