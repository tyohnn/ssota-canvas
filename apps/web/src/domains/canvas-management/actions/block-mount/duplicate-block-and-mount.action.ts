'use server';

import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import type {
  BlockMountActionContext,
  MultipleBlockMountsActionContext,
} from './secure-action';
import {
  DrizzleEventLogRepository,
  EventLogService,
} from '@/domains/event-management';
import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import {
  duplicateBlockAndMount,
  duplicateBlocksAndMount,
} from '../../backend/services/block-mount';
import {
  DuplicateBlockAndMountRequest,
  DuplicateBlockAndMountRequestSchema,
  DuplicateBlocksAndMountRequest,
  DuplicateBlocksAndMountRequestSchema,
} from '../../shared/dtos/requests';
import { BlockDuplicatedAndMountedDTO } from '../../shared/dtos/responses';
import {
  withMultipleBlockMountSecureAction,
  withSingleBlockMountSecureAction,
} from './secure-action';

/**
 * Block 복제 Server Action (단일)
 *
 * ⚠️ Security: withSingleBlockMountSecureAction — 페이지·블록 권한 검증 후 aggregate 전달
 */
export const duplicateBlockAndMountAction = withSingleBlockMountSecureAction(
  DuplicateBlockAndMountRequestSchema,
  'duplicateBlockAndMountAction',
  duplicateBlockAndMountInternal,
  {
    getLogMetadata: req => ({ blockMountId: req.blockMountId }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - BlockMountActionContext (blockMountAggregate 포함, 서비스 재조회 없음)
 */
async function duplicateBlockAndMountInternal(
  safeDto: DuplicateBlockAndMountRequest,
  context: BlockMountActionContext
): Promise<ActionResult<BlockDuplicatedAndMountedDTO>> {
  try {
    const { authenticatedUser, workspace, page, blockMountAggregate } =
      context;
    const userId: UserId = new UserId(authenticatedUser.id);
    const workspaceId: WorkspaceId = workspace.workspaceId;

    const blockMountRepository = new DrizzleBlockMountRepository();
    const blockRepository = new DrizzleBlockRepository();

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventLogPolicyContext: EventLogPolicyContext = {
      eventLogService,
      userId: authenticatedUser.id,
      pageId: page.pageId.value,
    };

    const result = await duplicateBlockAndMount({
      safeDto,
      safeUserId: userId,
      safeWorkspaceId: workspaceId,
      safeBlockMountAggregate: blockMountAggregate,
      blockRepository,
      blockMountRepository,
      eventLogPolicyContext,
    });

    if (result.isError()) {
      console.error(
        '❌ [duplicateBlockAndMountInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'BLOCK_DUPLICATION_FAILED',
        meta: { originalError: result.error, request: safeDto },
      });
    }

    // Aggregate → DTO 변환 (toView 사용)
    const { blockMountAggregate: duplicatedMount, blockAggregate: duplicatedBlock } =
      result.value;
    const blockView = duplicatedMount.toView(duplicatedBlock);

    return ok(blockView);
  } catch (error) {
    console.error('[duplicateBlockAndMountInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}

/**
 * Block 복제 (다중, 배치) Server Action
 *
 * ⚠️ Security: withMultipleBlockMountSecureAction — 모든 blockMountId에 대해 페이지·블록 권한 검증 후 aggregates 전달
 */
export const duplicateBlocksAndMountAction = withMultipleBlockMountSecureAction(
  DuplicateBlocksAndMountRequestSchema,
  'duplicateBlocksAndMountAction',
  duplicateBlocksAndMountInternal,
  {
    getPageIdAndSlugs: req => ({
      pageId: req.pageId,
      slugs: req.blocks.map(b => b.blockMountId),
    }),
    getLogMetadata: req => ({ blocksCount: req.blocks.length }),
  }
);

async function duplicateBlocksAndMountInternal(
  safeDto: DuplicateBlocksAndMountRequest,
  context: MultipleBlockMountsActionContext
): Promise<ActionResult<BlockDuplicatedAndMountedDTO[]>> {
  try {
    const { authenticatedUser, workspace, page, blockMountAggregates } =
      context;
    const userId: UserId = new UserId(authenticatedUser.id);
    const workspaceId: WorkspaceId = workspace.workspaceId;

    const blockMountRepository = new DrizzleBlockMountRepository();
    const blockRepository = new DrizzleBlockRepository();

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventLogPolicyContext: EventLogPolicyContext = {
      eventLogService,
      userId: authenticatedUser.id,
      pageId: page.pageId.value,
    };

    const result = await duplicateBlocksAndMount({
      safeDto,
      safeUserId: userId,
      safeWorkspaceId: workspaceId,
      safeBlockMountAggregates: blockMountAggregates,
      blockRepository,
      blockMountRepository,
      eventLogPolicyContext,
    });

    if (result.isError()) {
      console.error(
        '❌ [duplicateBlocksAndMountInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'BLOCK_DUPLICATION_FAILED',
        meta: { originalError: result.error, request: safeDto },
      });
    }

    const dtos: BlockDuplicatedAndMountedDTO[] = result.value.map(
      ({ blockMountAggregate, blockAggregate }) =>
        blockMountAggregate.toView(blockAggregate)
    );
    return ok(dtos);
  } catch (error) {
    console.error('[duplicateBlocksAndMountInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
