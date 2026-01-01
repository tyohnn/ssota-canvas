'use server';

import { revalidatePath } from 'next/cache';

import { getAuthErrorMessage } from '@/domains/common/auth/error';
import {
  type AuthenticatedUser,
  getAuthenticatedUser,
  verifyAccessByPageId,
} from '@/domains/common/auth/helpers';
import type { Workspace } from '@/domains/workspace-management/shared/entities/workspace.entity';
import { ActionResult, err, ok } from '@/lib/action-result';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '../../backend/repositories/implementations/drizzle-edge.repository';
import { EdgeManagementService } from '../../backend/services/edge.service';
import {
  DeleteEdgeRequest,
  DeleteEdgeRequestSchema,
} from '../../shared/dtos/requests';
import { EdgeId } from '../../shared/value-objects/edge-id.vo';

/**
 * 엣지 삭제 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * Defense in Depth:
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns void (성공) | Error (실패)
 */
export async function deleteEdgeAction(
  request: unknown // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<void>> {
  // 1. Runtime Validation (필수)
  const parseResult = DeleteEdgeRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to deleteEdgeAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: DeleteEdgeRequest

  // 3. 인증 확인 (Supabase Auth)
  try {
    const authenticatedUser = await getAuthenticatedUser();

    // 4. Edge 조회하여 pageId 얻기
    const edgeRepository = new DrizzleEdgeRepository();
    const edgeIdVO = new EdgeId(validatedRequest.edgeId);
    const edgeAggregate = await edgeRepository.findById(edgeIdVO);

    if (!edgeAggregate) {
      return err('Edge not found', {
        code: 'EDGE_NOT_FOUND',
      });
    }

    const pageId = edgeAggregate.edge.pageId.value;

    // 5. Page 기반 권한 확인
    const accessResult = await verifyAccessByPageId(
      pageId,
      authenticatedUser.id
    );

    if (!accessResult.success) {
      console.warn('[Security] Access denied', {
        userId: authenticatedUser.id,
        edgeId: validatedRequest.edgeId,
        pageId,
        error: accessResult.error,
      });

      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    // 6. 검증 완료 - Internal 함수 호출 (검증된 workspace 전달)
    return await deleteEdgeInternal(
      validatedRequest,
      authenticatedUser,
      accessResult.workspace! // ✅ 검증된 workspace entity
    );
  } catch (error) {
    console.error('[deleteEdgeAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      {
        code: 'UNAUTHORIZED',
      }
    );
  }
}

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
async function deleteEdgeInternal(
  safeDto: DeleteEdgeRequest, // ✅ 이미 검증됨 (SafeDTO)
  authenticatedUser: AuthenticatedUser, // ✅ 이미 인증됨
  workspace: Workspace // ✅ 이미 검증된 workspace entity
): Promise<ActionResult<void>> {
  try {
    // 1. Service 의존성 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const edgeManagementService = new EdgeManagementService(
      blockMountRepository,
      edgeRepository
    );

    // 2. ✅ Service에 SafeDTO만 전달 (Value Objects 생성은 Service에서 수행)
    const result = await edgeManagementService.deleteEdge(safeDto);

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
