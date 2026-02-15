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
import { updateBlockPosition } from '../../backend/services/block-mount';
import {
  UpdateBlockPositionRequest,
  UpdateBlockPositionRequestSchema,
} from '../../shared/dtos/requests';
import { BlockPositionUpdatedDTO } from '../../shared/dtos/responses';

/**
 * Block 위치 업데이트 Server Action
 *
 * ⚠️ Security: withSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Page 기반 권한 확인 (pageId 직접 전달)
 */
export const updateBlockPositionAction = withPageSecureAction(
  UpdateBlockPositionRequestSchema,
  'updateBlockPositionAction',
  updateBlockPositionInternal,
  {
    getLogMetadata: req => ({
      blockCount: req.blockPositions.length,
    }),
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
async function updateBlockPositionInternal(
  safeDto: UpdateBlockPositionRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: PageActionContext // ✅ 검증된 context
): Promise<ActionResult<BlockPositionUpdatedDTO[]>> {
  try {
    // ✅ 이미 검증된 사용자 정보 사용 (중복 조회 제거)
    const { authenticatedUser, page } = context;
    const userId: UserId = new UserId(authenticatedUser.id);
    const blockMountRepository = new DrizzleBlockMountRepository();

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventLogPolicyContext: EventLogPolicyContext = {
      eventLogService,
      userId: authenticatedUser.id,
      pageId: page.pageId.value,
    };

    const result = await updateBlockPosition(
      safeDto,
      userId,
      blockMountRepository,
      eventLogPolicyContext
    );

    if (result.isError()) {
      console.error(
        '❌ [updateBlockPositionInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'POSITION_UPDATE_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. Aggregate → DTO 변환 (다중 결과 처리)
    const aggregates = result.value;
    const dtos: BlockPositionUpdatedDTO[] = aggregates.map(aggregate => ({
      blockMountId: aggregate.getBlockMount().id.value,
      newPosition: {
        x: aggregate.getBlockMount().position.x,
        y: aggregate.getBlockMount().position.y,
      },
      updatedAt: aggregate.getBlockMount().updatedAt.toISOString(),
    }));

    if (dtos.length === 0) {
      return err('No aggregate returned from service', {
        code: 'POSITION_UPDATE_FAILED',
      });
    }

    return ok(dtos);
  } catch (error) {
    console.error('[updateBlockPositionInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
