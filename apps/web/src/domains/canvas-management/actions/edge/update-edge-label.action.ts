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
import { updateEdgeLabel } from '../../backend/services/edge';
import { EdgeView } from '../../shared/dtos/index';
import {
  UpdateEdgeLabelRequest,
  UpdateEdgeLabelRequestSchema,
} from '../../shared/dtos/requests';

/**
 * 엣지 라벨 업데이트 Server Action
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
export const updateEdgeLabelAction = withEdgeSecureAction(
  UpdateEdgeLabelRequestSchema,
  'updateEdgeLabelAction',
  updateEdgeLabelInternal,
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
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스, 페이지 정보
 */
async function updateEdgeLabelInternal(
  safeDto: UpdateEdgeLabelRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: PageActionContext // ✅ 검증된 context
): Promise<ActionResult<EdgeView>> {
  try {
    const userId: UserId = new UserId(context.authenticatedUser.id);
    const edgeRepository = new DrizzleEdgeRepository();

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventLogPolicyContext: EventLogPolicyContext = {
      eventLogService,
      userId: context.authenticatedUser.id,
      pageId: context.page.pageId.value,
    };

    const result = await updateEdgeLabel(
      safeDto,
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
