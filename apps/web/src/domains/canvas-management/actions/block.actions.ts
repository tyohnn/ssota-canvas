'use server';

import {
  BlockCreatedAndMountedDTO,
  BlockPositionUpdatedDTO,
  BlockSizeUpdatedDTO,
  BlockMountSoftDeletedDTO,
  BlockDuplicatedAndMountedDTO,
} from '../shared/dtos/responses';
import {
  CreateAndMountBlockRequestSchema,
  CreateAndMountBlockRequest,
  UpdateBlockPositionRequestSchema,
  UpdateBlockPositionRequest,
  UpdateBlockSizeRequestSchema,
  UpdateBlockSizeRequest,
  SoftDeleteBlockMountRequestSchema,
  SoftDeleteBlockMountRequest,
  DuplicateBlockAndMountRequestSchema,
  DuplicateBlockAndMountRequest,
} from '../shared/dtos/requests';
import { ActionResult, ok, err } from '@/lib/action-result';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import {
  getAuthenticatedUser,
  verifyAccess,
  type AuthenticatedUser,
} from '@/domains/common/auth/helpers';
import { getAuthErrorMessage } from '@/domains/common/auth/error';
import type { Workspace } from '@/domains/workspace-management/shared/entities/workspace.entity';
import { Position } from '../shared/value-objects/position.vo';
import { Size } from '../shared/value-objects/size.vo';
import { BlockMountId } from '../shared/value-objects/block-mount-id.vo';
import { BlockType } from '@/domains/block-management/shared/value-objects/block-type.vo';
import { BlockManagementService } from '@/domains/block-management/backend/services/block-management.service';
import { CanvasBlockMountService } from '../backend/services/canvas-block-mount.service';
import { DrizzleBlockMountRepository } from '../backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '../backend/repositories/implementations/drizzle-edge.repository';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';

/**
 * Block 생성 및 마운팅 통합 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * Defense in Depth:
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns BlockMountedDTO (성공) | Error (실패)
 */
export async function createAndMountBlockAction(
  request: unknown // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<BlockCreatedAndMountedDTO>> {
  // 1. Runtime Validation (필수)
  const parseResult = CreateAndMountBlockRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to createBlockAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: CreateAndMountBlockRequest

  // 3. 인증 확인 (Supabase Auth)
  try {
    const authenticatedUser = await getAuthenticatedUser();

    // 4. orgId 필수 확인
    if (!validatedRequest.orgId) {
      console.warn('[Security] Missing orgId in request', {
        userId: authenticatedUser.id,
        workspaceId: validatedRequest.workspaceId,
      });

      return err('Organization ID is required', {
        code: 'MISSING_ORG_ID',
      });
    }

    // 5. 조직 & 워크스페이스 권한 확인
    const accessResult = await verifyAccess(
      validatedRequest.orgId,
      validatedRequest.workspaceId,
      authenticatedUser.id
    );

    if (!accessResult.success) {
      console.warn('[Security] Access denied', {
        userId: authenticatedUser.id,
        orgId: validatedRequest.orgId,
        workspaceId: validatedRequest.workspaceId,
        error: accessResult.error,
      });

      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    // 6. 검증 완료 - Internal 함수 호출 (검증된 workspace 전달)
    return await createAndMountBlockInternal(
      validatedRequest,
      authenticatedUser,
      accessResult.workspace! // ✅ 검증된 workspace entity
    );
  } catch (error) {
    console.error('[createAndMountBlockAction] Authentication error:', error);

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
 * @param workspace - 검증된 워크스페이스 entity
 */
async function createAndMountBlockInternal(
  request: CreateAndMountBlockRequest, // ✅ 이미 검증됨
  authenticatedUser: AuthenticatedUser, // ✅ 이미 인증됨
  workspace: Workspace // ✅ 이미 검증된 workspace entity
): Promise<ActionResult<BlockCreatedAndMountedDTO>> {
  try {
    // 1. Value Objects 생성 (타입 안전 - 이미 검증됨)
    const userIdVO = new UserId(authenticatedUser.id);
    const pageIdVO = new PageId(request.pageId);
    const sizeVO = new Size(request.size.width, request.size.height);
    const positionVO = new Position(request.position.x, request.position.y);
    const blockTypeVO = new BlockType(request.blockType);

    // 2. Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const blockRepository = new DrizzleBlockRepository();

    // 3. Service 인스턴스 생성
    const blockManagementService = new BlockManagementService(blockRepository);
    const blockMountService = new CanvasBlockMountService(
      blockManagementService,
      blockMountRepository,
      edgeRepository
    );

    // 4. Block 생성 및 마운팅 Command 생성 (검증된 workspace의 VO 사용)
    const params = {
      userId: userIdVO,
      workspaceId: workspace.workspaceId, // ✅ 검증된 workspace entity의 VO 사용
      pageId: pageIdVO,
      blockType: blockTypeVO,
      position: positionVO,
      size: sizeVO,
      initialProperties: request.initialProperties, // 초기 properties 전달 (optional)
      initialContent: request.initialContent, // ✨ 초기 content 전달 (optional)
    };

    // 5. CanvasBlockMountService.createAndMountBlock 호출
    const result = await blockMountService.createAndMountBlock(params);

    if (result.isError()) {
      console.error(
        '❌ [createBlockInternal] BlockMountService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'BLOCK_CREATION_FAILED',
        meta: {
          originalError: result.error,
          request,
        },
      });
    }

    // 7. 명시적 변수명으로 Aggregate와 Entity 분리
    const { blockMountAggregate, blockAggregate } = result.value;
    const blockMount = blockMountAggregate.getBlockMount();
    const block = blockAggregate.getBlock();

    // 8. BlockView (= BlockCreatedAndMountedDTO) 형식으로 변환
    const blockView: BlockCreatedAndMountedDTO = {
      // Mount 정보 (mountAggregate에서 추출)
      blockMountId: blockMount.id.value,
      position: {
        x: blockMount.position.x,
        y: blockMount.position.y,
      },
      size: {
        width: blockMount.size.width,
        height: blockMount.size.height,
      },
      zOrder: blockMount.zOrder.value,

      // Block 정보 (blockEntity에서 추출)
      blockId: block.id.value,
      blockType: block.blockType.value,
      properties: block.properties.toJSON(), // Value Object를 JSON으로 변환
      customProperties: block.customProperties.map(cp => cp.toJSON()) || [],
      content: block.content, // JSONB content

      // 메타데이터 (blockEntity에서 추출)
      createdAt: block.createdAt.toISOString(),
      updatedAt: block.updatedAt.toISOString(),
      createdByProfile: block.createdByProfile,
    };

    return ok(blockView);
  } catch (error) {
    console.error('[createBlockInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request,
      },
    });
  }
}

