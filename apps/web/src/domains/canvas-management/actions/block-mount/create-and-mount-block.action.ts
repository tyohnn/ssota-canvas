'use server';

import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import type { PageActionContext } from '@/domains/common/auth/types';
import { withPageSecureAction } from '@/domains/common/server-actions';
import {
  DrizzleEventLogRepository,
  EventLogService,
} from '@/domains/event-management';
import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import {
  createAndMountBlock,
  createBlocksAndMounts,
} from '../../backend/services/block-mount';
import {
  CreateAndMountBlockRequest,
  CreateAndMountBlockRequestSchema,
  CreateAndMountBlocksRequest,
  CreateAndMountBlocksRequestSchema,
} from '../../shared/dtos/requests';
import { BlockCreatedAndMountedDTO } from '../../shared/dtos/responses';

/**
 * Block 생성 및 마운팅 Server Action
 *
 * ⚠️ Security: withSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Page 기반 권한 확인 (workspace/org는 pageId로부터 자동 조회)
 */
export const createAndMountBlockAction = withPageSecureAction(
  CreateAndMountBlockRequestSchema,
  'createAndMountBlockAction',
  createAndMountBlockInternal,
  {
    getLogMetadata: req => ({
      pageId: req.pageId,
      blockType: req.blockType,
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
async function createAndMountBlockInternal(
  safeDto: CreateAndMountBlockRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: PageActionContext // ✅ 검증된 context
): Promise<ActionResult<BlockCreatedAndMountedDTO>> {
  try {
    // ✅ 이미 검증된 데이터 사용 (중복 조회 제거)
    const { authenticatedUser, workspace, page } = context;

    const userId: UserId = new UserId(authenticatedUser.id);
    const workspaceId: WorkspaceId = workspace.workspaceId;
    // Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const blockRepository = new DrizzleBlockRepository();

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventLogPolicyContext: EventLogPolicyContext = {
      eventLogService,
      userId: authenticatedUser.id,
      pageId: page.pageId.value,
      blockType: safeDto.blockType,
    };

    // Service 함수 직접 호출
    const result = await createAndMountBlock(
      safeDto,
      userId,
      workspaceId,
      blockRepository,
      blockMountRepository,
      eventLogPolicyContext
    );

    if (result.isError()) {
      console.error(
        '❌ [createAndMountBlockInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'BLOCK_CREATION_FAILED',
        meta: { originalError: result.error, request: safeDto },
      });
    }

    // 6. ✅ Aggregate → DTO 변환 (toView 사용)
    const { blockMountAggregate, blockAggregate } = result.value;
    const blockView = blockMountAggregate.toView(blockAggregate);

    return ok(blockView);
  } catch (error) {
    console.error('[createAndMountBlockInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}

/**
 * Block 생성 및 마운트 (다중, 배치) Server Action
 *
 * - pageId 한 번으로 페이지 권한 검증
 * - BlockMount는 createMany 1회
 */
export const createBlocksAndMountsAction = withPageSecureAction(
  CreateAndMountBlocksRequestSchema,
  'createBlocksAndMountsAction',
  createBlocksAndMountsInternal,
  {
    getLogMetadata: req => ({
      pageId: req.pageId,
      blockCount: req.blocks.length,
    }),
  }
);

async function createBlocksAndMountsInternal(
  safeDto: CreateAndMountBlocksRequest,
  context: PageActionContext
): Promise<ActionResult<BlockCreatedAndMountedDTO[]>> {
  try {
    const { authenticatedUser, workspace, page } = context;
    const userId = new UserId(authenticatedUser.id);
    const workspaceId: WorkspaceId = workspace.workspaceId;
    const blockMountRepository = new DrizzleBlockMountRepository();
    const blockRepository = new DrizzleBlockRepository();

    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventLogPolicyContext: EventLogPolicyContext = {
      eventLogService,
      userId: authenticatedUser.id,
      pageId: page.pageId.value,
    };

    const result = await createBlocksAndMounts({
      safeDto,
      safeUserId: userId,
      safeWorkspaceId: workspaceId,
      blockRepository,
      blockMountRepository,
      eventLogPolicyContext,
    });

    if (result.isError()) {
      return err(String(result.error), {
        code: 'BLOCK_MOUNT_CREATION_FAILED',
        meta: { originalError: result.error, request: safeDto },
      });
    }

    const views = result.value.map(({ blockMountAggregate, blockAggregate }) =>
      blockMountAggregate.toView(blockAggregate)
    );
    return ok(views);
  } catch (error) {
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
