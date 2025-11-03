'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { EdgeView } from '../shared/dtos/index';
import {
  CreateEdgeRequestSchema,
  CreateEdgeRequest,
  UpdateEdgeShapeRequestSchema,
  UpdateEdgeShapeRequest,
  UpdateEdgeLabelRequestSchema,
  UpdateEdgeLabelRequest,
  DeleteEdgeRequestSchema,
  DeleteEdgeRequest,
} from '../shared/dtos/requests';
import { ActionResult, ok, err } from '@/lib/action-result';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { EdgeId } from '../shared/value-objects/edge-id.vo';
import { EdgeShape } from '../shared/value-objects/edge-shape.vo';
import {
  getAuthenticatedUser,
  verifyAccess,
  type AuthenticatedUser,
} from '@/domains/common/auth/helpers';
import { getAuthErrorMessage } from '@/domains/common/auth/error';
import type { Workspace } from '@/domains/workspace-management/shared/entities/workspace.entity';

import { DrizzleBlockMountRepository } from '../backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '../backend/repositories/implementations/drizzle-edge.repository';
import { CanvasEdgeService } from '../backend/services/canvas-edge.service';
import { BlockMountId } from '../shared/value-objects/block-mount-id.vo';

/**
 * 엣지 생성 Server Action
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
 * @returns EdgeView (성공) | Error (실패)
 */
