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
 * ✅ 서버 액션에서 서비스들을 조합해서 사용하는 방식
 * 1. 언어 결정 (사용자 프로필 기반, fallback)
 * 2. Action Transaction 생성 (language 포함)
 * 3. TODO: 실제 요약 생성 로직 (향후 구현)
 * 4. VideoSummary Aggregate 생성 및 저장
 * 5. Action Transaction 완료
 */

'use server';

import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { ActionResult, err, isFailure, ok } from '@/lib';

import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import { DrizzleActionTransactionRepository } from '../../backend/repositories/implementations/drizzle-action-transaction.repository';
import { DrizzleVideoRepository } from '../../backend/repositories/implementations/drizzle-video.repository';
import { DrizzleVideoSummaryRepository } from '../../backend/repositories/implementations/drizzle-video-summary.repository';
import { createActionTransaction } from '../../backend/services/action-transaction';
import { extractVideoSummaryService } from '../../backend/services/video-summary/extract-video-summary.service';
import { ActionTransactionAggregate } from '../../shared/aggregates/action-transaction.aggregate';
import { CompleteActionTransactionCommand } from '../../shared/commands/action-transaction.commands';
import { extractVideoScriptAction } from '../script/extract-video-script.action';
import {
  type ExtractVideoSummaryRequest,
  ExtractVideoSummaryRequestSchema,
} from '../../shared/dtos/requests/video-summary.requests';
import type { ExtractSummaryDTO } from '../../shared/dtos/responses/video-summary.responses';
import { YoutubeError } from '../../shared/errors/youtube-app-space.error';
import { withYoutubeBlockSecureAction } from '../secure-action';

/**
 * Video 요약 추출 Action (blockId 기반, 언어별)
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
 * 사용자 선호 언어 결정 (fallback 체인)
 *
 * 1차: 요청에서 명시적 language 파라미터
 * 2차 (향후): user profile의 preferredLanguage
 * 3차 (fallback): 비디오의 scriptLanguage 또는 'en'
 */
