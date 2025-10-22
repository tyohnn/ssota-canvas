'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  CreateBlockRequest,
  BlockMountedDTO,
  UpdateBlockPositionRequest,
  UpdateBlockSizeRequest,
  UpdateMultipleBlockPositionsRequest,
  BlockPositionUpdatedDTO,
  BlockSizeUpdatedDTO,
  MultipleBlockPositionsUpdatedDTO,
  DeleteBlockMountRequest,
  DeleteMultipleBlockMountsRequest,
  BlockMountDeletedDTO,
  MultipleBlockMountsDeletedDTO,
} from '../shared/dtos/index';
import { ActionResult, ok, err } from '@/lib/action-result';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Position } from '../shared/value-objects/position.vo';
import { Size } from '../shared/value-objects/size.vo';
import { BlockMountId } from '../shared/value-objects/block-mount-id.vo';
import { CanvasManagementService } from '../backend/services/canvas-management.service';
import { BlockManagementService } from '@/domains/block-management/backend/services/block-management.service';
import { DrizzleBlockMountRepository } from '../backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '../backend/repositories/implementations/drizzle-edge.repository';
import { DrizzleViewportRepository } from '../backend/repositories/implementations/drizzle-viewport.repository';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import {
  CreateAndMountBlockCommand,
  UpdateBlockPositionCommand,
  UpdateBlockSizeCommand,
  UpdateMultipleBlockPositionsCommand,
  DeleteBlockMountCommand,
  DeleteMultipleBlockMountsCommand,
  DuplicateBlockCommand,
} from '../shared/commands/index';

/**
 * Block 생성 및 마운팅 통합 Server Action
 *
 * @param request - CreateBlockRequest
 * @returns BlockMountedDTO (성공) | Error (실패)
 */
