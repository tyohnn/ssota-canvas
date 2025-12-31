'use server';

/**
 * Canvas Management Viewport & Legacy Actions
 *
 * Viewport 관련 Server Actions 및 레거시 호환성 유지
 *
 * 모듈화된 Actions:
 * - canvas-query.actions.ts: 캔버스 조회 (getCanvasViewAction)
 * - edge/: 엣지 관리 (createEdgeAction, updateEdgeShapeAction, updateEdgeLabelAction, updateEdgeStyleAction, deleteEdgeAction)
 * - block.actions.ts: 블럭 마운트 관리 (createBlockAction, updateBlockPositionAction, etc.)
 */
import { ActionResult, err, ok } from '@/lib/action-result';
import { createClient } from '@/utils/supabase/server';

import { ViewportView } from '../shared/dtos/index';

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
 * Soft Delete Block Mount Server Action
 *
 * TODO: CM-008에서 구현 예정
 */
export async function softDeleteMountAction(
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
    console.error('[softDeleteMountAction] Error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
