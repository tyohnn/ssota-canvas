'use server';

import type { PageActionContext } from '@/domains/common/auth/types';
import { withPageSecureAction } from '@/domains/common/server-actions';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleEdgeRepository } from '../../backend/repositories/implementations/drizzle-edge.repository';
import { restoreEdge } from '../../backend/services/edge/restore-edge.service';
import {
  RestoreEdgeRequest,
  RestoreEdgeRequestSchema,
} from '../../shared/dtos/requests/edge.requests';

/**
 * 엣지 복구 Server Action
 */
export const restoreEdgeAction = withPageSecureAction(
  RestoreEdgeRequestSchema,
  'restoreEdgeAction',
  restoreEdgeInternal,
  {
    getLogMetadata: req => ({ edgeIds: req.edgeIds }),
  }
);

/**
 * 내부 구현
 */
async function restoreEdgeInternal(
  safeDto: RestoreEdgeRequest,
  context: PageActionContext
): Promise<ActionResult<{ restoredCount: number; restoredEdgeIds: string[] }>> {
  try {
    const { authenticatedUser } = context;
    const userId: UserId = new UserId(authenticatedUser.id);

    const edgeRepository = new DrizzleEdgeRepository();

    const result = await restoreEdge(
      safeDto,
      userId,
      edgeRepository
    );

    if (result.isError()) {
      return err(String(result.error), {
        code: 'EDGE_RESTORATION_FAILED',
        meta: { originalError: result.error },
      });
    }

    return ok(result.value);
  } catch (error) {
    console.error('[restoreEdgeInternal] Internal error:', error);
    return err('Internal server error');
  }
}