export async function createEdgeAction(
  request: unknown // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<EdgeView>> {
  // 1. Runtime Validation (필수)
  const parseResult = CreateEdgeRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to createEdgeAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: CreateEdgeRequest

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
    return await createEdgeInternal(
      validatedRequest,
      authenticatedUser,
      accessResult.workspace! // ✅ 검증된 workspace entity
    );
  } catch (error) {
    console.error('[createEdgeAction] Authentication error:', error);

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
async function createEdgeInternal(
  request: CreateEdgeRequest, // ✅ 이미 검증됨
  authenticatedUser: AuthenticatedUser, // ✅ 이미 인증됨
  workspace: Workspace // ✅ 이미 검증된 workspace entity
): Promise<ActionResult<EdgeView>> {
  try {
    // 1. Value Objects 생성 (타입 안전 - 이미 검증됨)
    const pageIdVO = new PageId(request.pageId);
    const sourceBlockMountIdVO = new BlockMountId(request.sourceBlockMountId);
    const targetBlockMountIdVO = new BlockMountId(request.targetBlockMountId);
    const edgeShapeVO = request.edgeShape
      ? new EdgeShape(request.edgeShape)
      : undefined;

    // 2. Service 인스턴스 생성 (Repository는 Service 내부에서 주입)
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();

    const canvasEdgeService = new CanvasEdgeService(
      blockMountRepository,
      edgeRepository
    );

    // 3. 엣지 생성 (params 사용)
    const result = await canvasEdgeService.createEdge({
      pageId: pageIdVO,
      sourceBlockMountId: sourceBlockMountIdVO,
      targetBlockMountId: targetBlockMountIdVO,
      sourceHandle: request.sourceHandle,
      targetHandle: request.targetHandle,
      edgeShape: edgeShapeVO,
      userId: authenticatedUser.id,
    });

    if (result.isError()) {
      console.error(
        '❌ [createEdgeInternal] EdgeService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'EDGE_CREATION_FAILED',
        meta: {
          originalError: result.error,
          request,
        },
      });
    }

    // 4. DTO 생성
    const aggregate = result.value;
    const edgeView: EdgeView = {
      edgeId: aggregate.edge.id.value,
      pageId: aggregate.edge.pageId.value,
      sourceBlockMountId: aggregate.edge.sourceBlockMountId.value,
      targetBlockMountId: aggregate.edge.targetBlockMountId.value,
      sourceHandle: aggregate.edge.sourceHandle,
      targetHandle: aggregate.edge.targetHandle,
      edgeShape: aggregate.edge.edgeShape.value,
      createdAt: aggregate.edge.createdAt.toISOString(),
      updatedAt: aggregate.edge.updatedAt.toISOString(),
    };

    return ok(edgeView);
  } catch (error) {
    console.error('[createEdgeInternal] Internal error:', error);
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
 * 엣지 모양 업데이트 Server Action
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
 * @returns EdgeView (성공) | Error (실패)
 */
export async function updateEdgeShapeAction(
  request: unknown // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<EdgeView>> {
  // 1. Runtime Validation (필수)
  const parseResult = UpdateEdgeShapeRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to updateEdgeShapeAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: UpdateEdgeShapeRequest

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
    return await updateEdgeShapeInternal(
      validatedRequest,
      authenticatedUser,
      accessResult.workspace! // ✅ 검증된 workspace entity
    );
  } catch (error) {
    console.error('[updateEdgeShapeAction] Authentication error:', error);

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
async function updateEdgeShapeInternal(
  request: UpdateEdgeShapeRequest, // ✅ 이미 검증됨
  authenticatedUser: AuthenticatedUser, // ✅ 이미 인증됨
  workspace: Workspace // ✅ 이미 검증된 workspace entity
): Promise<ActionResult<EdgeView>> {
  try {
    // 1. Value Objects 생성 (타입 안전 - 이미 검증됨)
    const edgeIdVO = new EdgeId(request.edgeId);
    const newShapeVO = new EdgeShape(request.newShape);

    // 2. Service 인스턴스 생성 (Repository는 Service 내부에서 주입)
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();

    const canvasEdgeService = new CanvasEdgeService(
      blockMountRepository,
      edgeRepository
    );

    // 3. 엣지 모양 업데이트 (params 사용)
    const result = await canvasEdgeService.updateEdgeShape({
      edgeId: edgeIdVO,
      newShape: newShapeVO,
      userId: authenticatedUser.id,
    });

    if (result.isError()) {
      console.error(
        '❌ [updateEdgeShapeInternal] EdgeService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'EDGE_SHAPE_UPDATE_FAILED',
        meta: {
          originalError: result.error,
          request,
        },
      });
    }

    // 4. DTO 생성
    const aggregate = result.value;
    const edgeView: EdgeView = {
      edgeId: aggregate.edge.id.value,
      pageId: aggregate.edge.pageId.value,
      sourceBlockMountId: aggregate.edge.sourceBlockMountId.value,
      targetBlockMountId: aggregate.edge.targetBlockMountId.value,
      sourceHandle: aggregate.edge.sourceHandle,
      targetHandle: aggregate.edge.targetHandle,
      edgeShape: aggregate.edge.edgeShape.value,
      createdAt: aggregate.edge.createdAt.toISOString(),
      updatedAt: aggregate.edge.updatedAt.toISOString(),
    };

    // 5. 캐시 무효화
    revalidatePath(`/pages/${aggregate.edge.pageId.value}`);

    return ok(edgeView);
  } catch (error) {
    console.error('[updateEdgeShapeInternal] Internal error:', error);
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
 * 엣지 삭제 Server Action
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
 * @returns void (성공) | Error (실패)
 */
export async function deleteEdgeAction(
  request: unknown // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<void>> {
  // 1. Runtime Validation (필수)
  const parseResult = DeleteEdgeRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to deleteEdgeAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: DeleteEdgeRequest

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
    return await deleteEdgeInternal(
      validatedRequest,
      authenticatedUser,
      accessResult.workspace! // ✅ 검증된 workspace entity
    );
  } catch (error) {
    console.error('[deleteEdgeAction] Authentication error:', error);

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
async function deleteEdgeInternal(
  request: DeleteEdgeRequest, // ✅ 이미 검증됨
  authenticatedUser: AuthenticatedUser, // ✅ 이미 인증됨
  workspace: Workspace // ✅ 이미 검증된 workspace entity
): Promise<ActionResult<void>> {
  try {
    // 1. Value Objects 생성 (타입 안전 - 이미 검증됨)
    const edgeIdVO = new EdgeId(request.edgeId);

    // 2. Service 인스턴스 생성 (Repository는 Service 내부에서 주입)
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();

    const canvasEdgeService = new CanvasEdgeService(
      blockMountRepository,
      edgeRepository
    );

    // 3. 엣지 삭제 (params 사용)
    const result = await canvasEdgeService.deleteEdge({
      edgeId: edgeIdVO,
      userId: authenticatedUser.id,
    });

    if (result.isError()) {
      console.error(
        '❌ [deleteEdgeInternal] EdgeService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'EDGE_DELETION_FAILED',
        meta: {
          originalError: result.error,
          request,
        },
      });
    }

    // 4. 캐시 무효화
    revalidatePath('/');

    return ok(undefined);
  } catch (error) {
    console.error('[deleteEdgeInternal] Internal error:', error);
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

    // 4. Service 인스턴스 생성 (Repository는 Service 내부에서 주입)
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();

    const canvasEdgeService = new CanvasEdgeService(
      blockMountRepository,
      edgeRepository
    );

    // 5. 엣지 스타일 업데이트 (params 사용)
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
      sourceBlockMountId: aggregate.edge.sourceBlockMountId.value,
      targetBlockMountId: aggregate.edge.targetBlockMountId.value,
      sourceHandle: aggregate.edge.sourceHandle,
      targetHandle: aggregate.edge.targetHandle,
      edgeShape: aggregate.edge.edgeShape.value,
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
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * Defense in Depth:
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns EdgeView (성공) | Error (실패)
 */
export async function updateEdgeLabelAction(
  request: unknown // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<EdgeView>> {
  // 1. Runtime Validation (필수)
  const parseResult = UpdateEdgeLabelRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to updateEdgeLabelAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: UpdateEdgeLabelRequest

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
    return await updateEdgeLabelInternal(
      validatedRequest,
      authenticatedUser,
      accessResult.workspace! // ✅ 검증된 workspace entity
    );
  } catch (error) {
    console.error('[updateEdgeLabelAction] Authentication error:', error);

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
async function updateEdgeLabelInternal(
  request: UpdateEdgeLabelRequest, // ✅ 이미 검증됨
  authenticatedUser: AuthenticatedUser, // ✅ 이미 인증됨
  workspace: Workspace // ✅ 이미 검증된 workspace entity
): Promise<ActionResult<EdgeView>> {
  try {
    // 1. Value Objects 생성 (타입 안전 - 이미 검증됨)
    const edgeIdVO = new EdgeId(request.edgeId);

    // 2. Service 인스턴스 생성 (Repository는 Service 내부에서 주입)
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();

    const canvasEdgeService = new CanvasEdgeService(
      blockMountRepository,
      edgeRepository
    );

    // 3. 엣지 라벨 업데이트 (params 사용)
    const result = await canvasEdgeService.updateEdgeLabel({
      edgeId: edgeIdVO,
      newLabel: request.newLabel,
      userId: authenticatedUser.id,
    });

    if (result.isError()) {
      console.error(
        '❌ [updateEdgeLabelInternal] EdgeService failed:',
        result.error
      );
      return err(String(result.error), {
        code: 'EDGE_LABEL_UPDATE_FAILED',
        meta: {
          originalError: result.error,
          request,
        },
      });
    }

    // 4. DTO 생성
    const aggregate = result.value;
    const edgeView: EdgeView = {
      edgeId: aggregate.edge.id.value,
      pageId: aggregate.edge.pageId.value,
      sourceBlockMountId: aggregate.edge.sourceBlockMountId.value,
      targetBlockMountId: aggregate.edge.targetBlockMountId.value,
      sourceHandle: aggregate.edge.sourceHandle,
      targetHandle: aggregate.edge.targetHandle,
      edgeShape: aggregate.edge.edgeShape.value,
      label: aggregate.edge.edgeLabel,
      style: aggregate.edge.style,
      createdAt: aggregate.edge.createdAt.toISOString(),
      updatedAt: aggregate.edge.updatedAt.toISOString(),
    };

    // 5. 캐시 무효화
    revalidatePath(`/pages/${aggregate.edge.pageId.value}`);

    return ok(edgeView);
  } catch (error) {
    console.error('[updateEdgeLabelInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request,
      },
    });
  }
}
