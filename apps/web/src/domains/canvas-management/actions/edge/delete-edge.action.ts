'use server';

import type { PageActionContext } from '@/domains/common/auth/types';
import { withEdgeSecureAction } from '@/domains/common/server-actions';
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
 * ⚠️ Security: withSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns void (성공) | Error (실패)
 */
export const deleteEdgeAction = withEdgeSecureAction(
  DeleteEdgeRequestSchema,
  'deleteEdgeAction',
  deleteEdgeInternal,
  {
    getLogMetadata: req => ({ edgeId: req.edgeId }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ✅ Event Storming + DDD 패턴:
 * - Service에 SafeDTO만 전달 (Value Objects 생성은 Service에서!)
 *
 * ⚠️ 이 함수는 이미 검증된 요청만 받습니다
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스, 페이지 정보
 */
async function deleteEdgeInternal(
  safeDto: DeleteEdgeRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: PageActionContext // ✅ 검증된 context
): Promise<ActionResult<void>> {
  try {
    const { authenticatedUser } = context;
    const userId: UserId = new UserId(authenticatedUser.id);

    // 1. Service 의존성 생성
    const edgeRepository = new DrizzleEdgeRepository();

    // 2. ✅ Service에 SafeDTO만 전달 (Value Objects 생성은 Service에서 수행)
    const result = await deleteEdge(safeDto, userId, edgeRepository);

    if (result.isError()) {
      console.error(
        '❌ [deleteEdgeInternal] EdgeService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'EDGE_DELETION_FAILED',
        meta: {
          originalError: result.error,
          request: safeDto,
        },
      });
    }

    return ok(undefined);
  } catch (error) {
    console.error('[deleteEdgeInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
