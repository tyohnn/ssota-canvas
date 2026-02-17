'use server';

import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import {
  DrizzleEventLogRepository,
  EventLogService,
} from '@/domains/event-management';
import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { updateBlockTitle } from '../../backend/services/block/property/update-block-title.service';
import {
  UpdateBlockTitleRequest,
  UpdateBlockTitleRequestSchema,
} from '../../shared/dtos/requests/block.requests';
import { BlockTitleUpdatedDTO } from '../../shared/dtos/responses/block.responses';
import type { BlockActionContext } from './secure-action';
import { withBlockAggregateSecureAction } from './secure-action';

/**
 * 블록 제목 업데이트 Server Action
 *
 * ⚠️ Security: withBlockAggregateSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증·워크스페이스 권한
 * 3. Block 조회 및 context에 blockAggregate 전달 → 서비스 재조회 없음
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns BlockTitleUpdatedDTO (성공) | Error (실패)
 */
export const updateBlockTitleAction = withBlockAggregateSecureAction(
  UpdateBlockTitleRequestSchema,
  'updateBlockTitleAction',
  updateBlockTitleInternal,
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
async function updateBlockTitleInternal(
  safeDto: UpdateBlockTitleRequest,
  context: BlockActionContext
): Promise<ActionResult<BlockTitleUpdatedDTO>> {
  try {
    const userId: UserId = new UserId(context.authenticatedUser.id);
    const blockMountRepository = new DrizzleBlockMountRepository();
    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventLogPolicyContext: EventLogPolicyContext = {
      eventLogService,
      userId: context.authenticatedUser.id,
      getPageIdForBlock: (blockId: string) =>
        blockMountRepository.findOnePageIdByBlockId(blockId),
    };

    const blockRepository = new DrizzleBlockRepository();
    const updateResult = await updateBlockTitle({
      title: safeDto.title,
      safeBlockAggregate: context.blockAggregate,
      safeUserId: userId,
      blockRepository,
      eventLogPolicyContext,
    });

    // 3. Result 처리
    if (updateResult.isError()) {
      return err(String(updateResult.error), {
        code: 'BLOCK_UPDATE_FAILED',
        meta: { originalError: updateResult.error },
      });
    }

    // 4. Response DTO 생성 (blockId = slug)
    const block = updateResult.value.getBlock();
    const responseData: BlockTitleUpdatedDTO = {
      blockId: block.getSlug(),
      title: block.title,
      updatedAt: block.updatedAt,
    };

    return ok(responseData);
  } catch (error) {
    console.error('[updateBlockTitleInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
