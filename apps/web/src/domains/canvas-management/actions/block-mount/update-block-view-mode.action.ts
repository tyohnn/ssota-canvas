'use server';

import type { PageActionContext } from '@/domains/common/auth/types';
import { withBlockMountSecureAction } from '@/domains/common/server-actions';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { updateBlockViewMode } from '../../backend/services/block-mount';
import {
  UpdateBlockMountViewModeRequest,
  UpdateBlockMountViewModeRequestSchema,
} from '../../shared/dtos/requests';

/**
 * Block View Mode 업데이트 Server Action
 *
 * ⚠️ Security: withSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Page 기반 권한 확인 (blockMountId → pageId → 권한 검증)
 */
export const updateBlockMountViewModeAction = withBlockMountSecureAction(
  UpdateBlockMountViewModeRequestSchema,
  'updateBlockMountViewModeAction',
  updateBlockViewModeInternal,
  {
    getLogMetadata: req => ({ blockMountId: req.blockMountId }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청만 받습니다
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스, 페이지 정보
 */
async function updateBlockViewModeInternal(
  safeDto: UpdateBlockMountViewModeRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: PageActionContext // ✅ 검증된 context
): Promise<ActionResult<{ blockMountId: string; viewMode: string }>> {
  try {
    // ✅ 이미 검증된 사용자 정보 사용 (중복 조회 제거)
    const { authenticatedUser } = context;
    const userId: UserId = new UserId(authenticatedUser.id);
    // Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();

    // Service 함수 직접 호출
    const result = await updateBlockViewMode(
      safeDto,
      userId,
      blockMountRepository
    );

    if (result.isError()) {
      console.error(
        '❌ [updateBlockViewModeInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'VIEW_MODE_UPDATE_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. Aggregate → DTO 변환
    const aggregate = result.value;
    const blockMount = aggregate.getBlockMount();
    const dto = {
      blockMountId: blockMount.id.value,
      viewMode: blockMount.viewMode.value,
    };

    return ok(dto);
  } catch (error) {
    console.error('[updateBlockViewModeInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
