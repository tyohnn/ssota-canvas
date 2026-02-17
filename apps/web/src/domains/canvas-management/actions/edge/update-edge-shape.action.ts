'use server';

import type { EdgeActionContext } from './secure-action';
import { withSingleEdgeSecureAction } from './secure-action';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleEdgeRepository } from '../../backend/repositories/implementations/drizzle-edge.repository';
import { updateEdgeShape } from '../../backend/services/edge';
import { EdgeView } from '../../shared/dtos/index';
import {
  UpdateEdgeShapeRequest,
  UpdateEdgeShapeRequestSchema,
} from '../../shared/dtos/requests';

/**
 * 엣지 모양 업데이트 Server Action
 *
 * ✅ Aggregate 조회·전달: secure action에서 edgeAggregate 전달, 서비스는 재조회 없음
 */
export const updateEdgeShapeAction = withSingleEdgeSecureAction(
  UpdateEdgeShapeRequestSchema,
  'updateEdgeShapeAction',
  updateEdgeShapeInternal,
  {
    getLogMetadata: req => ({ edgeId: req.edgeId }),
  }
);

async function updateEdgeShapeInternal(
  safeDto: UpdateEdgeShapeRequest,
  context: EdgeActionContext
): Promise<ActionResult<EdgeView>> {
  try {
    const userId = new UserId(context.authenticatedUser.id);
    const edgeRepository = new DrizzleEdgeRepository();

    const result = await updateEdgeShape(
      context.edgeAggregate,
      safeDto.newShape,
      userId,
      edgeRepository
    );

    if (result.isError()) {
      console.error(
        '❌ [updateEdgeShapeInternal] EdgeService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'EDGE_SHAPE_UPDATE_FAILED',
        meta: { originalError: result.error, request: safeDto },
      });
    }

    return ok(result.value.toView());
  } catch (error) {
    console.error('[updateEdgeShapeInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
