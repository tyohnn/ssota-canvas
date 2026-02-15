'use server';

import type { PageActionContext } from '@/domains/common/auth/types';
import { withPageSecureAction } from '@/domains/common/server-actions';
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

/**
 * 노드를 그룹에 추가하는 Server Action
 *
 * ⚠️ Security: withSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns { success: true } (성공) | Error (실패)
 */
export const addNodeToGroupAction = withPageSecureAction(
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
 * ✅ Event Storming + DDD 패턴:
 * - Service에 SafeDTO만 전달 (Value Objects 생성은 Service에서!)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스, 페이지 정보
 */
async function addNodeToGroupInternal(
  safeDto: AddNodeToGroupRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: PageActionContext // ✅ 검증된 context
): Promise<ActionResult<{ success: true }>> {
  try {
    // 1. Service 의존성 생성
    const blockMountRepository = new DrizzleBlockMountRepository();

    // 2. ✅ Service에 SafeDTO 전달
    const result = await addNodeToGroup(safeDto, blockMountRepository);

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
