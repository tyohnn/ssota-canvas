/**
 * Video 스크립트 추출 Action
 *
 * 패턴: withYoutubeBlockSecureAction HOF 사용
 *
 * ⚠️ Security: withYoutubeBlockSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Block 권한 및 타입 검증 (YouTube 블록인지 확인)
 *
 * ✅ 서버 액션에서 서비스들을 조합해서 사용하는 방식
 * 1. Action Transaction 생성
 * 2. extractTranscript 호출 (YouTube API)
 * 3. updateScript로 업데이트하고 저장
 * 4. Action Transaction 완료
 */

'use server';

import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../../../block-management/backend/repositories/implementations/drizzle-block.repository';
import { BlockId } from '../../../block-management/shared/value-objects/block-id.vo';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '../../../block-management/shared/value-objects/block-properties';
import { DrizzleActionTransactionRepository } from '../../backend/repositories/implementations/drizzle-action-transaction.repository';
import { DrizzleVideoRepository } from '../../backend/repositories/implementations/drizzle-video.repository';
import { createActionTransaction } from '../../backend/services/action-transaction';
import { extractTranscript } from '../../backend/services/youtube-api/extract-transcript.service';
import { CompleteActionTransactionCommand } from '../../shared/commands/action-transaction.commands';
import { UpdateScriptCommand } from '../../shared/commands/video.commands';
import {
  type ExtractVideoScriptRequest,
  ExtractVideoScriptRequestSchema,
} from '../../shared/dtos/requests/video.requests';
import type { ExtractScriptDTO } from '../../shared/dtos/responses/video.responses';
import { YoutubeError } from '../../shared/errors/youtube-app-space.error';
import { withYoutubeBlockSecureAction } from '../secure-action';

/**
 * Video 스크립트 추출 Action (blockId 기반)
 */
export const extractVideoScriptAction = withYoutubeBlockSecureAction(
  ExtractVideoScriptRequestSchema,
  'extractVideoScriptAction',
  extractVideoScriptInternal,
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
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스 정보
 */
async function extractVideoScriptInternal(
  safeDto: ExtractVideoScriptRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<ExtractScriptDTO>> {
  try {
    // 1. Block 조회하여 youtubeId 추출 (검증용)
    const blockRepository = new DrizzleBlockRepository();
    const block = await blockRepository.findById(new BlockId(safeDto.blockId));

    if (!block) {
      return err('Block not found', { code: 'BLOCK_NOT_FOUND' });
    }

    // 2. Block 타입이 youtube인지 확인
    if (block.blockType.value !== 'youtube') {
      return err('Block is not a YouTube block', {
        code: 'INVALID_BLOCK_TYPE',
      });
    }

    // 3. Block Properties를 타입 안전하게 변환
    const properties = block.properties;
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
    const aggregate = await videoRepository.findById(safeDto.youtubeId);

    if (!aggregate) {
      return err('Video not found', { code: 'VIDEO_NOT_FOUND' });
    }

    const video = aggregate.getVideo();

    // 7. Action Transaction 생성
    const actionTransactionRepository =
      new DrizzleActionTransactionRepository();
    const createTransactionResult = await createActionTransaction(
      {
        blockId: safeDto.blockId,
        videoId: safeDto.youtubeId,
        actionType: 'extract_script',
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

    const actionTransactionAggregate = createTransactionResult.value;

    // 8. extractTranscript 호출하여 스크립트 추출
    const videoSlug = video.slug.value;
    let script;
    try {
      script = await extractTranscript(videoSlug);
    } catch (error) {
      console.error(
        '[extractVideoScriptInternal] Failed to get transcript:',
        error
      );

      // Action Transaction 완료 처리 (실패로 표시)
      const completeCommand: CompleteActionTransactionCommand = {
        transactionId: actionTransactionAggregate.getTransaction().id.value,
      };
      actionTransactionAggregate.complete(completeCommand);
      await actionTransactionRepository.update(actionTransactionAggregate);

      return err(
        error instanceof YoutubeError
          ? error.message
          : 'Failed to extract transcript',
        {
          code: 'TRANSCRIPT_EXTRACTION_FAILED',
          meta: {
            originalError:
              error instanceof Error ? error.message : 'Unknown error',
            videoId: safeDto.youtubeId,
            videoSlug: videoSlug,
          },
        }
      );
    }

    // 9. 스크립트 업데이트
    const updateScriptCommand: UpdateScriptCommand = {
      videoId: video.id.value,
      script,
      scriptLanguage: script.metadata.language || 'auto',
    };

    aggregate.updateScript(updateScriptCommand);

    // 10. Repository에 저장
    await videoRepository.update(aggregate);

    // 11. Action Transaction 완료 처리
    const completeCommand: CompleteActionTransactionCommand = {
      transactionId: actionTransactionAggregate.getTransaction().id.value,
    };
    actionTransactionAggregate.complete(completeCommand);
    await actionTransactionRepository.update(actionTransactionAggregate);

    // 12. Response DTO 생성
    const response: ExtractScriptDTO = {
      youtube: aggregate.toView(),
    };

    return ok(response);
  } catch (error) {
    console.error('[extractVideoScriptInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