/**
 * 블럭 위치 업데이트 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * Defense in Depth:
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns BlockPositionUpdatedDTO[] (성공) | Error (실패)
 */
export async function updateBlockPositionAction(
  request: unknown // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<BlockPositionUpdatedDTO[]>> {
  // 1. Runtime Validation (필수)
  const parseResult = UpdateBlockPositionRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to updateBlockPositionAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data;

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. 조직 및 워크스페이스 접근 권한 확인
    const accessResult = await verifyAccess(
      validatedRequest.orgId,
      validatedRequest.workspaceId,
      user.id
    );

    if (!accessResult.success) {
      console.warn('[Security] Access verification failed', {
        userId: user.id,
        orgId: validatedRequest.orgId,
        workspaceId: validatedRequest.workspaceId,
        error: accessResult.error,
      });

      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    // 5. 검증 완료 - Internal 함수 호출
    return await updateBlockPositionInternal(validatedRequest, user);
  } catch (error) {
    console.error('[updateBlockPositionAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function updateBlockPositionInternal(
  request: UpdateBlockPositionRequest,
  user: AuthenticatedUser
): Promise<ActionResult<BlockPositionUpdatedDTO[]>> {
  try {
    const userIdVO = new UserId(user.id);

    // 2. Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const blockRepository = new DrizzleBlockRepository();

    // 3. Service 인스턴스 생성
    const blockManagementService = new BlockManagementService(blockRepository);
    const canvasBlockMountService = new CanvasBlockMountService(
      blockManagementService,
      blockMountRepository,
      edgeRepository
    );

    // 4. Command 생성 (배열 형태)

    // 5. Service 메서드 호출
    const result = await canvasBlockMountService.updateBlockPosition({
      blockPositions: request.blockPositions.map(bp => ({
        blockMountId: new BlockMountId(bp.blockMountId),
        position: new Position(bp.position.x, bp.position.y),
      })),
      userId: userIdVO,
    });

    if (result.isError()) {
      console.error(
        '❌ [updateBlockPositionInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'POSITION_UPDATE_FAILED',
        meta: { originalError: result.error },
      });
    }

    const aggregates = result.value;

    // 6. DTO 직렬화 (다중 결과 처리)
    const dtos: BlockPositionUpdatedDTO[] = aggregates.map(aggregate => ({
      blockMountId: aggregate.getBlockMount().id.value,
      newPosition: {
        x: aggregate.getBlockMount().position.x,
        y: aggregate.getBlockMount().position.y,
      },
      updatedAt: aggregate.getBlockMount().updatedAt.toISOString(),
    }));

    if (dtos.length === 0) {
      return err('No aggregate returned from service', {
        code: 'POSITION_UPDATE_FAILED',
      });
    }

    return ok(dtos);
  } catch (error) {
    console.error('[updateBlockPositionInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request,
      },
    });
  }
}

