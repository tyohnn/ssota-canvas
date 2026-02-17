'use server';

import type { BlockMountActionContext } from './secure-action';
import { withSingleBlockMountSecureAction } from './secure-action';
import {
  DrizzleEventLogRepository,
  EventLogService,
} from '@/domains/event-management';
import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { updateBlockSize } from '../../backend/services/block-mount';
import {
  UpdateBlockSizeRequest,
  UpdateBlockSizeRequestSchema,
} from '../../shared/dtos/requests';
import { BlockSizeUpdatedDTO } from '../../shared/dtos/responses';

/**
 * Block 크기 업데이트 Server Action
 *
 * ⚠️ Security: withSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Page 기반 권한 확인 (blockMountId → pageId → 권한 검증)
 */
export const updateBlockSizeAction = withSingleBlockMountSecureAction(
  UpdateBlockSizeRequestSchema,
  'updateBlockSizeAction',
  updateBlockSizeInternal,
  {
    getLogMetadata: req => ({ blockMountId: req.blockMountId }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - BlockMountActionContext (blockMountAggregate 포함, 서비스 재조회 없음)
 */
async function updateBlockSizeInternal(
  safeDto: UpdateBlockSizeRequest,
  context: BlockMountActionContext
): Promise<ActionResult<BlockSizeUpdatedDTO>> {
  try {
    const { authenticatedUser, page, blockMountAggregate } = context;
    const userId: UserId = new UserId(authenticatedUser.id);
    const blockMountRepository = new DrizzleBlockMountRepository();

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventLogPolicyContext: EventLogPolicyContext = {
      eventLogService,
      userId: authenticatedUser.id,
      pageId: page.pageId.value,
    };

    const result = await updateBlockSize({
      safeDto,
      safeUserId: userId,
      safeBlockMountAggregate: blockMountAggregate,
      blockMountRepository,
      eventLogPolicyContext,
    });

    if (result.isError()) {
      console.error(
        '❌ [updateBlockSizeInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'SIZE_UPDATE_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. Aggregate → DTO 변환
    const aggregate = result.value;
    const blockMount = aggregate.getBlockMount();
    const dto: BlockSizeUpdatedDTO = {
      blockMountId: safeDto.blockMountId,
      newSize: {
        width: blockMount.size.width,
        height: blockMount.size.height,
      },
      updatedAt: blockMount.updatedAt.toISOString(),
    };

    return ok(dto);
  } catch (error) {
    console.error('[updateBlockSizeInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
