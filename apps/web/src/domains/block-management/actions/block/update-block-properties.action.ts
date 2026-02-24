'use server';

import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { updateBlockProperties } from '../../backend/services/block/property/update-block-properties.service';
import {
  UpdateBlockPropertiesRequest,
  UpdateBlockPropertiesRequestSchema,
} from '../../shared/dtos/requests/block.requests';
import { BlockPropertiesUpdatedDTO } from '../../shared/dtos/responses/block.responses';
import type { BlockActionContext } from './secure-action';
import { withBlockAggregateSecureAction } from './secure-action';

/**
 * 블록 속성 일괄 업데이트 Server Action (Bulk Update)
 *
 * ⚠️ Security: withBlockAggregateSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증·워크스페이스 권한
 * 3. Block 조회 및 context에 blockAggregate 전달 → 서비스 재조회 없음
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns BlockPropertiesUpdatedDTO (성공) | Error (실패)
 */
export const updateBlockPropertiesAction = withBlockAggregateSecureAction(
  UpdateBlockPropertiesRequestSchema,
  'updateBlockPropertiesAction',
  updateBlockPropertiesInternal,
  {
    getLogMetadata: req => ({
      blockId: req.blockId,
      propertiesCount: Object.keys(req.properties).length,
    }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리) - Bulk Update
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 context (blockAggregate 포함)
 */
async function updateBlockPropertiesInternal(
  safeDto: UpdateBlockPropertiesRequest,
  context: BlockActionContext
): Promise<ActionResult<BlockPropertiesUpdatedDTO>> {
  try {
    const userId: UserId = new UserId(context.authenticatedUser.id);
    const blockRepository = new DrizzleBlockRepository();

    const updateResult = await updateBlockProperties({
      properties: safeDto.properties,
      safeBlockAggregate: context.blockAggregate,
      safeUserId: userId,
      blockRepository,
    });

    // 3. Result 처리
    if (updateResult.isError()) {
      return err(String(updateResult.error), {
        code: 'BLOCK_UPDATE_FAILED',
        meta: { originalError: updateResult.error },
      });
    }

    // 4. Response DTO 생성
    const responseData: BlockPropertiesUpdatedDTO = {
      blockId: safeDto.blockId,
      properties: safeDto.properties,
      updatedAt: updateResult.value.updatedAt,
    };

    return ok(responseData);
  } catch (error) {
    console.error('[updateBlockPropertiesInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
