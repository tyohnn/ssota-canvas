'use server';

import { DrizzleBlockRepository } from '../backend/repositories/implementations/drizzle-block.repository';
import { BlockManagementService } from '../backend/services/block-management.service';
import { BlockPropertyService } from '../backend/services/block-property.service';
import { ActionResult, ok, err } from '@/lib/action-result';
import { BlockId } from '../shared/value-objects/block-id.vo';
import { UpdateBlockPropertyCommand } from '../shared/commands';
import {
  UpdateBlockPropertyRequestSchema,
  UpdateBlockTitleRequestSchema,
  type UpdateBlockPropertyRequest,
  type UpdateBlockTitleRequest,
} from '../shared/dtos/requests';
import {
  type BlockPropertyUpdatedDTO,
  type BlockTitleUpdatedDTO,
} from '../shared/dtos';
import {
  getAuthenticatedUser,
  verifyAccess,
  type AuthenticatedUser,
} from '@/domains/common/auth/helpers';
import { getAuthErrorMessage } from '@/domains/common/auth/error';

/**
 * 블록 속성 업데이트 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * Defense in Depth:
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 * 5. 블록 소유권 확인 (Service Layer에서 블록 조회 시 수행)
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns BlockPropertyUpdatedDTO (성공) | Error (실패)
 */
export async function updateBlockPropertyAction(
  request: unknown // 명시적으로 "신뢰하지 않음"
): Promise<ActionResult<BlockPropertyUpdatedDTO>> {
  // 1. Runtime Validation (필수)
  const parseResult = UpdateBlockPropertyRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to updateBlockPropertyAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      issues: parseResult.error.issues,
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: UpdateBlockPropertyRequest

  // 3. 인증 확인 (Supabase Auth)
  try {
    const user = await getAuthenticatedUser();

    // 4. 조직 & 워크스페이스 권한 확인
    const accessResult = await verifyAccess(
      validatedRequest.orgId,
      validatedRequest.workspaceId,
      user.id
    );

    if (!accessResult.success) {
      console.warn('[Security] Access denied', {
        userId: user.id,
        orgId: validatedRequest.orgId,
        workspaceId: validatedRequest.workspaceId,
        error: accessResult.error,
      });

      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    // 5. 검증 완료 - Internal 함수 호출 (소유권 체크는 Service에서 수행)
    return await updateBlockPropertyInternal(validatedRequest, user);
  } catch (error) {
    console.error('[updateBlockPropertyAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      {
        code: 'UNAUTHORIZED',
      }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 *
 * @param request - 검증된 요청
 * @param user - 인증된 사용자
 */
async function updateBlockPropertyInternal(
  request: UpdateBlockPropertyRequest, // 이미 검증됨
  user: AuthenticatedUser // 이미 인증됨
): Promise<ActionResult<BlockPropertyUpdatedDTO>> {
  try {
    // 1. Service Layer 인스턴스 생성
    const repository = new DrizzleBlockRepository();
    const blockPropertyService = new BlockPropertyService(repository);

    // 2. BlockId Value Object 생성 (타입 안전 - 이미 검증됨)
    const blockId = new BlockId(request.blockId);

    // 3. 속성 업데이트 Command 생성
    const command: UpdateBlockPropertyCommand = {
      blockId,
      propertyPath: request.propertyPath,
      value: request.value,
      workspaceId: request.workspaceId,
    };

    // 4. BlockPropertyService를 통한 속성 업데이트 (Command 패턴)
    const updateResult = await blockPropertyService.updateProperty(command);

    // 5. Response DTO 생성 (불필요한 조회 제거)
    const responseData: BlockPropertyUpdatedDTO = {
      blockId: request.blockId, // 이미 알고 있는 값 사용
      propertyPath: request.propertyPath,
      value: request.value,
      updatedAt: updateResult.updatedAt, // 서버에서 제공하는 정확한 업데이트 시간
    };

    return ok(responseData);
  } catch (error) {
    console.error('[updateBlockPropertyAction] Internal error:', error);
    return err(
      error instanceof Error ? error.message : 'Internal server error'
    );
  }
}

/**
 * 블록 제목 업데이트 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * Defense in Depth:
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 * 5. 블록 소유권 확인 (Service Layer에서 블록 조회 시 수행)
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns BlockTitleUpdatedDTO (성공) | Error (실패)
 */
export async function updateBlockTitleAction(
  request: unknown // 명시적으로 "신뢰하지 않음"
): Promise<ActionResult<BlockTitleUpdatedDTO>> {
  // 1. Runtime Validation (필수)
  const parseResult = UpdateBlockTitleRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to updateBlockTitleAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      issues: parseResult.error.issues,
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: UpdateBlockTitleRequest

  // 3. 인증 확인 (Supabase Auth)
  try {
    const user = await getAuthenticatedUser();

    // 4. 조직 & 워크스페이스 권한 확인
    const accessResult = await verifyAccess(
      validatedRequest.orgId,
      validatedRequest.workspaceId,
      user.id
    );

    if (!accessResult.success) {
      console.warn('[Security] Access denied', {
        userId: user.id,
        orgId: validatedRequest.orgId,
        workspaceId: validatedRequest.workspaceId,
        error: accessResult.error,
      });

      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    // 5. 검증 완료 - Internal 함수 호출 (소유권 체크는 Service에서 수행)
    return await updateBlockTitleInternal(validatedRequest, user);
  } catch (error) {
    console.error('[updateBlockTitleAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      {
        code: 'UNAUTHORIZED',
      }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 *
 * @param request - 검증된 요청
 * @param user - 인증된 사용자
 */
async function updateBlockTitleInternal(
  request: UpdateBlockTitleRequest, // 이미 검증됨
  user: AuthenticatedUser // 이미 인증됨
): Promise<ActionResult<BlockTitleUpdatedDTO>> {
  try {
    // 1. Service Layer 인스턴스 생성
    const repository = new DrizzleBlockRepository();
    const blockManagementService = new BlockManagementService(repository);

    // 2. BlockId Value Object 생성 (타입 안전 - 이미 검증됨)
    const blockId = new BlockId(request.blockId);

    // 3. 블록 조회 및 소유권 확인 (Low Hanging Fruit: 중복 DB 조회 제거)
    const block = await repository.findById(blockId);
    if (!block) {
      return err('Block not found');
    }

    // 4. 블록 소유권 확인: 블록이 해당 워크스페이스에 속하는지 검증
    if (block.workspaceId.value !== request.workspaceId) {
      return err('Block does not belong to this workspace', {
        code: 'WORKSPACE_MISMATCH',
      });
    }

    // 5. 제목 업데이트
    block.update({ title: request.title });
    await repository.update(block);

    // 6. 업데이트된 블록 조회 (응답용)
    const updatedBlock = await repository.findById(blockId);
    if (!updatedBlock) {
      return err('Block not found after update');
    }

    // 7. Response DTO 생성
    const responseData: BlockTitleUpdatedDTO = {
      blockId: updatedBlock.id.value,
      title: updatedBlock.title,
      updatedAt: updatedBlock.updatedAt,
    };

    return ok(responseData);
  } catch (error) {
    console.error('[updateBlockTitleAction] Internal error:', error);
    return err(
      error instanceof Error ? error.message : 'Internal server error'
    );
  }
}
