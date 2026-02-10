'use server';

import { revalidatePath } from 'next/cache';

import type { PageActionContext } from '@/domains/common/auth/types';
import { withEdgeSecureAction } from '@/domains/common/server-actions';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleEdgeRepository } from '../../backend/repositories/implementations/drizzle-edge.repository';
import { updateEdgeConnection } from '../../backend/services/edge/update-edge-connection.service';
import {
  UpdateEdgeConnectionRequest,
  UpdateEdgeConnectionRequestSchema,
} from '../../shared/dtos/requests/edge.requests';
import { EdgeView } from '../../shared/dtos/views/edge.views';

/**
 * 엣지 연결 정보 업데이트 Server Action
 * - Source/Target 블록 및 핸들 정보 업데이트
 * - 엣지 ID 유지 (삭제 후 생성 아님)
 *
 * ✅ Security: withEdgeSecureAction HOF를 통해 Defense in Depth 적용
 */
export const updateEdgeConnectionAction = withEdgeSecureAction(
  UpdateEdgeConnectionRequestSchema,
  'updateEdgeConnectionAction',
  updateEdgeConnectionInternal,
  {
    getLogMetadata: req => ({ edgeId: req.edgeId }),
  }
);

/**
 * 내부 구현 (인증 및 권한 검증 완료된 요청 처리)
 * 
 * @param safeDto - 검증된 요청 데이터
 * @param context - 인증 및 권한 정보 (Page, Workspace Context)
 */
async function updateEdgeConnectionInternal(
  safeDto: UpdateEdgeConnectionRequest,
  context: PageActionContext
): Promise<ActionResult<EdgeView>> {
  try {
    const { authenticatedUser } = context;
    const userId = new UserId(authenticatedUser.id);
    const edgeRepository = new DrizzleEdgeRepository();

    // 1. 서비스 실행 (Aggregate 반환)
    const result = await updateEdgeConnection(safeDto, userId, edgeRepository);

    if (result.isError()) {
      console.error(
        '❌ [updateEdgeConnectionInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'EDGE_CONNECTION_UPDATE_FAILED',
        meta: {
          originalError: result.error,
          request: safeDto,
        },
      });
    }

    // 2. 캐시 갱신
    revalidatePath('/canvas');

    // 3. 성공 결과(View) 반환
    const aggregate = result.value;
    return ok(aggregate.toView());
  } catch (error) {
    console.error('[updateEdgeConnectionInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