/**
 * 블럭 크기 업데이트 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * Defense in Depth:
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns BlockSizeUpdatedDTO (성공) | Error (실패)
 */
export async function updateBlockSizeAction(
  request: unknown // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<BlockSizeUpdatedDTO>> {
  // 1. Runtime Validation (필수)
  const parseResult = UpdateBlockSizeRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to updateBlockSizeAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data;

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. 조직 및 워크스페이스 접근 권한 확인
    const accessResult = await verifyAccess(
      validatedRequest.orgId,
      validatedRequest.workspaceId,
      user.id
    );

    if (!accessResult.success) {
      console.warn('[Security] Access verification failed', {
        userId: user.id,
        orgId: validatedRequest.orgId,
        workspaceId: validatedRequest.workspaceId,
        error: accessResult.error,
      });

      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    // 5. 검증 완료 - Internal 함수 호출
    return await updateBlockSizeInternal(validatedRequest, user);
  } catch (error) {
    console.error('[updateBlockSizeAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function updateBlockSizeInternal(
  request: UpdateBlockSizeRequest,
  user: AuthenticatedUser
): Promise<ActionResult<BlockSizeUpdatedDTO>> {
  try {
    const userIdVO = new UserId(user.id);
    const blockMountIdVO = new BlockMountId(request.blockMountId);
    const sizeVO = new Size(request.newSize.width, request.newSize.height);

    // 2. Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const blockRepository = new DrizzleBlockRepository();

    // 3. Service 인스턴스 생성
    const blockManagementService = new BlockManagementService(blockRepository);
    const canvasBlockMountService = new CanvasBlockMountService(
      blockManagementService,
      blockMountRepository,
      edgeRepository
    );

    // 4. Command 생성
    const result = await canvasBlockMountService.updateBlockSize({
      blockMountId: blockMountIdVO,
      size: sizeVO,
      userId: userIdVO,
    });

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

    const aggregate = result.value;

    // 6. DTO 직렬화
    const dto: BlockSizeUpdatedDTO = {
      blockMountId: aggregate.getBlockMount().id.value,
      newSize: {
        width: aggregate.getBlockMount().size.width,
        height: aggregate.getBlockMount().size.height,
      },
      updatedAt: aggregate.getBlockMount().updatedAt.toISOString(),
    };

    return ok(dto);
  } catch (error) {
    console.error('[updateBlockSizeInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request,
      },
    });
  }
}

/**
 * Soft Delete Block Mount Server Action (연결된 엣지 자동 정리)
 * Story CM-008 구현
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * Defense in Depth:
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns SoftDeletedBlockMountsDTO (성공) | Error (실패)
 */
