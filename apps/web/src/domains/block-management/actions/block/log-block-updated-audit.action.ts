'use server';

import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import {
  DrizzleEventLogRepository,
  EventLogService,
} from '@/domains/event-management';
import { ActionResult, err, ok } from '@/lib';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import {
  LogBlockUpdatedAuditRequest,
  LogBlockUpdatedAuditRequestSchema,
} from '../../shared/dtos/requests/block.requests';
import { withBlockSecureAction } from './secure-action';

/**
 * Blur 시 감사 로그만 기록 (block 업데이트 없음).
 * event_log에 block_updated 한 건만 기록하며 changes에는 patch만 저장.
 * Security: withBlockSecureAction HOF (동일한 검증 체인)
 */
export const logBlockUpdatedAuditAction = withBlockSecureAction(
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
  context: WorkspaceActionContext
): Promise<ActionResult<{ logged: true }>> {
  try {
    const blockRepository = new DrizzleBlockRepository();
    const block = await blockRepository.findByWorkspaceIdAndSlug(
      new WorkspaceId(safeDto.workspaceId),
      safeDto.blockId
    );
    if (!block) {
      return err('Block not found', { code: 'BLOCK_NOT_FOUND' });
    }

    const blockMountRepository = new DrizzleBlockMountRepository();
    const pageId = await blockMountRepository.findOnePageIdByBlockId(
      block.id.value
    );
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
