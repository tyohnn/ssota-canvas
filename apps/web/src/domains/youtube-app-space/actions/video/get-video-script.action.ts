/**
 * Video 스크립트 조회 Action
 *
 * 패턴: withYoutubeBlockSecureAction HOF 사용
 *
 * ⚠️ Security: withYoutubeBlockSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Block 권한 및 타입 검증 (YouTube 블록인지 확인)
 *
 * ✅ 서버 액션에서 서비스들을 조합해서 사용하는 방식
 * 1. Video 조회 (youtubeId로)
 * 2. Action Transaction 확인 (블록 단위로 추출 액션이 실행된 적이 있는지)
 * 3. 추출 액션이 있으면 스크립트 확인
 * 4. 스크립트가 있으면 반환
 * 5. 스크립트가 없으면 재추출 시도 (이전 추출이 실패했을 수 있음)
 * 6. 추출 액션이 없으면 에러 반환 (자동 추출하지 않음)
 *
 * ⚠️ 중요: 스크립트가 DB에 있어도, 해당 블록에 대한 추출 액션이 없으면 반환하지 않음
 * 다른 유저가 같은 YouTube 비디오에 대해 추출한 스크립트를 무임승차하는 것을 방지
 *
 * ✅ 추출 이력이 있지만 스크립트가 없는 경우:
 * - 사용자가 이미 크레딧을 사용하여 추출을 시도했지만 실패했을 수 있음
 * - 이 경우 재추출을 시도하여 사용자 경험을 개선
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
import { extractTranscript } from '../../backend/services/youtube-api/extract-transcript.service';
import { CompleteActionTransactionCommand } from '../../shared/commands/action-transaction.commands';
import { UpdateScriptCommand } from '../../shared/commands/video.commands';
import {
  type GetVideoScriptRequest,
  GetVideoScriptRequestSchema,
} from '../../shared/dtos/requests/video.requests';
import type { GetScriptDTO } from '../../shared/dtos/responses/video.responses';
import { YoutubeError } from '../../shared/errors/youtube-app-space.error';
import { withYoutubeBlockSecureAction } from '../secure-action';

/**
 * Video 스크립트 조회 Action (blockId 기반)
 */
export const getVideoScriptAction = withYoutubeBlockSecureAction(
  GetVideoScriptRequestSchema,
  'getVideoScriptAction',
  getVideoScriptInternal,
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
async function getVideoScriptInternal(
  safeDto: GetVideoScriptRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<GetScriptDTO>> {
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
      // properties.toJSON()을 통해 JSON 형태로 변환 후 YoutubeBlockPropertiesVO로 변환
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

    // 3. Block properties의 youtubeId와 요청의 youtubeId가 일치하는지 검증
    if (blockYoutubeId !== safeDto.youtubeId) {
      return err('YouTube ID mismatch', {
        code: 'YOUTUBE_ID_MISMATCH',
      });
    }

    // 4. Video 조회 (youtubeId는 UUID이므로 findById 사용)
    const videoRepository = new DrizzleVideoRepository();
    const aggregate = await videoRepository.findById(safeDto.youtubeId);

    if (!aggregate) {
      return err('Video not found', { code: 'VIDEO_NOT_FOUND' });
    }

    // 5. Action Transaction 확인 (블록 단위로 추출 액션이 실행된 적이 있는지 확인)
    // ⚠️ 중요: 스크립트가 DB에 있어도, 해당 블록에 대한 추출 액션이 없으면 반환하지 않음
    // 다른 유저가 같은 YouTube 비디오에 대해 추출한 스크립트를 무임승차하는 것을 방지
    const actionTransactionRepository =
      new DrizzleActionTransactionRepository();
    const actionTransaction =
      await actionTransactionRepository.findByBlockIdAndActionType(
        safeDto.blockId,
        'extract_script'
      );

    // 추출 액션이 실행된 적이 없으면 스크립트가 없다는 에러 반환
    // (자동 추출하지 않음)
    if (!actionTransaction) {
      return err('Script not extracted. Please extract script first.', {
        code: 'SCRIPT_NOT_EXTRACTED',
        meta: {
          blockId: safeDto.blockId,
          videoId: safeDto.youtubeId,
        },
      });
    }

    // 6. 추출 액션이 실행된 적이 있으면 스크립트 확인
    const video = aggregate.getVideo();
    if (video.hasScript()) {
      const response: GetScriptDTO = {
        youtube: aggregate.toView(),
      };
      return ok(response);
    }

    // 7. 추출 액션이 실행된 적이 있지만 스크립트가 없는 경우
    // 사용자가 이미 크레딧을 사용하여 추출을 시도했지만 실패했을 수 있음
    // 재추출을 시도하여 사용자 경험을 개선
    const videoSlug = video.slug.value;
    let script;
    try {
      script = await extractTranscript(videoSlug);
    } catch (error) {
      console.error(
        '[getVideoScriptInternal] Failed to extract transcript on retry:',
        error
      );

      // Action Transaction 완료 처리 (재시도 실패로 표시)
      // Note: actionTransaction은 Aggregate이므로 getTransaction()으로 Entity 접근
      const transactionEntity = actionTransaction.getTransaction();
      const completeCommand: CompleteActionTransactionCommand = {
        transactionId: transactionEntity.id.value,
      };
      actionTransaction.complete(completeCommand);
      await actionTransactionRepository.update(actionTransaction);

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

    // 8. 스크립트 업데이트
    const updateScriptCommand: UpdateScriptCommand = {
      videoId: video.id.value,
      script,
      scriptLanguage: script.metadata.language || 'auto',
    };

    aggregate.updateScript(updateScriptCommand);

    // 9. Repository에 저장
    await videoRepository.update(aggregate);

    // 10. Action Transaction 완료 처리
    // Note: actionTransaction은 Aggregate이므로 getTransaction()으로 Entity 접근
    const transactionEntity = actionTransaction.getTransaction();
    const completeCommand: CompleteActionTransactionCommand = {
      transactionId: transactionEntity.id.value,
    };
    actionTransaction.complete(completeCommand);
    await actionTransactionRepository.update(actionTransaction);

    // 11. Response DTO 생성
    const response: GetScriptDTO = {
      youtube: aggregate.toView(),
    };

    return ok(response);
  } catch (error) {
    console.error('[getVideoScriptInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
