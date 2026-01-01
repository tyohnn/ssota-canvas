'use server';

import { ActionResult, err, ok } from '@/lib';
import { type ActionContext, withSecureAction } from '@/lib/server-actions';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { BlockManagementService } from '../../backend/services/block-management.service';
import {
  UpdateBlockTitleRequest,
  UpdateBlockTitleRequestSchema,
} from '../../shared/dtos/requests/block.requests';
import { BlockTitleUpdatedDTO } from '../../shared/dtos/responses/block.responses';
import { BlockId } from '../../shared/value-objects/block-id.vo';

/**
 * 블록 제목 업데이트 Server Action
 *
 * ⚠️ Security: withSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns BlockTitleUpdatedDTO (성공) | Error (실패)
 */
export const updateBlockTitleAction = withSecureAction(
  UpdateBlockTitleRequestSchema,
  {
    getPageId: req => req.pageId, // ✅ Direct access
    actionName: 'updateBlockTitleAction',
    getLogMetadata: req => ({
      blockId: req.blockId,
    }),
  },
  updateBlockTitleInternal
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스, 페이지 정보
 */
async function updateBlockTitleInternal(
  safeDto: UpdateBlockTitleRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: ActionContext // ✅ 검증된 context
): Promise<ActionResult<BlockTitleUpdatedDTO>> {
  try {
    // 1. Service 의존성 생성
    const repository = new DrizzleBlockRepository();
    const blockManagementService = new BlockManagementService(repository);

    // 2. BlockId Value Object 생성
    const blockId = new BlockId(safeDto.blockId);

    // 3. ✅ Service에 위임 (소유권 검증 및 업데이트)
    const aggregate = await blockManagementService.updateBlockTitle(
      blockId,
      safeDto.title,
      context.workspace.workspaceId.value // ✅ Context에서 workspaceId 사용
    );

    // 4. Response DTO 생성
    const block = aggregate.getBlock();
    const responseData: BlockTitleUpdatedDTO = {
      blockId: block.id.value,
      title: block.title,
      updatedAt: block.updatedAt,
    };

    return ok(responseData);
  } catch (error) {
    console.error('[updateBlockTitleInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
