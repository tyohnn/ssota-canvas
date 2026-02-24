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
import { updateEdgeLabel } from '../../backend/services/edge';
import { EdgeView } from '../../shared/dtos/index';
import {
  UpdateEdgeLabelRequest,
  UpdateEdgeLabelRequestSchema,
} from '../../shared/dtos/requests';

/**
 * 엣지 라벨 업데이트 Server Action
 *
 * ✅ Aggregate 조회·전달: secure action에서 edgeAggregate 전달, 서비스는 재조회 없음
 */
export const updateEdgeLabelAction = withSingleEdgeSecureAction(
  UpdateEdgeLabelRequestSchema,
  'updateEdgeLabelAction',
  updateEdgeLabelInternal,
  {
    getLogMetadata: req => ({ edgeId: req.edgeId }),
  }
);

async function updateEdgeLabelInternal(
  safeDto: UpdateEdgeLabelRequest,
  context: EdgeActionContext
): Promise<ActionResult<EdgeView>> {
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

    const result = await updateEdgeLabel(
      context.edgeAggregate,
      safeDto.newLabel,
      userId,
      edgeRepository,
      eventLogPolicyContext
    );

    if (result.isError()) {
      console.error(
        '❌ [updateEdgeLabelInternal] EdgeService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'EDGE_LABEL_UPDATE_FAILED',
        meta: { originalError: result.error, request: safeDto },
      });
    }

    return ok(result.value.toView());
  } catch (error) {
    console.error('[updateEdgeLabelInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
