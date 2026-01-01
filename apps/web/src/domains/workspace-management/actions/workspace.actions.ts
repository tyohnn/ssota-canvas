'use server';

import { revalidatePath } from 'next/cache';

import {
  type AuthenticatedUser,
  getAuthenticatedUser,
} from '@/domains/common/auth/helpers';
import { DrizzleOrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization-member.repository';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzlePageRepository } from '../backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '../backend/repositories/implementations/drizzle-workspace-member.repository';
import { DrizzleWorkspaceRepository } from '../backend/repositories/implementations/drizzle-workspace.repository';
import { DefaultWorkspaceCrudService } from '../backend/services';
import type { CreateWorkspaceResponse } from '../shared/dtos';
import {
  type CreateWorkspaceRequest,
  CreateWorkspaceRequestSchema,
  type UpdateWorkspaceInfoRequest,
  UpdateWorkspaceInfoRequestSchema,
} from '../shared/schemas/workspace.schemas';
import { WorkspaceId } from '../shared/value-objects/workspace-id.vo';

/**
 * Workspace 생성 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * 트랜잭션:
 * 1. Workspace 생성
 * 2. 생성자를 Workspace 멤버로 추가
 * 3. 초기 "Untitled" 페이지 생성
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns CreateWorkspaceResponse (성공) | Error (실패)
 */
export async function createWorkspaceAction(
  request: unknown
): Promise<ActionResult<CreateWorkspaceResponse>> {
  // 1. Runtime Validation (필수)
  const parseResult = CreateWorkspaceRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to createWorkspaceAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: CreateWorkspaceRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await createWorkspaceInternal(validatedRequest, user);
  } catch (error) {
    console.error('[createWorkspaceAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function createWorkspaceInternal(
  request: CreateWorkspaceRequest,
  user: AuthenticatedUser
): Promise<ActionResult<CreateWorkspaceResponse>> {
  try {
    // 1. 의존성 주입
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const pageRepo = new DrizzlePageRepository();
    const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
    const orgMemberRepo = new DrizzleOrganizationMemberRepository();

    const service = new DefaultWorkspaceCrudService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo
    );

    // 2. Service 호출 (트랜잭션: Workspace + 초기 Page 생성)
    const result = await service.createWorkspace(
      new OrganizationId(request.organizationId),
      request.name,
      request.description || null,
      request.icon || null,
      user.id
    );

    if (!result.success) {
      return err(result.error, {
        code: result.error,
      });
    }

    // 3. DTO 반환 (SSOT: service에서 반환된 실제 값 사용)
    const response: CreateWorkspaceResponse = {
      workspaceId: result.data.workspaceId,
      workspaceName: result.data.workspaceName,
      workspaceIsDefault: result.data.workspaceIsDefault,
      firstPageId: result.data.firstPageId,
      firstPageTitle: result.data.firstPageTitle,
      firstPageIcon: result.data.firstPageIcon,
    };

    // 4. 캐시 무효화
    revalidatePath(`/r/${request.organizationId}`);

    return ok(response);
  } catch (error) {
    console.error('[createWorkspaceInternal] Internal error:', error);
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
 * Workspace 정보 수정 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns void (성공) | Error (실패)
 */
export async function updateWorkspaceInfoAction(
  request: unknown
): Promise<ActionResult<void>> {
  // 1. Runtime Validation (필수)
  const parseResult = UpdateWorkspaceInfoRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to updateWorkspaceInfoAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: UpdateWorkspaceInfoRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await updateWorkspaceInfoInternal(validatedRequest, user);
  } catch (error) {
    console.error('[updateWorkspaceInfoAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function updateWorkspaceInfoInternal(
  request: UpdateWorkspaceInfoRequest,
  user: AuthenticatedUser
): Promise<ActionResult<void>> {
  try {
    // 1. 의존성 주입
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const pageRepo = new DrizzlePageRepository();
    const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
    const orgMemberRepo = new DrizzleOrganizationMemberRepository();

    const service = new DefaultWorkspaceCrudService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo
    );

    // 2. Service 호출
    const result = await service.updateWorkspaceInfo(
      new WorkspaceId(request.workspaceId),
      request.name,
      request.description,
      request.icon,
      user.id
    );

    if (!result.success) {
      return err(result.error, {
        code: result.error,
      });
    }

    // 3. 캐시 무효화 (사이드바 Workspace 목록 갱신)
    const workspace = await workspaceRepo.findById(
      new WorkspaceId(request.workspaceId)
    );
    if (workspace) {
      revalidatePath(`/r/${workspace.organizationId.value}`);
    }

    return ok(undefined);
  } catch (error) {
    console.error('[updateWorkspaceInfoInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        workspaceId: request.workspaceId,
      },
    });
  }
}
