'use server';

import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { updateBlockProperty } from '../../backend/services/block/property/update-block-property.service';
import {
  UpdateBlockPropertyRequest,
  UpdateBlockPropertyRequestSchema,
} from '../../shared/dtos/requests/block.requests';
import { BlockPropertyUpdatedDTO } from '../../shared/dtos/responses/block.responses';
import { withBlockSecureAction } from './secure-action';

/**
 * 블록 속성 업데이트 Server Action
 *
 * ⚠️ Security: withBlockSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 * 5. 블록 소유권 확인 (Block이 Workspace에 속하는지)
 *
 * Block은 Workspace에 속하며, Page와 직접적인 의존성이 없습니다.
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns BlockPropertyUpdatedDTO (성공) | Error (실패)
 */
export const updateBlockPropertyAction = withBlockSecureAction(
  UpdateBlockPropertyRequestSchema,
  'updateBlockPropertyAction',
  updateBlockPropertyInternal,
  {
    getLogMetadata: req => ({
      blockId: req.blockId,
      propertyPath: req.propertyPath,
    }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ✅ Event Storming + DDD 패턴:
 * - Service에 SafeDTO 전달 (Command 변환은 Service 내부에서 수행)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스 정보
 */
async function updateBlockPropertyInternal(
  safeDto: UpdateBlockPropertyRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: WorkspaceActionContext // ✅ 검증된 context
): Promise<ActionResult<BlockPropertyUpdatedDTO>> {
  try {
    const userId: UserId = new UserId(context.authenticatedUser.id);

    // 1. Repository 생성
    const blockRepository = new DrizzleBlockRepository();

    const updateResult = await updateBlockProperty({
      safeWorkspaceId: context.workspace.workspaceId,
      safeBlockSlug: safeDto.blockId,
      propertyPath: safeDto.propertyPath,
      value: safeDto.value,
      safeUserId: userId,
      blockRepository,
    });

    // 3. Result 처리
    if (updateResult.isError()) {
      return err(String(updateResult.error), {
        code: 'BLOCK_UPDATE_FAILED',
        meta: { originalError: updateResult.error },
      });
    }

    // 4. Response DTO 생성
    const responseData: BlockPropertyUpdatedDTO = {
      blockId: safeDto.blockId,
      propertyPath: safeDto.propertyPath,
      value: safeDto.value,
      updatedAt: updateResult.value.updatedAt,
    };

    return ok(responseData);
  } catch (error) {
    console.error('[updateBlockPropertyInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
