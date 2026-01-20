/**
 * Video 스크립트 조회 Action (Action Transaction 확인 포함)
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
 * 2. 2단계 권한 확인:
 *    - 1단계: 블록의 scriptAccessGranted 확인 (빠른 경로)
 *    - 2단계: org의 action_transactions 확인 (자동 복구 및 조직 내 공유)
 * 3. 스크립트가 있으면 반환
 * 4. 스크립트가 없으면 재추출 시도 (이전 추출이 실패했을 수 있음)
 * 5. 권한이 없으면 에러 반환 (자동 추출하지 않음)
 *
 * ⚠️ 중요: org 기반 권한 관리로 같은 org 내 워크스페이스 간 자동 공유
 * - Action Transaction을 확인하여 같은 조직의 다른 블록에서 추출한 스크립트 재사용 가능
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
 * Video 스크립트 조회 Action (Action Transaction 확인 포함)
 *
 * - 인증 필요
 * - Action Transaction을 확인하여 조직 내 공유된 스크립트 재사용 가능
 * - 블록의 scriptAccessGranted가 false여도 org의 action_transactions를 확인하여 자동 복구
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

    // 5. 2단계 권한 확인: 블록 레벨 → Org 레벨 (Action Transaction 확인)
    const video = aggregate.getVideo();
    const actionTransactionRepository =
      new DrizzleActionTransactionRepository();

    // 5-1. 1단계: 블록의 scriptAccessGranted 확인 (빠른 경로)
    // ⚠️ 중요: scriptAccessGranted가 true면 action_transactions 조회 없이 바로 반환
    // (이 경우 getVideoScriptWithoutTransactionAction을 사용하는 것이 더 효율적)
    if (youtubeProperties.scriptAccessGranted === true) {
      // 블록 권한이 있으면 바로 스크립트 반환 (action_transactions 조회 없음)
      if (video.hasScript()) {
        const response: GetScriptDTO = {
          youtube: aggregate.toView(),
        };
        return ok(response);
      }
      // 스크립트가 없으면 재추출 시도 (아래 로직으로 진행)
    } else {
      // 5-2. 2단계: org의 action_transactions 확인 (자동 복구)
      // ⚠️ 익명 유저의 경우 context.organization.id가 없을 수 있으므로 체크
      if (!context.organization?.id) {
        // 익명 유저이고 scriptAccessGranted가 false면 권한 없음
        return err('Script not extracted. Please extract script first.', {
          code: 'SCRIPT_NOT_EXTRACTED',
          meta: {
            blockId: safeDto.blockId,
            videoId: safeDto.youtubeId,
          },
        });
      }

      const actionTransaction =
        await actionTransactionRepository.findByOrgAndVideo(
          context.organization.id,
          safeDto.youtubeId,
          'extract_script'
        );

      if (actionTransaction) {
        // org가 이미 추출했으면 블록에 권한 부여 (자동 복구)
        block.updatePropertiesFromRecord({
          scriptAccessGranted: true,
        });
        await blockRepository.update(block);

        // 스크립트 확인
        if (video.hasScript()) {
          const response: GetScriptDTO = {
            youtube: aggregate.toView(),
          };
          return ok(response);
        }
        // 스크립트가 없으면 재추출 시도 (아래 로직으로 진행)
      } else {
        // 권한 없음
        return err('Script not extracted. Please extract script first.', {
          code: 'SCRIPT_NOT_EXTRACTED',
          meta: {
            blockId: safeDto.blockId,
            videoId: safeDto.youtubeId,
          },
        });
      }
    }

    // 6. 스크립트가 없는 경우 재추출 시도
    // (블록 권한이 있거나 org 권한이 있는데 스크립트가 없는 경우)

    // 6-1. 재추출 시도 (권한은 있지만 스크립트가 없는 경우)
    const videoSlug = video.slug.value;
    let script;
    try {
      script = await extractTranscript(videoSlug);
    } catch (error) {
      console.error(
        '[getVideoScriptInternal] Failed to extract transcript on retry:',
        error
      );

      // org의 action_transaction 조회 (완료 처리용)
      const actionTransaction =
        await actionTransactionRepository.findByOrgAndVideo(
          context.organization.id,
          safeDto.youtubeId,
          'extract_script'
        );

      if (actionTransaction) {
        // Action Transaction 완료 처리 (재시도 실패로 표시)
        const transactionEntity = actionTransaction.getTransaction();
        const completeCommand: CompleteActionTransactionCommand = {
          transactionId: transactionEntity.id.value,
        };
        actionTransaction.complete(completeCommand);
        await actionTransactionRepository.update(actionTransaction);
      }

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

    // 6-2. 스크립트 업데이트
    const updateScriptCommand: UpdateScriptCommand = {
      videoId: video.id.value,
      script,
      scriptLanguage: script.metadata.language || 'auto',
    };

    aggregate.updateScript(updateScriptCommand);

    // 6-3. Repository에 저장
    await videoRepository.update(aggregate);

    // 6-4. Action Transaction 완료 처리 (재추출 성공)
    const actionTransaction =
      await actionTransactionRepository.findByOrgAndVideo(
        context.organization.id,
        safeDto.youtubeId,
        'extract_script'
      );

    if (actionTransaction) {
      const transactionEntity = actionTransaction.getTransaction();
      const completeCommand: CompleteActionTransactionCommand = {
        transactionId: transactionEntity.id.value,
      };
      actionTransaction.complete(completeCommand);
      await actionTransactionRepository.update(actionTransaction);
    }

    // 7. Response DTO 생성
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
