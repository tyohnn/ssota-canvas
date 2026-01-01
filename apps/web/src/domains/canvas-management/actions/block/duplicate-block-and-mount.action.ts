'use server';

import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { BlockManagementService } from '@/domains/block-management/backend/services/block-management.service';
import { ActionResult, err, ok } from '@/lib';
import { withSecureAction } from '@/lib/server-actions';
import type { ActionContext } from '@/lib/server-actions/types';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '../../backend/repositories/implementations/drizzle-edge.repository';
import { CanvasBlockMountService } from '../../backend/services/canvas-block-mount.service';
import { EdgeManagementService } from '../../backend/services/edge.service';
import {
  DuplicateBlockAndMountRequest,
  DuplicateBlockAndMountRequestSchema,
} from '../../shared/dtos/requests';
import { BlockDuplicatedAndMountedDTO } from '../../shared/dtos/responses';

/**
 * Block 복제 Server Action
 *
 * ⚠️ Security: withSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Page 기반 권한 확인 (blockMountId → pageId → 권한 검증)
 */
export const duplicateBlockAndMountAction = withSecureAction(
  DuplicateBlockAndMountRequestSchema,
  {
    getPageId: req => req.pageId,
    actionName: 'duplicateBlockAndMountAction',
    getLogMetadata: req => ({ blockMountId: req.blockMountId }),
  },
  duplicateBlockAndMountInternal
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
  context: ActionContext // ✅ 검증된 context
): Promise<ActionResult<BlockDuplicatedAndMountedDTO>> {
  try {
    // ✅ 이미 검증된 데이터 사용 (중복 조회 제거)
    const { authenticatedUser, workspace } = context;
    const workspaceId: string = workspace.workspaceId.value;

    // Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const blockRepository = new DrizzleBlockRepository();

    // Service 인스턴스 생성
    const blockManagementService = new BlockManagementService(blockRepository);
    const edgeManagementService = new EdgeManagementService(
      blockMountRepository,
      edgeRepository
    );
    const canvasBlockMountService = new CanvasBlockMountService(
      blockManagementService,
      blockMountRepository,
      edgeManagementService
    );

    // ✅ Service에 SafeDTO 전달 (Value Objects 생성은 Service에서 수행)
    const enrichedDto: DuplicateBlockAndMountRequest & {
      userId: string;
      workspaceId: string;
    } = {
      ...safeDto,
      userId: authenticatedUser.id,
      workspaceId,
    };

    const result =
      await canvasBlockMountService.duplicateBlockAndMount(enrichedDto);

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
