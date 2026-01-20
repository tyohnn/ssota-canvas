/**
 * Video 스크립트 조회 Action (Action Transaction 확인 없이)
 *
 * ⚠️ Security: scriptAccessGranted가 true인 블록만 접근 가능
 * - Action Transaction을 확인하지 않고 블록의 scriptAccessGranted만 확인
 * - Org 레벨 공유 확인 없이 직접 비디오 데이터만 조회
 * - scriptAccessGranted가 false면 에러 반환
 *
 * 사용 사례:
 * - scriptAccessGranted가 이미 true로 설정된 블록 (빠른 경로)
 * - Action Transaction 확인이 불필요한 경우
 */

'use server';

import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../../../block-management/backend/repositories/implementations/drizzle-block.repository';
import { BlockId } from '../../../block-management/shared/value-objects/block-id.vo';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '../../../block-management/shared/value-objects/block-properties';
import { DrizzleVideoRepository } from '../../backend/repositories/implementations/drizzle-video.repository';
import {
  type GetVideoScriptRequest,
  GetVideoScriptRequestSchema,
} from '../../shared/dtos/requests/video.requests';
import type { GetScriptDTO } from '../../shared/dtos/responses/video.responses';

/**
 * Video 스크립트 조회 Action (Action Transaction 확인 없이)
 *
 * ⚠️ Security: scriptAccessGranted가 true인 블록만 접근 가능
 * - Action Transaction을 확인하지 않고 블록의 scriptAccessGranted만 확인
 * - Org 레벨 공유 확인 없이 직접 비디오 데이터만 조회
 * - scriptAccessGranted가 false면 에러 반환
 *
 * 사용 사례:
 * - scriptAccessGranted가 이미 true로 설정된 블록 (빠른 경로)
 * - Action Transaction 확인이 불필요한 경우
 */
export async function getVideoScriptWithoutTransactionAction(
  input: unknown
): Promise<ActionResult<GetScriptDTO>> {
  // 1. Runtime Validation
  const parseResult = GetVideoScriptRequestSchema.safeParse(input);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to getVideoScriptWithoutTransactionAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  const safeDto = parseResult.data;

  // 2. Internal 함수 호출 (Action Transaction 확인 없이, scriptAccessGranted만 확인)
  return await getVideoScriptWithoutTransactionInternal(safeDto);
}

/**
 * Action Transaction 확인 없이 스크립트 조회 내부 구현
 *
 * ⚠️ Security: 블록 검증은 여전히 수행 (서버 보안 검증)
 * - Block 조회 및 타입 확인
 * - Block Properties 검증
 * - scriptAccessGranted 확인
 * - youtubeId 일치 확인
 *
 * Action Transaction을 확인하지 않으므로:
 * - Org 레벨 공유 확인 없음
 * - 같은 조직의 다른 블록에서 추출한 스크립트 재사용 불가
 * - 블록의 scriptAccessGranted가 true인 경우에만 사용
 */
async function getVideoScriptWithoutTransactionInternal(
  safeDto: GetVideoScriptRequest
): Promise<ActionResult<GetScriptDTO>> {
  try {
    // 1. Block 조회 (서버 보안 검증: 아무나 데이터를 가져갈 수 없게 하기 위해 블록에 한정)
    const blockRepository = new DrizzleBlockRepository();
    const block = await blockRepository.findById(new BlockId(safeDto.blockId));

    if (!block) {
      return err('Block not found', { code: 'BLOCK_NOT_FOUND' });
    }

    // 2. Block 타입이 youtube인지 확인 (서버 보안 검증)
    if (block.blockType.value !== 'youtube') {
      return err('Block is not a YouTube block', {
        code: 'INVALID_BLOCK_TYPE',
      });
    }

    // 3. Block Properties를 타입 안전하게 변환 (서버 보안 검증)
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

    // 4. scriptAccessGranted 확인 (Action Transaction 확인 없이 블록 권한만 확인)
    if (youtubeProperties.scriptAccessGranted !== true) {
      return err('Script not extracted. Please extract script first.', {
        code: 'SCRIPT_NOT_EXTRACTED',
        meta: {
          blockId: safeDto.blockId,
          videoId: safeDto.youtubeId,
        },
      });
    }

    // 5. youtubeId 추출 및 검증 (서버 보안 검증)
    const blockYoutubeId = youtubeProperties.youtubeId;
    if (!blockYoutubeId) {
      return err('YouTube ID not found in block properties', {
        code: 'YOUTUBE_ID_NOT_FOUND',
      });
    }

    if (blockYoutubeId !== safeDto.youtubeId) {
      return err('YouTube ID mismatch', {
        code: 'YOUTUBE_ID_MISMATCH',
      });
    }

    // 6. Video 조회 (Action Transaction 확인 없이 직접 조회)
    const videoRepository = new DrizzleVideoRepository();
    const aggregate = await videoRepository.findById(safeDto.youtubeId);

    if (!aggregate) {
      return err('Video not found', { code: 'VIDEO_NOT_FOUND' });
    }

    // 7. 스크립트 확인 및 반환
    const video = aggregate.getVideo();
    if (video.hasScript()) {
      const response: GetScriptDTO = {
        youtube: aggregate.toView(),
      };
      return ok(response);
    }

    // 스크립트가 없으면 에러
    return err('Script not found', {
      code: 'SCRIPT_NOT_FOUND',
      meta: {
        blockId: safeDto.blockId,
        videoId: safeDto.youtubeId,
      },
    });
  } catch (error) {
    console.error('[getVideoScriptWithoutTransactionInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
