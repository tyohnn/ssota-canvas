'use server';

import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import type { PageActionContext } from '@/domains/common/auth/types';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import {
  duplicateBlockAndMount,
  duplicateBlocksAndMount,
} from '../../backend/services/block-mount';
import {
  DuplicateBlockAndMountRequest,
  DuplicateBlockAndMountRequestSchema,
  DuplicateBlocksAndMountRequest,
  DuplicateBlocksAndMountRequestSchema,
} from '../../shared/dtos/requests';
import { BlockDuplicatedAndMountedDTO } from '../../shared/dtos/responses';
import {
  withDuplicateBlockSecureAction,
  withDuplicateBlocksSecureAction,
} from './secure-action';

/**
 * Block 복제 Server Action
 *
 * ⚠️ Security: withDuplicateBlockSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. BlockMount 조회 → pageId, blockId 자동 추출 (Zero Trust)
 * 4. Page 권한 검증 (workspace, organization 자동 검증됨)
 * 5. Block ownership 검증
 */
export const duplicateBlockAndMountAction = withDuplicateBlockSecureAction(
  DuplicateBlockAndMountRequestSchema,
  'duplicateBlockAndMountAction',
  duplicateBlockAndMountInternal,
  {
    getLogMetadata: req => ({ blockMountId: req.blockMountId }),
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
async function duplicateBlockAndMountInternal(
  safeDto: DuplicateBlockAndMountRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: PageActionContext // ✅ 검증된 context
): Promise<ActionResult<BlockDuplicatedAndMountedDTO>> {
  try {
    // ✅ 이미 검증된 데이터 사용 (중복 조회 제거)
    const { authenticatedUser, workspace } = context;
    const userId: UserId = new UserId(authenticatedUser.id);
    const workspaceId: WorkspaceId = workspace.workspaceId;

    // Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const blockRepository = new DrizzleBlockRepository();

    // Service 함수 직접 호출
    const result = await duplicateBlockAndMount(
      safeDto,
      userId,
      workspaceId,
      blockRepository,
      blockMountRepository
    );

    if (result.isError()) {
      console.error(
        '❌ [duplicateBlockAndMountInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'BLOCK_DUPLICATION_FAILED',
        meta: { originalError: result.error, request: safeDto },
      });
    }

    // ✅ Aggregate → DTO 변환 (toView 사용)
    const { blockMountAggregate, blockAggregate } = result.value;
    const blockView = blockMountAggregate.toView(blockAggregate);

    return ok(blockView);
  } catch (error) {
    console.error('[duplicateBlockAndMountInternal] Internal error:', error);
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
 * Block 복제 (다중, 배치) Server Action
 *
 * ⚠️ Security: withDuplicateBlocksSecureAction — 첫 번째 blockMountId로 페이지 권한 검증
 */
export const duplicateBlocksAndMountAction = withDuplicateBlocksSecureAction(
  DuplicateBlocksAndMountRequestSchema,
  'duplicateBlocksAndMountAction',
  duplicateBlocksAndMountInternal,
  {
    getLogMetadata: req => ({ blocksCount: req.blocks.length }),
  }
);

async function duplicateBlocksAndMountInternal(
  safeDto: DuplicateBlocksAndMountRequest,
  context: PageActionContext
): Promise<ActionResult<BlockDuplicatedAndMountedDTO[]>> {
  try {
    const { authenticatedUser, workspace } = context;
    const userId: UserId = new UserId(authenticatedUser.id);
    const workspaceId: WorkspaceId = workspace.workspaceId;

    const blockMountRepository = new DrizzleBlockMountRepository();
    const blockRepository = new DrizzleBlockRepository();

    const result = await duplicateBlocksAndMount({
      safeDto,
      safeUserId: userId,
      safeWorkspaceId: workspaceId,
      blockRepository,
      blockMountRepository,
    });

    if (result.isError()) {
      console.error(
        '❌ [duplicateBlocksAndMountInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'BLOCK_DUPLICATION_FAILED',
        meta: { originalError: result.error, request: safeDto },
      });
    }

    const dtos: BlockDuplicatedAndMountedDTO[] = result.value.map(
      ({ blockMountAggregate, blockAggregate }) =>
        blockMountAggregate.toView(blockAggregate)
    );
    return ok(dtos);
  } catch (error) {
    console.error('[duplicateBlocksAndMountInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
