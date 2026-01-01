'use server';

import { ActionResult, err, ok } from '@/lib';
import { type ActionContext, withSecureAction } from '@/lib/server-actions';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { BlockPropertyService } from '../../backend/services/block-property.service';
import { UpdateBlockPropertyCommand } from '../../shared/commands';
import {
  UpdateBlockPropertiesRequest,
  UpdateBlockPropertiesRequestSchema,
} from '../../shared/dtos/requests/block.requests';
import { BlockPropertiesUpdatedDTO } from '../../shared/dtos/responses/block.responses';
import { BlockId } from '../../shared/value-objects/block-id.vo';

/**
 * 블록 속성 일괄 업데이트 Server Action (Bulk Update)
 *
 * ⚠️ Security: withSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns BlockPropertiesUpdatedDTO (성공) | Error (실패)
 */
export const updateBlockPropertiesAction = withSecureAction(
  UpdateBlockPropertiesRequestSchema,
  {
    getPageId: req => req.pageId, // ✅ Direct access
    actionName: 'updateBlockPropertiesAction',
    getLogMetadata: req => ({
      blockId: req.blockId,
      propertiesCount: Object.keys(req.properties).length,
    }),
  },
  updateBlockPropertiesInternal
);

/**
 * 내부 구현 (검증된 데이터만 처리) - Bulk Update
 *
 * ✅ Event Storming + DDD 패턴:
 * - Service에 Command 전달 (Value Objects 생성은 Action에서)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스, 페이지 정보
 */
async function updateBlockPropertiesInternal(
  safeDto: UpdateBlockPropertiesRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: ActionContext // ✅ 검증된 context
): Promise<ActionResult<BlockPropertiesUpdatedDTO>> {
  try {
    // 1. Service 의존성 생성
    const repository = new DrizzleBlockRepository();
    const blockPropertyService = new BlockPropertyService(repository);

    // 2. BlockId Value Object 생성
    const blockId = new BlockId(safeDto.blockId);

    // 3. 각 속성을 순차적으로 업데이트
    let updatedAt: Date = new Date();

    for (const [key, value] of Object.entries(safeDto.properties)) {
      const command: UpdateBlockPropertyCommand = {
        blockId,
        propertyPath: `properties.${key}`,
        value,
        workspaceId: context.workspace.workspaceId.value, // ✅ Context에서 workspaceId 사용
      };

      const updateResult = await blockPropertyService.updateProperty(command);
      updatedAt = updateResult.updatedAt;
    }

    // 4. Response DTO 생성
    const responseData: BlockPropertiesUpdatedDTO = {
      blockId: safeDto.blockId,
      properties: safeDto.properties,
      updatedAt,
    };

    return ok(responseData);
  } catch (error) {
    console.error('[updateBlockPropertiesInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
