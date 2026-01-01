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
  UpdateBlockSizeRequest,
  UpdateBlockSizeRequestSchema,
} from '../../shared/dtos/requests';
import { BlockSizeUpdatedDTO } from '../../shared/dtos/responses';
import { BlockMountId } from '../../shared/value-objects/block-mount-id.vo';

/**
 * Block 크기 업데이트 Server Action
 *
 * ⚠️ Security: withSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Page 기반 권한 확인 (blockMountId → pageId → 권한 검증)
 */
export const updateBlockSizeAction = withSecureAction(
  UpdateBlockSizeRequestSchema,
  {
    getPageId: async req => {
      // BlockMount 조회하여 pageId 얻기 (Indirect access)
      const blockMountRepository = new DrizzleBlockMountRepository();
      const blockMountIdVO = new BlockMountId(req.blockMountId);
      const aggregate = await blockMountRepository.findById(blockMountIdVO);

      if (!aggregate) {
        return { pageId: '', notFoundError: 'Block mount not found' };
      }

      return aggregate.getBlockMount().pageId.value;
    },
    actionName: 'updateBlockSizeAction',
    getLogMetadata: req => ({ blockMountId: req.blockMountId }),
  },
  updateBlockSizeInternal
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청만 받습니다
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스, 페이지 정보
 */
async function updateBlockSizeInternal(
  safeDto: UpdateBlockSizeRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: ActionContext // ✅ 검증된 context
): Promise<ActionResult<BlockSizeUpdatedDTO>> {
  try {
    // ✅ 이미 검증된 사용자 정보 사용 (중복 조회 제거)
    const { authenticatedUser } = context;

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
    const enrichedDto: UpdateBlockSizeRequest & {
      userId: string;
    } = {
      ...safeDto,
      userId: authenticatedUser.id,
    };

    const result = await canvasBlockMountService.updateBlockSize(enrichedDto);

    if (result.isError()) {
      console.error(
        '❌ [updateBlockSizeInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'SIZE_UPDATE_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. Aggregate → DTO 변환
    const aggregate = result.value;
    const blockMount = aggregate.getBlockMount();
    const dto: BlockSizeUpdatedDTO = {
      blockMountId: blockMount.id.value,
      newSize: {
        width: blockMount.size.width,
        height: blockMount.size.height,
      },
      updatedAt: blockMount.updatedAt.toISOString(),
    };

    return ok(dto);
  } catch (error) {
    console.error('[updateBlockSizeInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
