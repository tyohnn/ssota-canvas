'use server';

import { uuidToSlug } from '@/lib/utils';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import {
  DrizzleEventLogRepository,
  EventLogService,
} from '@/domains/event-management';
import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { createGroupFromNodes } from '../../backend/services/group-node';
import {
  CreateGroupFromNodesRequest,
  CreateGroupFromNodesRequestSchema,
} from '../../shared/dtos/requests';

import type { GroupActionContext } from './secure-action';
import { withGroupSecureAction } from './secure-action';

/**
 * 선택된 노드들로 그룹을 생성하는 Server Action
 *
 * ⚠️ Security: withGroupSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 * 5. 페이지 접근 권한 확인
 * 6. 노드 존재 여부 검증
 * 7. 페이지 일치 검증
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns { groupBlockMountId: string; groupBlockId: string } (성공) | Error (실패)
 */
export const createGroupFromNodesAction = withGroupSecureAction(
  CreateGroupFromNodesRequestSchema,
  'createGroupFromNodesAction',
  createGroupFromNodesInternal,
  {
    getLogMetadata: req => ({ pageId: req.pageId, nodeCount: req.nodeIds.length }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ✅ Event Storming + DDD 패턴:
 * - Service에 SafeDTO만 전달 (Value Objects 생성은 Service에서!)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 * ⚠️ withGroupSecureAction이 노드 조회 및 검증을 수행합니다
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 context (nodeAggregates 포함)
 */
async function createGroupFromNodesInternal(
  safeDto: CreateGroupFromNodesRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: GroupActionContext // ✅ 검증된 context + nodeAggregates
): Promise<ActionResult<{ groupBlockMountId: string; groupBlockId: string }>> {
  try {
    // 1. Service 의존성 생성
    const blockRepository = new DrizzleBlockRepository();
    const blockMountRepository = new DrizzleBlockMountRepository();

    // 2. Value Objects 생성 (GroupActionContext → PageActionContext: authenticatedUser.id, workspace.workspaceId)
    const safeUserId = new UserId(context.authenticatedUser.id);
    const safeWorkspaceId = context.workspace.workspaceId;

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventLogPolicyContext: EventLogPolicyContext = {
      eventLogService,
      userId: context.authenticatedUser.id,
      pageId: context.page.pageId.value,
    };

    // 3. ✅ Service에 검증된 Aggregates + 감사 로그 context 전달 (params 객체)
    const result = await createGroupFromNodes({
      nodeAggregates: context.nodeAggregates,
      safeDto,
      safeUserId,
      safeWorkspaceId,
      blockRepository,
      blockMountRepository,
      eventLogPolicyContext,
    });

    if (result.isError()) {
      console.error(
        '❌ [createGroupFromNodesInternal] GroupNodeService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'CREATE_GROUP_FROM_NODES_FAILED',
        meta: {
          originalError: result.error,
          request: safeDto,
        },
      });
    }

    return ok({
      groupBlockMountId: uuidToSlug(result.value.groupBlockMountId),
      groupBlockId: uuidToSlug(result.value.groupBlockId),
    });
  } catch (error) {
    console.error('[createGroupFromNodesInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