function getUserPreferredLanguage(
  context: WorkspaceActionContext,
  videoScriptLanguage?: string
): string {
  // TODO: 향후 user profile에서 preferredLanguage 가져오기
  // const userProfile = context.authenticatedUser.profile;
  // if (userProfile?.preferredLanguage) {
  //   return userProfile.preferredLanguage;
  // }

  // Fallback: 비디오의 scriptLanguage 또는 'en'
  return videoScriptLanguage || 'en';
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 * - Block 권한 및 타입 검증 완료
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스 정보
 */
async function extractVideoSummaryInternal(
  safeDto: ExtractVideoSummaryRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<ExtractSummaryDTO>> {
  try {
    // 1. Block 조회하여 youtubeId 추출 (검증용)
    const blockRepository = new DrizzleBlockRepository();
    const blockEntity = await blockRepository.findById(new BlockId(safeDto.blockId));

    if (!blockEntity) {
      return err('Block not found', { code: 'BLOCK_NOT_FOUND' });
    }

    // Block을 BlockAggregate로 변환
    const block = BlockAggregate.reconstitute(blockEntity);

    // 2. Block 타입이 youtube인지 확인
    if (block.getBlock().blockType.value !== 'youtube') {
      return err('Block is not a YouTube block', {
        code: 'INVALID_BLOCK_TYPE',
      });
    }

    // 3. Block Properties를 타입 안전하게 변환
    const properties = block.getBlock().properties;
    let youtubeProperties: YoutubeBlockPropertiesVO;
    try {
      const propertiesJSON = properties.toJSON() as YoutubeBlockProperties;
      youtubeProperties = YoutubeBlockPropertiesVO.fromJSON(propertiesJSON);
    } catch (error) {
      return err('Invalid YouTube block properties', {
        code: 'INVALID_BLOCK_PROPERTIES',
        meta: {
          originalError:
            error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    // 4. youtubeId 추출 및 검증
    const blockYoutubeId = youtubeProperties.youtubeId;
    if (!blockYoutubeId) {
      return err('YouTube ID not found in block properties', {
        code: 'YOUTUBE_ID_NOT_FOUND',
      });
    }

    // 5. Block properties의 youtubeId와 요청의 youtubeId가 일치하는지 검증
    if (blockYoutubeId !== safeDto.youtubeId) {
      return err('YouTube ID mismatch', {
        code: 'YOUTUBE_ID_MISMATCH',
      });
    }

    // 6. Video 조회 (youtubeId는 UUID이므로 findById 사용)
    const videoRepository = new DrizzleVideoRepository();
    let aggregate = await videoRepository.findById(safeDto.youtubeId);

    if (!aggregate) {
      return err('Video not found', { code: 'VIDEO_NOT_FOUND' });
    }

    let video = aggregate.getVideo();

    // 7. 스크립트가 있는지 확인하고, 없으면 자동으로 추출
    if (!video.hasScript()) {
      // 스크립트 추출 Action 호출
      const extractScriptResult = await extractVideoScriptAction({
        blockId: safeDto.blockId,
        youtubeId: safeDto.youtubeId,
      });

      if (isFailure(extractScriptResult)) {
        return err('Failed to extract script before summary generation', {
          code: 'SCRIPT_EXTRACTION_FAILED',
          meta: {
            originalError:
              typeof extractScriptResult.error === 'string'
                ? extractScriptResult.error
                : (extractScriptResult.error as any)?.message || 'Unknown error',
            videoId: safeDto.youtubeId,
          },
        });
      }

      // 스크립트 추출 후 Video aggregate 다시 조회
      const updatedAggregate = await videoRepository.findById(safeDto.youtubeId);
      if (!updatedAggregate) {
        return err('Video not found after script extraction', {
          code: 'VIDEO_NOT_FOUND',
        });
      }

      // aggregate 업데이트
      aggregate = updatedAggregate;
      video = aggregate.getVideo();
      if (!video.hasScript()) {
        return err('Script extraction completed but script not found', {
          code: 'SCRIPT_NOT_FOUND_AFTER_EXTRACTION',
          meta: {
            videoId: safeDto.youtubeId,
          },
        });
      }
    }

    // 8. 언어 결정 (fallback 체인)
    const language =
      safeDto.language ||
      getUserPreferredLanguage(context, video.scriptLanguage);

    // 9. Action Transaction 확인 또는 생성 (org_id 기반, language 포함)
    // Unique constraint로 인해 같은 (org_id, video_id, action_type, language) 조합은 하나만 존재
    const actionTransactionRepository =
      new DrizzleActionTransactionRepository();

    // 기존 트랜잭션 확인
    const existingTransaction = await actionTransactionRepository.findByOrgVideoAndLanguage(
      context.organization.id,
      safeDto.youtubeId,
      'extract_summary',
      language
    );

    let actionTransactionAggregate: ActionTransactionAggregate;

    if (existingTransaction) {
      // 기존 트랜잭션이 있으면 재사용
      actionTransactionAggregate = existingTransaction;
    } else {
      // 새 트랜잭션 생성
      const createTransactionResult = await createActionTransaction(
        {
          orgId: context.organization.id,
          videoId: safeDto.youtubeId,
          actionType: 'extract_summary',
          language,
        },
        actionTransactionRepository
      );

      if (createTransactionResult.isError()) {
        return err('Failed to create action transaction', {
          code: 'ACTION_TRANSACTION_CREATION_FAILED',
          meta: {
            originalError: String(createTransactionResult.error),
          },
        });
      }

      actionTransactionAggregate = createTransactionResult.value;
    }

    // 10. 요약 추출 서비스 호출 (비즈니스 로직 오케스트레이션)
    const videoSummaryRepository = new DrizzleVideoSummaryRepository();
    // blockRepository는 이미 95번째 줄에서 선언됨

    const extractResult = await extractVideoSummaryService(
      {
        videoAggregate: aggregate,
        blockAggregate: block,
        youtubeProperties,
        language,
      },
      {
        videoSummaryRepository,
        blockRepository,
      }
    );

    if (extractResult.isError()) {
      // Action Transaction 완료 처리 (실패로 표시)
      const completeCommand: CompleteActionTransactionCommand = {
        transactionId: actionTransactionAggregate.getTransaction().id.value,
      };
      actionTransactionAggregate.complete(completeCommand);
      await actionTransactionRepository.update(actionTransactionAggregate);

      return err(extractResult.error.message, {
        code: extractResult.error.code,
        meta: extractResult.error.details,
      });
    }

    // 11. Action Transaction 완료 처리
    const completeCommand: CompleteActionTransactionCommand = {
      transactionId: actionTransactionAggregate.getTransaction().id.value,
    };
    actionTransactionAggregate.complete(completeCommand);
    await actionTransactionRepository.update(actionTransactionAggregate);

    // 12. Response DTO 생성
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
