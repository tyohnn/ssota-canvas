'use server';

import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { updateBlockContent } from '../../backend/services/block/property/update-block-content.service';
import {
  UpdateBlockContentRequest,
  UpdateBlockContentRequestSchema,
} from '../../shared/dtos/requests/block.requests';
import { BlockContentUpdatedDTO } from '../../shared/dtos/responses/block.responses';
import type { BlockActionContext } from './secure-action';
import { withBlockAggregateSecureAction } from './secure-action';

/**
 * 블록 콘텐츠 업데이트 Server Action
 *
 * ⚠️ Security: withBlockAggregateSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증·워크스페이스 권한
 * 3. Block 조회 및 context에 blockAggregate 전달 → 서비스 재조회 없음
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns BlockContentUpdatedDTO (성공) | Error (실패)
 */
export const updateBlockContentAction = withBlockAggregateSecureAction(
  UpdateBlockContentRequestSchema,
  'updateBlockContentAction',
  updateBlockContentInternal,
  {
    getLogMetadata: req => ({
      blockId: req.blockId,
    }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 context (blockAggregate 포함)
 */
async function updateBlockContentInternal(
  safeDto: UpdateBlockContentRequest,
  context: BlockActionContext
): Promise<ActionResult<BlockContentUpdatedDTO>> {
  try {
    const userId: UserId = new UserId(context.authenticatedUser.id);
    const blockRepository = new DrizzleBlockRepository();

    const updateResult = await updateBlockContent({
      content: safeDto.content,
      contentRaw: safeDto.contentRaw,
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
    const responseData: BlockContentUpdatedDTO = {
      blockId: safeDto.blockId,
      content: safeDto.content,
      updatedAt: updateResult.value.updatedAt,
    };

    return ok(responseData);
  } catch (error) {
    console.error('[updateBlockContentInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
