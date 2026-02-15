'use server';

import type { PageActionContext } from '@/domains/common/auth/types';
import { withPageSecureAction } from '@/domains/common/server-actions';
import {
  DrizzleEventLogRepository,
  EventLogService,
} from '@/domains/event-management';
import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '../../backend/repositories/implementations/drizzle-edge.repository';
import { softDeleteBlockMount } from '../../backend/services/block-mount';
import {
  SoftDeleteBlockMountRequest,
  SoftDeleteBlockMountRequestSchema,
} from '../../shared/dtos/requests';
import { BlockMountSoftDeletedDTO } from '../../shared/dtos/responses';

/**
 * Block Mount 삭제 Server Action
 *
 * ⚠️ Security: withSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Page 기반 권한 확인 (blockMountId → pageId → 권한 검증)
 */
export const softDeleteBlockMountAction = withPageSecureAction(
  SoftDeleteBlockMountRequestSchema,
  'softDeleteBlockMountAction',
  softDeleteBlockMountInternal,
  {
    getLogMetadata: req => ({ blockMountIds: req.blockMountIds }),
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
async function softDeleteBlockMountInternal(
  safeDto: SoftDeleteBlockMountRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: PageActionContext // ✅ 검증된 context
): Promise<ActionResult<BlockMountSoftDeletedDTO>> {
  try {
    const { authenticatedUser, page } = context;
    const userId: UserId = new UserId(authenticatedUser.id);
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventLogPolicyContext: EventLogPolicyContext = {
      eventLogService,
      userId: authenticatedUser.id,
      pageId: page.pageId.value,
    };

    const result = await softDeleteBlockMount(
      safeDto,
      userId,
      blockMountRepository,
      edgeRepository,
      eventLogPolicyContext
    );

    if (result.isError()) {
      console.error(
        '❌ [softDeleteBlockMountInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'BLOCK_MOUNT_DELETION_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. DTO 직렬화 (다중 결과 처리)
    const dto: BlockMountSoftDeletedDTO = {
      deletedCount: result.value.deletedCount,
      deletedEdgesCount: result.value.deletedEdgesCount,
      deletedAt: new Date().toISOString(),
      deletedBlockMountIds: result.value.deletedBlockMountIds.map(
        id => id.value
      ),
    };

    return ok(dto);
  } catch (error) {
    console.error('[softDeleteBlockMountInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