export async function createBlockAction(
  request: CreateBlockRequest
): Promise<ActionResult<BlockMountedDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [createBlockAction] Authentication failed:', authError);
      return err('Unauthorized: User not authenticated', {
        code: 'UNAUTHORIZED',
        meta: { authError: authError?.message },
      });
    }

    const userIdVO = new UserId(user.id);
    const pageIdVO = new PageId(request.pageId);

    // 2. 기본 크기 설정 (size가 제공되지 않은 경우)
    const defaultSize = { width: 200, height: 150 };
    const sizeVO = new Size(
      request.size?.width ?? defaultSize.width,
      request.size?.height ?? defaultSize.height
    );
    const positionVO = new Position(request.position.x, request.position.y);

    // 3. Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const viewportRepository = new DrizzleViewportRepository();
    const blockRepository = new DrizzleBlockRepository();
    const workspaceRepository = new DrizzleWorkspaceRepository();

    // 4. Service 인스턴스 생성
    const blockManagementService = new BlockManagementService(blockRepository);
    const canvasManagementService = new CanvasManagementService(
      blockManagementService,
      blockMountRepository,
      edgeRepository,
      viewportRepository,
      workspaceRepository
    );

    // 5. Block 생성 및 마운팅 Command 생성
    const command: CreateAndMountBlockCommand = {
      blockType: request.blockType,
      workspaceId: request.workspaceId,
      pageId: pageIdVO,
      position: positionVO,
      size: sizeVO,
      userId: userIdVO.value,
      metadata: {}, // 기본 메타데이터
    };

    // 6. CanvasManagementService.createAndMountBlock 호출
    const result = await canvasManagementService.createAndMountBlock(command);

    if (result.isError()) {
      console.error(
        '❌ [createBlockAction] CanvasManagementService failed:',
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

    const aggregate = result.value;

    // 7. BlockMountedDTO로 변환
    const blockMountedDTO: BlockMountedDTO = {
      blockMountId: aggregate.blockMount.id.value,
      blockId: aggregate.blockMount.blockId.value,
      position: {
        x: aggregate.blockMount.position.x,
        y: aggregate.blockMount.position.y,
      },
      size: {
        width: aggregate.blockMount.size.width,
        height: aggregate.blockMount.size.height,
      },
      zOrder: aggregate.blockMount.zOrder.value,
      createdAt: new Date().toISOString(),
    };

    // 8. 페이지 재검증 및 성공적으로 BlockMountedDTO 반환
    if (request.orgId) {
      revalidatePath(
        `/r/${request.orgId}/workspace/${request.workspaceId}/page/${request.pageId}`
      );
    } else {
      // orgId가 없는 경우 기존 경로 사용 (호환성)
      revalidatePath(`/r/${request.workspaceId}/page/${request.pageId}`);
    }

    return ok(blockMountedDTO);
  } catch (error) {
    console.error('[createBlockAction] Error:', error);
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
 * @param request - UpdateBlockPositionRequest
 * @returns BlockPositionUpdatedDTO (성공) | Error (실패)
 */
export async function updateBlockPositionAction(
  request: UpdateBlockPositionRequest
): Promise<ActionResult<BlockPositionUpdatedDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        '❌ [updateBlockPositionAction] Authentication failed:',
        authError
      );
      return err('Unauthorized: User not authenticated', {
        code: 'UNAUTHORIZED',
        meta: { authError: authError?.message },
      });
    }

    const userIdVO = new UserId(user.id);
    const blockMountIdVO = new BlockMountId(request.blockMountId);
    const positionVO = new Position(
      request.newPosition.x,
      request.newPosition.y
    );

    // 2. Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const viewportRepository = new DrizzleViewportRepository();
    const blockRepository = new DrizzleBlockRepository();
    const workspaceRepository = new DrizzleWorkspaceRepository();

    // 3. Service 인스턴스 생성
    const blockManagementService = new BlockManagementService(blockRepository);
    const canvasManagementService = new CanvasManagementService(
      blockManagementService,
      blockMountRepository,
      edgeRepository,
      viewportRepository,
      workspaceRepository
    );

    // 4. Command 생성
    const command: UpdateBlockPositionCommand = {
      blockMountId: blockMountIdVO,
      newPosition: positionVO,
      userId: userIdVO.value,
    };

    // 5. Service 메서드 호출
    const result = await canvasManagementService.updateBlockPosition(command);

    if (result.isError()) {
      console.error(
        '❌ [updateBlockPositionAction] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'POSITION_UPDATE_FAILED',
        meta: { originalError: result.error },
      });
    }

    const aggregate = result.value;

    // 6. DTO 직렬화
    const dto: BlockPositionUpdatedDTO = {
      blockMountId: aggregate.blockMount.id.value,
      newPosition: {
        x: aggregate.blockMount.position.x,
        y: aggregate.blockMount.position.y,
      },
      updatedAt: aggregate.blockMount.updatedAt.toISOString(),
    };

    // 7. 페이지 재검증
    if (request.orgId && request.workspaceId && request.pageId) {
      revalidatePath(
        `/r/${request.orgId}/workspace/${request.workspaceId}/page/${request.pageId}`
      );
    }

    return ok(dto);
  } catch (error) {
    console.error('[updateBlockPositionAction] Error:', error);
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
 * @param request - UpdateBlockSizeRequest
 * @returns BlockSizeUpdatedDTO (성공) | Error (실패)
 */
export async function updateBlockSizeAction(
  request: UpdateBlockSizeRequest
): Promise<ActionResult<BlockSizeUpdatedDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        '❌ [updateBlockSizeAction] Authentication failed:',
        authError
      );
      return err('Unauthorized: User not authenticated', {
        code: 'UNAUTHORIZED',
        meta: { authError: authError?.message },
      });
    }

    const userIdVO = new UserId(user.id);
    const blockMountIdVO = new BlockMountId(request.blockMountId);
    const sizeVO = new Size(request.newSize.width, request.newSize.height);

    // 2. Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const viewportRepository = new DrizzleViewportRepository();
    const blockRepository = new DrizzleBlockRepository();
    const workspaceRepository = new DrizzleWorkspaceRepository();

    // 3. Service 인스턴스 생성
    const blockManagementService = new BlockManagementService(blockRepository);
    const canvasManagementService = new CanvasManagementService(
      blockManagementService,
      blockMountRepository,
      edgeRepository,
      viewportRepository,
      workspaceRepository
    );

    // 4. Command 생성
    const command: UpdateBlockSizeCommand = {
      blockMountId: blockMountIdVO,
      newSize: sizeVO,
      userId: userIdVO.value,
    };

    // 5. Service 메서드 호출
    const result = await canvasManagementService.updateBlockSize(command);

    if (result.isError()) {
      console.error('❌ [updateBlockSizeAction] Service failed:', result.error);
      return err(String(result.error), {
        code: 'SIZE_UPDATE_FAILED',
        meta: { originalError: result.error },
      });
    }

    const aggregate = result.value;

    // 6. DTO 직렬화
    const dto: BlockSizeUpdatedDTO = {
      blockMountId: aggregate.blockMount.id.value,
      newSize: {
        width: aggregate.blockMount.size.width,
        height: aggregate.blockMount.size.height,
      },
      updatedAt: aggregate.blockMount.updatedAt.toISOString(),
    };

    // 7. 페이지 재검증
    if (request.orgId && request.workspaceId && request.pageId) {
      revalidatePath(
        `/r/${request.orgId}/workspace/${request.workspaceId}/page/${request.pageId}`
      );
    }

    return ok(dto);
  } catch (error) {
    console.error('[updateBlockSizeAction] Error:', error);
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
 * 다중 블럭 위치 일괄 업데이트 Server Action (정렬/분포용)
 *
 * @param request - UpdateMultipleBlockPositionsRequest
 * @returns MultipleBlockPositionsUpdatedDTO (성공) | Error (실패)
 */
export async function updateMultipleBlockPositionsAction(
  request: UpdateMultipleBlockPositionsRequest
): Promise<ActionResult<MultipleBlockPositionsUpdatedDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        '❌ [updateMultipleBlockPositionsAction] Authentication failed:',
        authError
      );
      return err('Unauthorized: User not authenticated', {
        code: 'UNAUTHORIZED',
        meta: { authError: authError?.message },
      });
    }

    const userIdVO = new UserId(user.id);

    // 2. Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const viewportRepository = new DrizzleViewportRepository();
    const blockRepository = new DrizzleBlockRepository();
    const workspaceRepository = new DrizzleWorkspaceRepository();

    // 3. Service 인스턴스 생성
    const blockManagementService = new BlockManagementService(blockRepository);
    const canvasManagementService = new CanvasManagementService(
      blockManagementService,
      blockMountRepository,
      edgeRepository,
      viewportRepository,
      workspaceRepository
    );

    // 4. Command 생성
    const command: UpdateMultipleBlockPositionsCommand = {
      blockPositions: request.blockPositions.map(bp => ({
        blockMountId: new BlockMountId(bp.blockMountId),
        position: new Position(bp.position.x, bp.position.y),
      })),
      userId: userIdVO.value,
    };

    // 5. Service 메서드 호출
    const result =
      await canvasManagementService.updateMultipleBlockPositions(command);

    if (result.isError()) {
      console.error(
        '❌ [updateMultipleBlockPositionsAction] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'MULTIPLE_POSITIONS_UPDATE_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. DTO 직렬화
    const dto: MultipleBlockPositionsUpdatedDTO = {
      updatedCount: request.blockPositions.length,
      updatedAt: new Date().toISOString(),
    };

    // 7. 페이지 재검증
    if (request.orgId && request.workspaceId && request.pageId) {
      revalidatePath(
        `/r/${request.orgId}/workspace/${request.workspaceId}/page/${request.pageId}`
      );
    }

    return ok(dto);
  } catch (error) {
    console.error('[updateMultipleBlockPositionsAction] Error:', error);
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
 * 블럭 마운트 삭제 Server Action (연결된 엣지 자동 정리)
 * Story CM-008 구현
 *
 * @param request - DeleteBlockMountRequest
 * @returns BlockMountDeletedDTO (성공) | Error (실패)
 */
export async function deleteBlockMountAction(
  request: DeleteBlockMountRequest
): Promise<ActionResult<BlockMountDeletedDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        '❌ [deleteBlockMountAction] Authentication failed:',
        authError
      );
      return err('Unauthorized: User not authenticated', {
        code: 'UNAUTHORIZED',
        meta: { authError: authError?.message },
      });
    }

    const userIdVO = new UserId(user.id);
    const blockMountIdVO = new BlockMountId(request.blockMountId);

    // 2. Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const viewportRepository = new DrizzleViewportRepository();
    const blockRepository = new DrizzleBlockRepository();
    const workspaceRepository = new DrizzleWorkspaceRepository();

    // 3. Service 인스턴스 생성
    const blockManagementService = new BlockManagementService(blockRepository);
    const canvasManagementService = new CanvasManagementService(
      blockManagementService,
      blockMountRepository,
      edgeRepository,
      viewportRepository,
      workspaceRepository
    );

    // 4. Command 생성
    const command: DeleteBlockMountCommand = {
      blockMountId: blockMountIdVO,
      userId: userIdVO.value,
    };

    // 5. Service 메서드 호출
    const result = await canvasManagementService.deleteBlockMount(command);

    if (result.isError()) {
      console.error(
        '❌ [deleteBlockMountAction] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'BLOCK_MOUNT_DELETION_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. DTO 직렬화
    const dto: BlockMountDeletedDTO = {
      blockMountId: blockMountIdVO.value,
      deletedEdgesCount: result.value.deletedEdgesCount,
      deletedAt: new Date().toISOString(),
    };

    // 7. 페이지 재검증
    if (request.orgId && request.workspaceId && request.pageId) {
      revalidatePath(
        `/r/${request.orgId}/workspace/${request.workspaceId}/page/${request.pageId}`
      );
    }

    return ok(dto);
  } catch (error) {
    console.error('[deleteBlockMountAction] Error:', error);
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
 * 다중 블럭 마운트 삭제 Server Action (연결된 엣지 자동 정리)
 * Story CM-008 구현 - 다중 블럭 삭제
 *
 * @param request - DeleteMultipleBlockMountsRequest
 * @returns MultipleBlockMountsDeletedDTO (성공) | Error (실패)
 */
export async function deleteMultipleBlockMountsAction(
  request: DeleteMultipleBlockMountsRequest
): Promise<ActionResult<MultipleBlockMountsDeletedDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        '❌ [deleteMultipleBlockMountsAction] Authentication failed:',
        authError
      );
      return err('Unauthorized: User not authenticated', {
        code: 'UNAUTHORIZED',
        meta: { authError: authError?.message },
      });
    }

    const userIdVO = new UserId(user.id);

    // 2. Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const viewportRepository = new DrizzleViewportRepository();
    const blockRepository = new DrizzleBlockRepository();
    const workspaceRepository = new DrizzleWorkspaceRepository();

    // 3. Service 인스턴스 생성
    const blockManagementService = new BlockManagementService(blockRepository);
    const canvasManagementService = new CanvasManagementService(
      blockManagementService,
      blockMountRepository,
      edgeRepository,
      viewportRepository,
      workspaceRepository
    );

    // 4. Command 생성
    const command: DeleteMultipleBlockMountsCommand = {
      blockMountIds: request.blockMountIds.map(id => new BlockMountId(id)),
      userId: userIdVO.value,
    };

    // 5. Service 메서드 호출
    const result =
      await canvasManagementService.deleteMultipleBlockMounts(command);

    if (result.isError()) {
      console.error(
        '❌ [deleteMultipleBlockMountsAction] Service failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'MULTIPLE_BLOCK_MOUNTS_DELETION_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. DTO 직렬화
    const dto: MultipleBlockMountsDeletedDTO = {
      deletedCount: result.value.deletedCount,
      deletedEdgesCount: result.value.deletedEdgesCount,
      deletedAt: new Date().toISOString(),
    };

    // 7. 페이지 재검증
    if (request.orgId && request.workspaceId && request.pageId) {
      revalidatePath(
        `/r/${request.orgId}/workspace/${request.workspaceId}/page/${request.pageId}`
      );
    }

    return ok(dto);
  } catch (error) {
    console.error('[deleteMultipleBlockMountsAction] Error:', error);
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
 */
export async function duplicateBlockAction(request: {
  blockMountId: string;
  workspaceId: string;
  offsetX?: number;
  offsetY?: number;
}): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        '❌ [duplicateBlockAction] Authentication failed:',
        authError
      );
      return { success: false, error: 'Unauthorized' };
    }

    const userIdVO = new UserId(user.id);

    // 2. Repository 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const viewportRepository = new DrizzleViewportRepository();
    const blockRepository = new DrizzleBlockRepository();
    const workspaceRepository = new DrizzleWorkspaceRepository();

    // 3. Service 인스턴스 생성
    const blockManagementService = new BlockManagementService(blockRepository);
    const canvasManagementService = new CanvasManagementService(
      blockManagementService,
      blockMountRepository,
      edgeRepository,
      viewportRepository,
      workspaceRepository
    );

    // 4. Command 생성
    const command: DuplicateBlockCommand = {
      blockMountId: new BlockMountId(request.blockMountId),
      workspaceId: request.workspaceId,
      offsetX: request.offsetX,
      offsetY: request.offsetY,
      userId: userIdVO.value,
    };

    // 5. Service 메서드 호출
    const result = await canvasManagementService.duplicateBlock(command);

    if (result.isError()) {
      return { success: false, error: result.error.message };
    }

    // 6. 성공 응답 반환
    return {
      success: true,
      data: {
        duplicatedBlockMountId: result.value.blockMount.id.value,
        duplicatedBlockId: result.value.blockMount.blockId.value,
        position: {
          x: result.value.blockMount.position.x,
          y: result.value.blockMount.position.y,
        },
        size: {
          width: result.value.blockMount.size.width,
          height: result.value.blockMount.size.height,
        },
        zOrder: result.value.blockMount.zOrder.value,
      },
    };
  } catch (error) {
    return { success: false, error: 'Internal server error' };
  }
}
