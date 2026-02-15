'use server';

import type { PageActionContext } from '@/domains/common/auth/types';
import { withEdgeSecureAction } from '@/domains/common/server-actions';
import {
  DrizzleEventLogRepository,
  EventLogService,
} from '@/domains/event-management';
import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleEdgeRepository } from '../../backend/repositories/implementations/drizzle-edge.repository';
import { updateEdgeMarker } from '../../backend/services/edge';
import { EdgeView } from '../../shared/dtos/index';
import {
  UpdateEdgeMarkerRequest,
  UpdateEdgeMarkerRequestSchema,
} from '../../shared/dtos/requests';

/**
 * 엣지 마커(화살표) 업데이트 Server Action
 * - marker: 'start' | 'end', value: MarkerType (none | arrow | arrow-open | circle | diamond 등)
 */
export const updateEdgeMarkersAction = withEdgeSecureAction(
  UpdateEdgeMarkerRequestSchema,
  'updateEdgeMarkersAction',
  updateEdgeMarkersInternal,
  {
    getLogMetadata: req => ({ edgeId: req.edgeId }),
  }
);

async function updateEdgeMarkersInternal(
  safeDto: UpdateEdgeMarkerRequest,
  context: PageActionContext
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

    const result = await updateEdgeMarker(
      safeDto,
      userId,
      edgeRepository,
      eventLogPolicyContext
    );

    if (result.isError()) {
      console.error(
        '❌ [updateEdgeMarkersInternal] Edge marker update failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'EDGE_MARKERS_UPDATE_FAILED',
        meta: { originalError: result.error, request: safeDto },
      });
    }

    return ok(result.value.toView());
  } catch (error) {
    console.error('[updateEdgeMarkersInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
