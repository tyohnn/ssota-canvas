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
import { updateEdgeStyle } from '../../backend/services/edge';
import { EdgeView } from '../../shared/dtos/index';
import {
  UpdateEdgeStyleRequest,
  UpdateEdgeStyleRequestSchema,
} from '../../shared/dtos/requests';

/**
 * 엣지 스타일 업데이트 Server Action
 *
 * ✅ Aggregate 조회·전달: secure action에서 edgeAggregate 전달, 서비스는 재조회 없음
 */
export const updateEdgeStyleAction = withSingleEdgeSecureAction(
  UpdateEdgeStyleRequestSchema,
  'updateEdgeStyleAction',
  updateEdgeStyleInternal,
  {
    getLogMetadata: req => ({ edgeId: req.edgeId }),
  }
);

async function updateEdgeStyleInternal(
  safeDto: UpdateEdgeStyleRequest,
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

    const result = await updateEdgeStyle(
      context.edgeAggregate,
      safeDto.style,
      userId,
      edgeRepository,
      eventLogPolicyContext
    );

    if (result.isError()) {
      console.error(
        '❌ [updateEdgeStyleInternal] EdgeService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'EDGE_STYLE_UPDATE_FAILED',
        meta: { originalError: result.error, request: safeDto },
      });
    }

    return ok(result.value.toView());
  } catch (error) {
    console.error('[updateEdgeStyleInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
