'use server';

/**
 * Canvas Management Viewport & Legacy Actions
 *
 * Viewport 관련 Server Actions 및 레거시 호환성 유지
 *
 * 모듈화된 Actions:
 * - canvas-query.actions.ts: 캔버스 조회 (getCanvasViewAction)
 * - edge.actions.ts: 엣지 관리 (createEdgeAction, updateEdgeTypeAction, deleteEdgeAction)
 * - block.actions.ts: 블럭 마운트 관리 (createBlockAction, updateBlockPositionAction, etc.)
 */

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { ViewportView, MountBlockDTO } from '../shared/dtos/index';
import { ActionResult, ok, err } from '@/lib/action-result';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { BlockMountId } from '../shared/value-objects/block-mount-id.vo';
import { Position } from '../shared/value-objects/position.vo';
import { Size } from '../shared/value-objects/size.vo';
import { BlockMountAggregate } from '../shared/aggregates/block-mount.aggregate';

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
 * 블럭 마운트 삭제 Server Action
 *
 * TODO: CM-008에서 구현 예정
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

    // TODO: CM-008에서 실제 구현으로 교체

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
