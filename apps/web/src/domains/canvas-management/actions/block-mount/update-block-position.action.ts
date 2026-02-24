'use server';

import type { MultipleBlockMountsActionContext } from './secure-action';
import {
  DrizzleEventLogRepository,
  EventLogService,
} from '@/domains/event-management';
import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { updateBlockPosition } from '../../backend/services/block-mount';
import {
  UpdateBlockPositionRequest,
  UpdateBlockPositionRequestSchema,
} from '../../shared/dtos/requests';
import { BlockPositionUpdatedDTO } from '../../shared/dtos/responses';
import { withMultipleBlockMountSecureAction } from './secure-action';

/**
 * Block 위치 업데이트 Server Action
 *
 * ⚠️ Security: withMultipleBlockMountSecureAction — 모든 blockMountId에 대해 페이지·블록 권한 검증 후 aggregates 전달
 */
export const updateBlockPositionAction = withMultipleBlockMountSecureAction(
  UpdateBlockPositionRequestSchema,
  'updateBlockPositionAction',
  updateBlockPositionInternal,
  {
    getPageIdAndSlugs: req => ({
      pageId: req.pageId,
      slugs: req.blockPositions.map(bp => bp.blockMountId),
    }),
    getLogMetadata: req => ({
      blockCount: req.blockPositions.length,
    }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - MultipleBlockMountsActionContext (blockMountAggregates 포함, 서비스 재조회 없음)
 */
async function updateBlockPositionInternal(
  safeDto: UpdateBlockPositionRequest,
  context: MultipleBlockMountsActionContext
): Promise<ActionResult<BlockPositionUpdatedDTO[]>> {
  try {
    const { authenticatedUser, page, blockMountAggregates } = context;
    const userId: UserId = new UserId(authenticatedUser.id);
    const blockMountRepository = new DrizzleBlockMountRepository();

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventLogPolicyContext: EventLogPolicyContext = {
      eventLogService,
      userId: authenticatedUser.id,
      pageId: page.pageId.value,
    };

    const result = await updateBlockPosition({
      safeDto,
      safeUserId: userId,
      safeBlockMountAggregates: blockMountAggregates,
      blockMountRepository,
      eventLogPolicyContext,
    });

    if (result.isError()) {
      console.error(
        '❌ [updateBlockPositionInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'POSITION_UPDATE_FAILED',
        meta: { originalError: result.error },
      });
    }

    const aggregates = result.value;
    const dtos: BlockPositionUpdatedDTO[] = aggregates.map((aggregate, i) => ({
      blockMountId: safeDto.blockPositions[i]!.blockMountId,
      newPosition: {
        x: aggregate.getBlockMount().position.x,
        y: aggregate.getBlockMount().position.y,
      },
      updatedAt: aggregate.getBlockMount().updatedAt.toISOString(),
    }));

    if (dtos.length === 0) {
      return err('No aggregate returned from service', {
        code: 'POSITION_UPDATE_FAILED',
      });
    }

    return ok(dtos);
  } catch (error) {
    console.error('[updateBlockPositionInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
