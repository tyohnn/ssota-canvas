'use server';

import {
  DrizzleEventLogRepository,
  EventLogService,
} from '@/domains/event-management';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { removeNodeFromGroup } from '../../backend/services/group-node';
import {
  RemoveNodeFromGroupRequest,
  RemoveNodeFromGroupRequestSchema,
} from '../../shared/dtos/requests';

import type { RemoveNodeFromGroupActionContext } from './secure-action';
import { withRemoveNodeFromGroupSecureAction } from './secure-action';

/**
 * 노드를 그룹에서 제거하는 Server Action
 *
 * ⚠️ Security: withRemoveNodeFromGroupSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 및 페이지 권한
 * 3. child block mount 조회 및 페이지 일치 검증
 * 4. 서비스에는 aggregate 전달 (재조회 없음)
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns { success: true } (성공) | Error (실패)
 */
export const removeNodeFromGroupAction = withRemoveNodeFromGroupSecureAction(
  RemoveNodeFromGroupRequestSchema,
  'removeNodeFromGroupAction',
  removeNodeFromGroupInternal,
  {
    getLogMetadata: req => ({ pageId: req.pageId }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 context (childBlockMountAggregate 포함)
 */
async function removeNodeFromGroupInternal(
  safeDto: RemoveNodeFromGroupRequest,
  context: RemoveNodeFromGroupActionContext
): Promise<ActionResult<{ success: true }>> {
  try {
    const blockMountRepository = new DrizzleBlockMountRepository();

    const result = await removeNodeFromGroup({
      safeDto,
      safeChildAggregate: context.childBlockMountAggregate,
      blockMountRepository,
    });

    if (result.isError()) {
      console.error(
        '❌ [removeNodeFromGroupInternal] GroupNodeService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'REMOVE_NODE_FROM_GROUP_FAILED',
        meta: {
          originalError: result.error,
          request: safeDto,
        },
      });
    }

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    await eventLogService
      .logBlockMountUpdated({
        pageId: context.page.pageId.value,
        userId: context.authenticatedUser.id,
        blockMountId: safeDto.childBlockMountId,
        changes: { groupRemoved: true },
      })
      .catch(() => {});

    return ok({ success: true });
  } catch (error) {
    console.error('[removeNodeFromGroupInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
