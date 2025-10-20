'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  ViewportView,
  MountBlockDTO,
  CanvasView,
  BlockMountView,
  EdgeView,
  CanvasViewData,
} from '../shared/dtos/index';
import {
  ActionResult,
  ok,
  err,
  isSuccess,
  isFailure,
} from '@/lib/action-result';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { BlockMountId } from '../shared/value-objects/block-mount-id.vo';
import { Position } from '../shared/value-objects/position.vo';
import { Size } from '../shared/value-objects/size.vo';
import { ZOrder } from '../shared/value-objects/z-order.vo';
import { BlockMountAggregate } from '../shared/aggregates/block-mount.aggregate';

import { DrizzleBlockMountRepository } from '../backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '../backend/repositories/implementations/drizzle-edge.repository';
import { DrizzleViewportRepository } from '../backend/repositories/implementations/drizzle-viewport.repository';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { CanvasManagementService } from '../backend/services/canvas-management.service';
import { BlockManagementService } from '@/domains/block-management/backend/services/block-management.service';
import { DefaultWorkspaceNavigationService } from '@/domains/workspace-management/backend/services/workspace-navigation.service';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace-member.repository';
import { DrizzleOrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization-member.repository';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';

/**
 * Viewport 조회 Server Action
 *
 * @param pageId - 페이지 ID
 * @param userId - 사용자 ID
 * @returns ViewportView (성공) | Error (실패)
 */
export async function getViewportAction(
  pageId: string,
  userId: string
): Promise<ActionResult<ViewportView>> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return err('User not authenticated', { code: 'UNAUTHORIZED' });
    }

    // 2. 입력 검증
    if (!pageId || pageId.trim().length === 0) {
      return err('Page ID is required', { code: 'INVALID_PAGE_ID' });
    }

    // TODO: ViewportRepository 구현 후 실제 로직으로 교체
    // 현재는 기본 Viewport 반환
    const defaultViewport: ViewportView = {
      viewportId: 'default-viewport',
      pageId,
      userId: user.id,
      zoomLevel: 1.0,
      center: { x: 0, y: 0 },
      minZoom: 0.1,
      maxZoom: 4.0,
      lastSavedAt: new Date().toISOString(),
    };

    return ok(defaultViewport);
  } catch (error) {
    console.error('[getViewportAction] Error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * 블럭 마운트 Server Action
 *
 * @param pageId - 페이지 ID
 * @param blockId - 블럭 ID
 * @param position - 위치 정보
 * @param size - 크기 정보
 * @param userId - 사용자 ID
 * @returns MountBlockDTO (성공) | Error (실패)
 */
export async function mountBlockAction(
  pageId: string,
  blockId: string,
  position: { x: number; y: number },
  size: { width: number; height: number },
  userId: string
): Promise<ActionResult<MountBlockDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return err('User not authenticated', { code: 'UNAUTHORIZED' });
    }

    // 2. 입력 검증
    if (!pageId || pageId.trim().length === 0) {
      return err('Page ID is required', { code: 'INVALID_PAGE_ID' });
    }

    if (!blockId || blockId.trim().length === 0) {
      return err('Block ID is required', { code: 'INVALID_BLOCK_ID' });
    }

    // 3. Value Objects 생성
    const pageIdVO = new PageId(pageId);
    const blockIdVO = new BlockId(blockId);
    const positionVO = new Position(position.x, position.y);
    const sizeVO = new Size(size.width, size.height);

    // 4. BlockMountId 생성 (UUID)
    const blockMountId = new BlockMountId(crypto.randomUUID());

    // 5. BlockMountAggregate를 사용하여 블럭 마운트
    const aggregate = BlockMountAggregate.mountBlock(
      blockMountId,
      pageIdVO,
      blockIdVO,
      positionVO,
      sizeVO
    );

    // 5. DTO 생성
    const dto: MountBlockDTO = {
      blockMountId: aggregate.blockMount.id.value,
      pageId: pageIdVO.value,
      blockId: blockIdVO.value,
      position: {
        x: aggregate.blockMount.position.x,
        y: aggregate.blockMount.position.y,
      },
      size: {
        width: aggregate.blockMount.size.width,
        height: aggregate.blockMount.size.height,
      },
      zOrder: aggregate.blockMount.zOrder.value,
      mountedAt: aggregate.blockMount.createdAt.toISOString(),
    };

    // 6. 캐시 무효화
    try {
      revalidatePath(`/pages/${pageId}`);
    } catch (error) {
      console.warn('revalidatePath failed:', error);
    }

    return ok(dto);
  } catch (error) {
    console.error('[mountBlockAction] Error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * 엣지 생성 Server Action
 */
export async function createEdgeAction(
  pageId: string,
  sourceBlockId: string,
  targetBlockId: string,
  edgeType: string = 'default'
): Promise<ActionResult<EdgeView>> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return err('User not authenticated', { code: 'UNAUTHORIZED' });
    }

    // TODO: 실제 구현으로 교체
    const edgeView: EdgeView = {
      edgeId: `edge-${Date.now()}`,
      pageId,
      sourceBlockId,
      targetBlockId,
      edgeType: edgeType as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    revalidatePath(`/pages/${pageId}`);
    return ok(edgeView);
  } catch (error) {
    console.error('[createEdgeAction] Error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * 블럭 마운트 삭제 Server Action
 */
export async function deleteBlockMountAction(
  blockMountId: string
): Promise<ActionResult<void>> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return err('User not authenticated', { code: 'UNAUTHORIZED' });
    }

    // TODO: 실제 구현으로 교체
    console.log('Deleting block mount:', blockMountId);

    return ok(undefined);
  } catch (error) {
    console.error('[deleteBlockMountAction] Error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * 캔버스 뷰 데이터 조회 Server Action
 * CanvasManagementService를 사용하여 페이지의 전체 캔버스 데이터를 조회
 *
 * @param pageId - 페이지 ID
 * @param orgId - 조직 ID (권한 검증용)
 * @param workspaceId - 워크스페이스 ID (권한 검증용)
 * @returns CanvasViewData (성공) | Error (실패)
 */
export async function getCanvasViewAction(
  pageId: string,
  orgId?: string,
  workspaceId?: string
): Promise<ActionResult<CanvasViewData>> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return err('User not authenticated', { code: 'UNAUTHORIZED' });
    }

    // 2. 입력 검증
    if (!pageId || pageId.trim().length === 0) {
      return err('Page ID is required', { code: 'INVALID_PAGE_ID' });
    }

    // 3. Value Objects 생성
    const pageIdVO = new PageId(pageId);
    const userIdVO = new UserId(user.id);

    // 4. 권한 검증 (orgId와 workspaceId가 제공된 경우)
    if (orgId && workspaceId) {
      const orgIdVO = new OrganizationId(orgId);
      const workspaceIdVO = new WorkspaceId(workspaceId);

      // Workspace Navigation Service를 사용한 권한 검증
      const workspaceRepo = new DrizzleWorkspaceRepository();
      const pageRepo = new DrizzlePageRepository();
      const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
      const orgMemberRepo = new DrizzleOrganizationMemberRepository();

      const navigationService = new DefaultWorkspaceNavigationService(
        workspaceRepo,
        pageRepo,
        workspaceMemberRepo,
        orgMemberRepo
      );

      const accessResult = await navigationService.verifyPageAccess(
        orgIdVO,
        workspaceIdVO,
        pageIdVO,
        user.id
      );

      if (!accessResult.success) {
        return err(`Access denied: ${accessResult.error}`, {
          code: 'ACCESS_DENIED',
        });
      }
    }

    // 5. 의존성 주입 (Repository 및 Service)
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const viewportRepository = new DrizzleViewportRepository();
    const blockRepository = new DrizzleBlockRepository();
    const workspaceRepository = new DrizzleWorkspaceRepository();
    const blockManagementService = new BlockManagementService();

    // 6. CanvasManagementService 인스턴스 생성 및 실행
    const canvasManagementService = new CanvasManagementService(
      blockManagementService,
      blockMountRepository,
      edgeRepository,
      viewportRepository,
      workspaceRepository
    );

    const result = await canvasManagementService.getCanvasView(
      pageIdVO,
      userIdVO
    );

    // 7. 결과 처리 (Result 타입을 ActionResult로 변환)
    if (result.isError()) {
      return err(String(result.error), {
        code: 'CANVAS_VIEW_ERROR',
        meta: {
          originalError: result.error,
        },
      });
    }

    // 8. 성공적으로 CanvasViewData 반환
    return ok(result.value);
  } catch (error) {
    console.error('[getCanvasViewAction] Error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
