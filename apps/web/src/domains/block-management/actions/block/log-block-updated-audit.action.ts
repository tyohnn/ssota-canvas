'use server';

import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import {
  DrizzleEventLogRepository,
  EventLogService,
} from '@/domains/event-management';
import { ActionResult, err, ok } from '@/lib';

import {
  LogBlockUpdatedAuditRequest,
  LogBlockUpdatedAuditRequestSchema,
} from '../../shared/dtos/requests/block.requests';
import type { BlockActionContext } from './secure-action';
import { withBlockAggregateSecureAction } from './secure-action';

/**
 * Blur 시 감사 로그만 기록 (block 업데이트 없음).
 * event_log에 block_updated 한 건만 기록하며 changes에는 patch만 저장.
 * Security: withBlockAggregateSecureAction HOF (워크스페이스 권한 + Block 조회 후 blockAggregate 전달)
 */
export const logBlockUpdatedAuditAction = withBlockAggregateSecureAction(
  LogBlockUpdatedAuditRequestSchema,
  'logBlockUpdatedAuditAction',
  logBlockUpdatedAuditInternal,
  {
    getLogMetadata: req => ({
      blockId: req.blockId,
    }),
  }
);

async function logBlockUpdatedAuditInternal(
  safeDto: LogBlockUpdatedAuditRequest,
  context: BlockActionContext
): Promise<ActionResult<{ logged: true }>> {
  try {
    const blockId = context.blockAggregate.getBlock().id.value;
    const blockMountRepository = new DrizzleBlockMountRepository();
    const pageId = await blockMountRepository.findOnePageIdByBlockId(blockId);
    if (!pageId) {
      return err('Block not mounted on any page', { code: 'BLOCK_NOT_MOUNTED' });
    }

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);

    await eventLogService.logBlockUpdated(
      {
        pageId,
        userId: context.authenticatedUser.id,
        blockId: safeDto.blockId,
        changes: { patch: safeDto.patch },
      },
      { force: true }
    );

    return ok({ logged: true });
  } catch (error) {
    console.error('[logBlockUpdatedAuditInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
