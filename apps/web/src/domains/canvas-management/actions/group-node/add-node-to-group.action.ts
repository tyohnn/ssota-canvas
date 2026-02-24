'use server';

import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import {
  DrizzleEventLogRepository,
  EventLogService,
} from '@/domains/event-management';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { addNodeToGroup } from '../../backend/services/group-node';
import {
  AddNodeToGroupRequest,
  AddNodeToGroupRequestSchema,
} from '../../shared/dtos/requests';

import type { AddNodeToGroupActionContext } from './secure-action';
import { withAddNodeToGroupSecureAction } from './secure-action';

/**
 * 노드를 그룹에 추가하는 Server Action
 *
 * ⚠️ Security: withAddNodeToGroupSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 및 페이지 권한
 * 3. child/parent block mount 조회 및 페이지 일치 검증
 * 4. 서비스에는 aggregate 전달 (재조회 없음)
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns { success: true } (성공) | Error (실패)
 */
export const addNodeToGroupAction = withAddNodeToGroupSecureAction(
  AddNodeToGroupRequestSchema,
  'addNodeToGroupAction',
  addNodeToGroupInternal,
  {
    getLogMetadata: req => ({ pageId: req.pageId }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 context (childBlockMountAggregate, parentBlockMountAggregate 포함)
 */
async function addNodeToGroupInternal(
  safeDto: AddNodeToGroupRequest,
  context: AddNodeToGroupActionContext
): Promise<ActionResult<{ success: true }>> {
  try {
    const blockRepository = new DrizzleBlockRepository();
    const childBlock = await blockRepository.findById(
      context.childBlockMountAggregate.getBlockMount().blockId
    );
    if (childBlock?.blockType.value === BlockType.GROUP) {
      return err('Cannot nest a group inside another group', {
        code: 'NESTED_GROUP_NOT_ALLOWED',
      });
    }

    const blockMountRepository = new DrizzleBlockMountRepository();

    const result = await addNodeToGroup({
      safeDto,
      safeChildAggregate: context.childBlockMountAggregate,
      safeParentAggregate: context.parentBlockMountAggregate,
      blockMountRepository,
    });

    if (result.isError()) {
      console.error(
        '❌ [addNodeToGroupInternal] GroupNodeService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'ADD_NODE_TO_GROUP_FAILED',
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
        changes: { groupAdded: safeDto.parentBlockMountId },
      })
      .catch(() => {});

    return ok({ success: true });
  } catch (error) {
    console.error('[addNodeToGroupInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
