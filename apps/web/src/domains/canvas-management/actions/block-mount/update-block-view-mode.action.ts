'use server';

import type { BlockMountActionContext } from './secure-action';
import { withSingleBlockMountSecureAction } from './secure-action';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { updateBlockViewMode } from '../../backend/services/block-mount';
import {
  UpdateBlockMountViewModeRequest,
  UpdateBlockMountViewModeRequestSchema,
} from '../../shared/dtos/requests';
import { BlockViewModeUpdatedDTO } from '../../shared/dtos/responses/block.responses';

/**
 * Block View Mode 업데이트 Server Action
 *
 * ⚠️ Security: withSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Page 기반 권한 확인 (blockMountId → pageId → 권한 검증)
 */
export const updateBlockMountViewModeAction = withSingleBlockMountSecureAction(
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
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 context (blockMountAggregate 포함, 서비스 재조회 없음)
 */
async function updateBlockViewModeInternal(
  safeDto: UpdateBlockMountViewModeRequest,
  context: BlockMountActionContext
): Promise<ActionResult<BlockViewModeUpdatedDTO>> {
  try {
    const userId: UserId = new UserId(context.authenticatedUser.id);
    const blockMountRepository = new DrizzleBlockMountRepository();

    const result = await updateBlockViewMode({
      safeDto,
      safeUserId: userId,
      safeBlockMountAggregate: context.blockMountAggregate,
      blockMountRepository,
    });

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

    // 현재 viewMode에 맞는 크기 조회
    const currentSize = blockMount.size;

    const dto: BlockViewModeUpdatedDTO = {
      blockMountId: safeDto.blockMountId,
      viewMode: blockMount.viewMode.value,
      size: {
        width: currentSize.width,
        height: currentSize.height,
      },
      updatedAt: blockMount.updatedAt.toISOString(),
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
