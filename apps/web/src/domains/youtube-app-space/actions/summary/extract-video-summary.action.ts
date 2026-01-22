/**
 * Video 요약 추출 Action (언어별)
 *
 * 패턴: withYoutubeBlockSecureAction HOF 사용
 *
 * ⚠️ Security: withYoutubeBlockSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Block 권한 및 타입 검증 (YouTube 블록인지 확인)
 *
 * ✅ 서버 액션에서 추출만 수행 (조회와 분리)
 * 1. 요약 추출 및 저장
 * 2. Action Transaction 생성 및 완료
 */

'use server';

import { ActionResult, err, ok } from '@/lib';

import { DrizzleActionTransactionRepository } from '../../backend/repositories/implementations/drizzle-action-transaction.repository';
import { DrizzleBlockRepository } from '../../../block-management/backend/repositories/implementations/drizzle-block.repository';
import { DrizzleVideoRepository } from '../../backend/repositories/implementations/drizzle-video.repository';
import { DrizzleVideoSummaryRepository } from '../../backend/repositories/implementations/drizzle-video-summary.repository';
import { extractAndUpdateSummary } from '../../backend/services/video-summary';
import {
  type ExtractVideoSummaryRequest,
  ExtractVideoSummaryRequestSchema,
} from '../../shared/dtos/requests/video-summary.requests';
import type { ExtractSummaryDTO } from '../../shared/dtos/responses/video-summary.responses';
import {
  type YoutubeBlockActionContext,
  withYoutubeBlockSecureAction,
} from '../secure-action';

/**
 * Video 요약 추출 Action (언어별)
 */
export const extractVideoSummaryAction = withYoutubeBlockSecureAction(
  ExtractVideoSummaryRequestSchema,
  'extractVideoSummaryAction',
  extractVideoSummaryInternal,
  {
    getLogMetadata: req => ({
      blockId: req.blockId,
      youtubeId: req.youtubeId,
      language: req.language,
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
async function extractVideoSummaryInternal(
  safeDto: ExtractVideoSummaryRequest,
  context: YoutubeBlockActionContext
): Promise<ActionResult<ExtractSummaryDTO>> {
  try {
    // Note: Block 조회, 타입 검증, youtubeId 검증은 withYoutubeBlockSecureAction에서 이미 수행됨
    // context.block과 context.youtubeProperties는 이미 검증된 안전한 데이터

    // 요약 추출 서비스 호출 (추출 전용)
    const blockRepository = new DrizzleBlockRepository();
    const videoRepository = new DrizzleVideoRepository();
    const videoSummaryRepository = new DrizzleVideoSummaryRepository();
    const actionTransactionRepository = new DrizzleActionTransactionRepository();

    const extractResult = await extractAndUpdateSummary({
      block: context.block,
      orgId: context.organization.id,
      videoId: safeDto.youtubeId,
      language: safeDto.language || 'en',
      repositories: {
        videoRepository,
        blockRepository,
        videoSummaryRepository,
        actionTransactionRepository,
      },
      youtubeProperties: context.youtubeProperties,
    });

    if (extractResult.isError()) {
      return err(extractResult.error.message, {
        code: extractResult.error.code,
        meta: extractResult.error.details,
      });
    }

    // Response DTO 생성
    const response: ExtractSummaryDTO = {
      summary: extractResult.value.summaryAggregate.toView(),
    };

    return ok(response);
  } catch (error) {
    console.error('[extractVideoSummaryInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}