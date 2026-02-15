'use server';

import type { PageActionContext } from '@/domains/common/auth/types';
import {
  DrizzleEventLogRepository,
  EventLogService,
} from '@/domains/event-management';
import type { EventLogPolicyContext } from '@/domains/event-management';
import type { Page } from '@/domains/workspace-management/shared/entities/page.entity';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { moveBlockToPage } from '../../backend/services/block-mount';
import {
  MoveBlockToPageRequest,
  MoveBlockToPageRequestSchema,
} from '../../shared/dtos/requests';
import { BlockMovedToPageDTO } from '../../shared/dtos/responses';
import { withMoveBlockSecureAction } from './secure-action';

/**
 * Block 페이지 이동 Server Action
 *
 * ⚠️ Security: withMoveBlockSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 원본 Page 권한 검증 (blockMountId → pageId 자동 추출)
 * 4. Target Page 권한 검증
 * 5. Cross-workspace move 방지
 */
export const moveBlockToPageAction = withMoveBlockSecureAction(
  MoveBlockToPageRequestSchema,
  'moveBlockToPageAction',
  moveBlockToPageInternal,
  {
    getLogMetadata: req => ({
      blockMountId: req.blockMountId,
      targetPageId: req.targetPageId,
    }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청만 받습니다
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스, 페이지 정보 + targetPage
 */
async function moveBlockToPageInternal(
  safeDto: MoveBlockToPageRequest,
  context: PageActionContext & { targetPage: Page }
): Promise<ActionResult<BlockMovedToPageDTO>> {
  try {
    const { authenticatedUser, targetPage } = context;
    const userId: UserId = new UserId(authenticatedUser.id);
    const blockMountRepository = new DrizzleBlockMountRepository();

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventLogPolicyContext: EventLogPolicyContext = {
      eventLogService,
      userId: authenticatedUser.id,
      pageId: targetPage.pageId.value,
    };

    const result = await moveBlockToPage(
      safeDto,
      userId,
      blockMountRepository,
      eventLogPolicyContext
    );

    if (result.isError()) {
      console.error(
        '❌ [moveBlockToPageInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'BLOCK_MOVE_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. Aggregate → DTO 변환
    const blockMountAggregate = result.value;
    const blockMount = blockMountAggregate.getBlockMount();
    const dto: BlockMovedToPageDTO = {
      blockMountId: blockMount.id.value,
      newPageId: blockMount.pageId.value,
      newPosition: {
        x: blockMount.position.x,
        y: blockMount.position.y,
      },
      movedAt: blockMount.updatedAt.toISOString(),
    };

    return ok(dto);
  } catch (error) {
    console.error('[moveBlockToPageInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
