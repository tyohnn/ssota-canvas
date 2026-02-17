'use server';

import type { EdgeActionContext } from './secure-action';
import { withSingleEdgeSecureAction } from './secure-action';
import {
  DrizzleEventLogRepository,
  EventLogService,
} from '@/domains/event-management';
import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleEdgeRepository } from '../../backend/repositories/implementations/drizzle-edge.repository';
import { deleteEdge } from '../../backend/services/edge';
import {
  DeleteEdgeRequest,
  DeleteEdgeRequestSchema,
} from '../../shared/dtos/requests';

/**
 * 엣지 삭제 Server Action
 *
 * ✅ Aggregate 조회·전달: secure action에서 findByPageIdAndSlug 후 EdgeActionContext.edgeAggregate 전달
 */
export const deleteEdgeAction = withSingleEdgeSecureAction(
  DeleteEdgeRequestSchema,
  'deleteEdgeAction',
  deleteEdgeInternal,
  {
    getLogMetadata: req => ({ edgeId: req.edgeId }),
  }
);

async function deleteEdgeInternal(
  _safeDto: DeleteEdgeRequest,
  context: EdgeActionContext
): Promise<ActionResult<void>> {
  try {
    const userId = new UserId(context.authenticatedUser.id);
    const edgeRepository = new DrizzleEdgeRepository();

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventLogPolicyContext: EventLogPolicyContext = {
      eventLogService,
      userId: context.authenticatedUser.id,
      pageId: context.page.pageId.value,
    };

    const result = await deleteEdge(
      context.edgeAggregate,
      userId,
      edgeRepository,
      eventLogPolicyContext
    );

    if (result.isError()) {
      console.error(
        '❌ [deleteEdgeInternal] EdgeService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'EDGE_DELETION_FAILED',
        meta: { originalError: result.error },
      });
    }

    return ok(undefined);
  } catch (error) {
    console.error('[deleteEdgeInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
