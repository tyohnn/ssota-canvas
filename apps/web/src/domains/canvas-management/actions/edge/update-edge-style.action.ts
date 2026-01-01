'use server';

import { ActionResult, err, ok } from '@/lib';
import { withSecureAction } from '@/lib/server-actions';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '../../backend/repositories/implementations/drizzle-edge.repository';
import { EdgeManagementService } from '../../backend/services/edge.service';
import { EdgeView } from '../../shared/dtos/index';
import {
  UpdateEdgeStyleRequest,
  UpdateEdgeStyleRequestSchema,
} from '../../shared/dtos/requests';
import { EdgeId } from '../../shared/value-objects/edge-id.vo';

/**
 * 엣지 스타일 업데이트 Server Action
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
export const updateEdgeStyleAction = withSecureAction(
  UpdateEdgeStyleRequestSchema,
  {
    getPageId: async req => {
      // Edge 조회하여 pageId 얻기 (Indirect access)
      const edgeRepository = new DrizzleEdgeRepository();
      const edgeIdVO = new EdgeId(req.edgeId);
      const edgeAggregate = await edgeRepository.findById(edgeIdVO);

      if (!edgeAggregate) {
        return { pageId: '', notFoundError: 'Edge not found' };
      }

      return edgeAggregate.edge.pageId.value;
    },
    actionName: 'updateEdgeStyleAction',
    getLogMetadata: req => ({ edgeId: req.edgeId }),
  },
  updateEdgeStyleInternal
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
 * @param authenticatedUser - 인증된 사용자
 * @param workspace - 검증된 워크스페이스 entity
 */
async function updateEdgeStyleInternal(
  safeDto: UpdateEdgeStyleRequest // ✅ 이미 검증됨 (SafeDTO)
): Promise<ActionResult<EdgeView>> {
  try {
    // 1. Service 의존성 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const edgeManagementService = new EdgeManagementService(
      blockMountRepository,
      edgeRepository
    );

    // 2. ✅ Service에 SafeDTO만 전달 (Value Objects 생성은 Service에서 수행)
    const result = await edgeManagementService.updateEdgeStyle(safeDto);

    if (result.isError()) {
      console.error(
        '❌ [updateEdgeStyleInternal] EdgeService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'EDGE_STYLE_UPDATE_FAILED',
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
