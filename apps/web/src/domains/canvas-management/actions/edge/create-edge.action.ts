'use server';

import type { PageActionContext } from '@/domains/common/auth/types';
import { withPageSecureAction } from '@/domains/common/server-actions';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '../../backend/repositories/implementations/drizzle-edge.repository';
import { createEdge } from '../../backend/services/edge';
import { EdgeView } from '../../shared/dtos/index';
import {
  CreateEdgeRequest,
  CreateEdgeRequestSchema,
} from '../../shared/dtos/requests';

/**
 * 엣지 생성 Server Action
 *
 * ⚠️ Security: withSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns EdgeView (성공) | Error (실패)
 */
export const createEdgeAction = withPageSecureAction(
  CreateEdgeRequestSchema,
  'createEdgeAction',
  createEdgeInternal,
  {
    getLogMetadata: req => ({ pageId: req.pageId }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ✅ Event Storming + DDD 패턴:
 * - Service에 SafeDTO만 전달 (Value Objects 생성은 Service에서!)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스, 페이지 정보
 */
async function createEdgeInternal(
  safeDto: CreateEdgeRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: PageActionContext // ✅ 검증된 context
): Promise<ActionResult<EdgeView>> {
  try {
    const userId: UserId = new UserId(context.authenticatedUser.id);
    // 1. Service 의존성 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();

    // 2. ✅ Service에 SafeDTO와 검증된 userId 전달 (Value Objects 생성은 Service에서 수행)
    const result = await createEdge(
      safeDto,
      userId,
      blockMountRepository,
      edgeRepository
    );

    if (result.isError()) {
      console.error(
        '❌ [createEdgeInternal] EdgeService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'EDGE_CREATION_FAILED',
        meta: {
          originalError: result.error,
          request: safeDto,
        },
      });
    }

    // 3. Aggregate → DTO 변환
    const aggregate = result.value;
    const edgeView = aggregate.toView();

    return ok(edgeView);
  } catch (error) {
    console.error('[createEdgeInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
