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
import { DrizzleEdgeRepository } from '../../backend/repositories/implementations/drizzle-edge.repository';
import { softDeleteBlockMount } from '../../backend/services/block-mount';
import {
  SoftDeleteBlockMountRequest,
  SoftDeleteBlockMountRequestSchema,
} from '../../shared/dtos/requests';
import { BlockMountSoftDeletedDTO } from '../../shared/dtos/responses';
import { withMultipleBlockMountSecureAction } from './secure-action';

/**
 * Block Mount 삭제 Server Action
 *
 * ⚠️ Security: withMultipleBlockMountSecureAction — 모든 blockMountId에 대해 페이지·블록 권한 검증 후 aggregates 전달
 */
export const softDeleteBlockMountAction = withMultipleBlockMountSecureAction(
  SoftDeleteBlockMountRequestSchema,
  'softDeleteBlockMountAction',
  softDeleteBlockMountInternal,
  {
    getPageIdAndSlugs: req => ({
      pageId: req.pageId,
      slugs: req.blockMountIds,
    }),
    getLogMetadata: req => ({ blockMountIds: req.blockMountIds }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - MultipleBlockMountsActionContext (blockMountAggregates 포함, 서비스 재조회 없음)
 */
async function softDeleteBlockMountInternal(
  safeDto: SoftDeleteBlockMountRequest,
  context: MultipleBlockMountsActionContext
): Promise<ActionResult<BlockMountSoftDeletedDTO>> {
  try {
    const { authenticatedUser, page, blockMountAggregates } = context;
    const userId: UserId = new UserId(authenticatedUser.id);
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventLogPolicyContext: EventLogPolicyContext = {
      eventLogService,
      userId: authenticatedUser.id,
      pageId: page.pageId.value,
    };

    const result = await softDeleteBlockMount({
      safeDto,
      safeUserId: userId,
      safeBlockMountAggregates: blockMountAggregates,
      blockMountRepository,
      edgeRepository,
      eventLogPolicyContext,
    });

    if (result.isError()) {
      console.error(
        '❌ [softDeleteBlockMountInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'BLOCK_MOUNT_DELETION_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. DTO 직렬화 (다중 결과 처리)
    const dto: BlockMountSoftDeletedDTO = {
      deletedCount: result.value.deletedCount,
      deletedEdgesCount: result.value.deletedEdgesCount,
      deletedAt: new Date().toISOString(),
      deletedBlockMountIds: result.value.deletedBlockMountIds.map(id =>
        id.value.replace(/-/g, '').toLowerCase().slice(0, 8)
      ),
    };

    return ok(dto);
  } catch (error) {
    console.error('[softDeleteBlockMountInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
