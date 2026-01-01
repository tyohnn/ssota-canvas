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
  CreateAndMountBlockRequest,
  CreateAndMountBlockRequestSchema,
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
export const createAndMountBlockAction = withSecureAction(
  CreateAndMountBlockRequestSchema,
  {
    getPageId: req => req.pageId,
    actionName: 'createAndMountBlockAction',
    getLogMetadata: req => ({
      pageId: req.pageId,
      blockType: req.blockType,
    }),
  },
  createAndMountBlockInternal
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
  context: ActionContext // ✅ 검증된 context
): Promise<ActionResult<BlockCreatedAndMountedDTO>> {
  try {
    // ✅ 이미 검증된 데이터 사용 (중복 조회 제거)
    const { authenticatedUser, workspace, page } = context;
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
    const blockMountService = new CanvasBlockMountService(
      blockManagementService,
      blockMountRepository,
      edgeManagementService
    );

    // 5. ✅ Service에 SafeDTO 전달 (Value Objects 생성은 Service에서 수행)
    const enrichedDto: CreateAndMountBlockRequest & {
      userId: string;
      workspaceId: string;
    } = {
      ...safeDto,
      userId: authenticatedUser.id,
      workspaceId,
    };

    const result = await blockMountService.createAndMountBlock(enrichedDto);

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
