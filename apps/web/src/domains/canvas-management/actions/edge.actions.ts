'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { EdgeView } from '../shared/dtos/index';
import { ActionResult, ok, err } from '@/lib/action-result';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { EdgeId } from '../shared/value-objects/edge-id.vo';
import { EdgeType } from '../shared/value-objects/edge-type.vo';

import { DrizzleBlockMountRepository } from '../backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '../backend/repositories/implementations/drizzle-edge.repository';
import { DrizzleViewportRepository } from '../backend/repositories/implementations/drizzle-viewport.repository';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { BlockManagementService } from '@/domains/block-management/backend/services/block-management.service';
import { DefaultCanvasEdgeService } from '../backend/services/canvas-edge.service';

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

    // 2. 입력 검증
    if (!pageId || pageId.trim().length === 0) {
      return err('Page ID is required', { code: 'INVALID_PAGE_ID' });
    }

    if (!sourceBlockId || sourceBlockId.trim().length === 0) {
      return err('Source Block ID is required', {
        code: 'INVALID_SOURCE_BLOCK_ID',
      });
    }

    if (!targetBlockId || targetBlockId.trim().length === 0) {
      return err('Target Block ID is required', {
        code: 'INVALID_TARGET_BLOCK_ID',
      });
    }

    // 3. Value Objects 생성
    const pageIdVO = new PageId(pageId);
    const sourceBlockIdVO = new BlockId(sourceBlockId);
    const targetBlockIdVO = new BlockId(targetBlockId);
    const edgeTypeVO = new EdgeType(edgeType);

    // 4. 의존성 주입
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();

    const canvasEdgeService = new DefaultCanvasEdgeService(
      blockMountRepository,
      edgeRepository
    );

    // 5. 엣지 생성
    const result = await canvasEdgeService.createEdge({
      pageId: pageIdVO,
      sourceBlockId: sourceBlockIdVO,
      targetBlockId: targetBlockIdVO,
      edgeType: edgeTypeVO,
      userId: user.id,
    });

    if (result.isError()) {
      return err(String(result.error), {
        code: 'EDGE_CREATION_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. DTO 생성
    const aggregate = result.value;
    const edgeView: EdgeView = {
      edgeId: aggregate.edge.id.value,
      pageId: aggregate.edge.pageId.value,
      sourceBlockId: aggregate.edge.sourceBlockId.value,
      targetBlockId: aggregate.edge.targetBlockId.value,
      edgeType: aggregate.edge.edgeType.value,
      createdAt: aggregate.edge.createdAt.toISOString(),
      updatedAt: aggregate.edge.updatedAt.toISOString(),
    };

    // 7. 캐시 무효화
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
 * 엣지 타입 업데이트 Server Action
 */
export async function updateEdgeTypeAction(
  edgeId: string,
  newType: string
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

    // 2. 입력 검증
    if (!edgeId || edgeId.trim().length === 0) {
      return err('Edge ID is required', { code: 'INVALID_EDGE_ID' });
    }

    // 3. Value Objects 생성
    const edgeIdVO = new EdgeId(edgeId);
    const newTypeVO = new EdgeType(newType);

    // 4. 의존성 주입
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();

    const canvasEdgeService = new DefaultCanvasEdgeService(
      blockMountRepository,
      edgeRepository
    );

    // 5. 엣지 타입 업데이트
    const result = await canvasEdgeService.updateEdgeType({
      edgeId: edgeIdVO,
      newType: newTypeVO,
      userId: user.id,
    });

    if (result.isError()) {
      return err(String(result.error), {
        code: 'EDGE_TYPE_UPDATE_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. DTO 생성
    const aggregate = result.value;
    const edgeView: EdgeView = {
      edgeId: aggregate.edge.id.value,
      pageId: aggregate.edge.pageId.value,
      sourceBlockId: aggregate.edge.sourceBlockId.value,
      targetBlockId: aggregate.edge.targetBlockId.value,
      edgeType: aggregate.edge.edgeType.value,
      createdAt: aggregate.edge.createdAt.toISOString(),
      updatedAt: aggregate.edge.updatedAt.toISOString(),
    };

    // 7. 캐시 무효화
    revalidatePath(`/pages/${aggregate.edge.pageId.value}`);

    return ok(edgeView);
  } catch (error) {
    console.error('[updateEdgeTypeAction] Error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * 엣지 삭제 Server Action
 */
export async function deleteEdgeAction(
  edgeId: string
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

    // 2. 입력 검증
    if (!edgeId || edgeId.trim().length === 0) {
      return err('Edge ID is required', { code: 'INVALID_EDGE_ID' });
    }

    // 3. Value Objects 생성
    const edgeIdVO = new EdgeId(edgeId);

    // 4. 의존성 주입
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();

    const canvasEdgeService = new DefaultCanvasEdgeService(
      blockMountRepository,
      edgeRepository
    );

    // 5. 엣지 삭제
    const result = await canvasEdgeService.deleteEdge({
      edgeId: edgeIdVO,
      userId: user.id,
    });

    if (result.isError()) {
      return err(String(result.error), {
        code: 'EDGE_DELETION_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. 캐시 무효화
    revalidatePath('/');

    return ok(undefined);
  } catch (error) {
    console.error('[deleteEdgeAction] Error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * 엣지 스타일 업데이트 Server Action
 *
 * @param edgeId - 엣지 ID
 * @param style - 스타일 속성 (stroke: 색상, strokeWidth: 두께)
 * @returns EdgeView (성공) | Error (실패)
 */
export async function updateEdgeStyleAction(
  edgeId: string,
  style: { stroke?: string; strokeWidth?: number }
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

    // 2. 입력 검증
    if (!edgeId || edgeId.trim().length === 0) {
      return err('Edge ID is required', { code: 'INVALID_EDGE_ID' });
    }

    // 3. Value Objects 생성
    const edgeIdVO = new EdgeId(edgeId);

    // 4. 의존성 주입
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();

    const canvasEdgeService = new DefaultCanvasEdgeService(
      blockMountRepository,
      edgeRepository
    );

    // 5. 엣지 스타일 업데이트
    const result = await canvasEdgeService.updateEdgeStyle({
      edgeId: edgeIdVO,
      style,
      userId: user.id,
    });

    if (result.isError()) {
      return err(String(result.error), {
        code: 'EDGE_STYLE_UPDATE_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. DTO 생성
    const aggregate = result.value;
    const edgeView: EdgeView = {
      edgeId: aggregate.edge.id.value,
      pageId: aggregate.edge.pageId.value,
      sourceBlockId: aggregate.edge.sourceBlockId.value,
      targetBlockId: aggregate.edge.targetBlockId.value,
      edgeType: aggregate.edge.edgeType.value,
      label: aggregate.edge.edgeLabel,
      style: aggregate.edge.style,
      createdAt: aggregate.edge.createdAt.toISOString(),
      updatedAt: aggregate.edge.updatedAt.toISOString(),
    };

    // 7. 캐시 무효화
    revalidatePath(`/pages/${aggregate.edge.pageId.value}`);

    return ok(edgeView);
  } catch (error) {
    console.error('[updateEdgeStyleAction] Error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * 엣지 라벨 업데이트 Server Action
 *
 * @param edgeId - 엣지 ID
 * @param newLabel - 새로운 라벨
 * @returns EdgeView (성공) | Error (실패)
 */
export async function updateEdgeLabelAction(
  edgeId: string,
  newLabel: string
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

    // 2. 입력 검증
    if (!edgeId || edgeId.trim().length === 0) {
      return err('Edge ID is required', { code: 'INVALID_EDGE_ID' });
    }

    // 3. Value Objects 생성
    const edgeIdVO = new EdgeId(edgeId);

    // 4. 의존성 주입
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();

    const canvasEdgeService = new DefaultCanvasEdgeService(
      blockMountRepository,
      edgeRepository
    );

    // 5. 엣지 라벨 업데이트
    const result = await canvasEdgeService.updateEdgeLabel({
      edgeId: edgeIdVO,
      newLabel,
      userId: user.id,
    });

    if (result.isError()) {
      return err(String(result.error), {
        code: 'EDGE_LABEL_UPDATE_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 6. DTO 생성
    const aggregate = result.value;
    const edgeView: EdgeView = {
      edgeId: aggregate.edge.id.value,
      pageId: aggregate.edge.pageId.value,
      sourceBlockId: aggregate.edge.sourceBlockId.value,
      targetBlockId: aggregate.edge.targetBlockId.value,
      edgeType: aggregate.edge.edgeType.value,
      label: aggregate.edge.edgeLabel,
      style: aggregate.edge.style,
      createdAt: aggregate.edge.createdAt.toISOString(),
      updatedAt: aggregate.edge.updatedAt.toISOString(),
    };

    // 7. 캐시 무효화
    revalidatePath(`/pages/${aggregate.edge.pageId.value}`);

    return ok(edgeView);
  } catch (error) {
    console.error('[updateEdgeLabelAction] Error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