export async function softDeleteBlockMountAction(
  request: unknown // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<BlockMountSoftDeletedDTO>> {
  // 1. Runtime Validation (필수)
  const parseResult = SoftDeleteBlockMountRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to softDeleteBlockMountAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data;

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. 조직 및 워크스페이스 접근 권한 확인
    const accessResult = await verifyAccess(
      validatedRequest.orgId,
      validatedRequest.workspaceId,
      user.id
    );

    if (!accessResult.success) {
      console.warn('[Security] Access verification failed', {
        userId: user.id,
        orgId: validatedRequest.orgId,
        workspaceId: validatedRequest.workspaceId,
        error: accessResult.error,
      });

      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    // 5. 검증 완료 - Internal 함수 호출
    return await softDeleteBlockMountInternal(validatedRequest, user);
  } catch (error) {
    console.error('[softDeleteBlockMountAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * Soft Delete Block Mount 내부 구현 (검증된 데이터만 처리)
 */
async function softDeleteBlockMountInternal(
  request: SoftDeleteBlockMountRequest,
  user: AuthenticatedUser
): Promise<ActionResult<BlockMountSoftDeletedDTO>> {
  try {
    const userIdVO = new UserId(user.id);

    // 2. Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const blockRepository = new DrizzleBlockRepository();

    // 3. Service 인스턴스 생성
    const blockManagementService = new BlockManagementService(blockRepository);
    const canvasBlockMountService = new CanvasBlockMountService(
      blockManagementService,
      blockMountRepository,
      edgeRepository
    );

    // 4. Command 생성 (배열 형태)
    const params = {
      blockMountIds: request.blockMountIds.map(id => new BlockMountId(id)),
      userId: userIdVO,
    };

    // 5. Service 메서드 호출
    const result = await canvasBlockMountService.softDeleteBlockMount(params);

    if (result.isError()) {
      console.error(
        '❌ [softDeleteBlockMountInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'BLOCK_MOUNT_DELETION_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. DTO 직렬화 (다중 결과 처리)
    const dto: BlockMountSoftDeletedDTO = {
      deletedCount: result.value.deletedCount,
      deletedEdgesCount: result.value.deletedEdgesCount,
      deletedAt: new Date().toISOString(),
      deletedBlockMountIds: result.value.deletedBlockMountIds.map(
        id => id.value
      ),
    };

    return ok(dto);
  } catch (error) {
    console.error('[softDeleteBlockMountInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request,
      },
    });
  }
}

/**
 * 블럭 복제 Server Action
 * Story CM-010 구현
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * Defense in Depth:
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns BlockDuplicatedDTO (성공) | Error (실패)
 */
export async function duplicateBlockAndMountAction(
  request: unknown // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<BlockDuplicatedAndMountedDTO>> {
  // 1. Runtime Validation (필수)
  const parseResult = DuplicateBlockAndMountRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to duplicateBlockAndMountAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data;

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. 조직 및 워크스페이스 접근 권한 확인
    const accessResult = await verifyAccess(
      validatedRequest.orgId,
      validatedRequest.workspaceId,
      user.id
    );

    if (!accessResult.success) {
      console.warn('[Security] Access verification failed', {
        userId: user.id,
        orgId: validatedRequest.orgId,
        workspaceId: validatedRequest.workspaceId,
        error: accessResult.error,
      });

      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    // 5. 검증 완료 - Internal 함수 호출
    return await duplicateBlockAndMountInternal(
      validatedRequest,
      user,
      accessResult.workspace!
    );
  } catch (error) {
    console.error(
      '[duplicateBlockAndMountAction] Authentication error:',
      error
    );

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function duplicateBlockAndMountInternal(
  request: DuplicateBlockAndMountRequest,
  user: AuthenticatedUser,
  workspace: Workspace
): Promise<ActionResult<BlockDuplicatedAndMountedDTO>> {
  try {
    const userIdVO = new UserId(user.id);

    // 2. Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const blockRepository = new DrizzleBlockRepository();

    // 3. Service 인스턴스 생성
    const blockManagementService = new BlockManagementService(blockRepository);
    const canvasBlockMountService = new CanvasBlockMountService(
      blockManagementService,
      blockMountRepository,
      edgeRepository
    );

    // 4. Command 생성
    const params = {
      blockMountId: new BlockMountId(request.blockMountId),
      workspaceId: workspace.workspaceId!,
      userId: userIdVO,
      offsetX: request.offsetX || 20,
      offsetY: request.offsetY || 20,
    };

    // 5. Service 메서드 호출
    const result = await canvasBlockMountService.duplicateBlockAndMount(params);

    if (result.isError()) {
      console.error(
        '❌ [duplicateBlockInternal] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'BLOCK_DUPLICATION_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. DTO 직렬화
    const blockMountAggregate = result.value;
    const blockMount = blockMountAggregate.getBlockMount();
    const dto = {
      duplicatedBlockMountId: blockMount.id.value,
      duplicatedBlockId: blockMount.blockId.value,
      position: {
        x: blockMount.position.x,
        y: blockMount.position.y,
      },
      size: {
        width: blockMount.size.width,
        height: blockMount.size.height,
      },
      zOrder: blockMount.zOrder.value,
    };

    return ok(dto);
  } catch (error) {
    console.error('[duplicateBlockInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request,
      },
    });
  }
}
