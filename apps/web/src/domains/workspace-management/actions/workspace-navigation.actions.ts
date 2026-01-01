'use server';

import { getAuthErrorMessage } from '@/domains/common/auth/error';
import {
  type AuthenticatedUser,
  getAuthenticatedUser,
  verifyAccess,
} from '@/domains/common/auth/helpers';
import { DrizzleOrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization-member.repository';
import { DrizzleOrganizationRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzlePageRepository } from '../backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '../backend/repositories/implementations/drizzle-workspace-member.repository';
import { DrizzleWorkspaceRepository } from '../backend/repositories/implementations/drizzle-workspace.repository';
import { DefaultWorkspaceNavigationService } from '../backend/services';
import type {
  GetRecentPagesResponse,
  OrganizationWorkspacePageViewDTO,
  PageAccessResultDTO,
  RecentPageDTO,
  SearchPagesResponse,
} from '../shared/dtos';
import {
  type SearchPagesRequest,
  SearchPagesRequestSchema,
} from '../shared/dtos/requests/page.requests';
import type { Workspace } from '../shared/entities/workspace.entity';
import {
  type GetPageDetailsRequest,
  GetPageDetailsRequestSchema,
  type GetRecentPagesRequest,
  GetRecentPagesRequestSchema,
  type GetWorkspacePagesRequest,
  GetWorkspacePagesRequestSchema,
} from '../shared/schemas/workspace-navigation.schemas';
import { PageId } from '../shared/value-objects/page-id.vo';
import { WorkspaceId } from '../shared/value-objects/workspace-id.vo';
import { buildPageTreeDTO } from './utils';

/**
 * 조직의 Workspace-Page 목록 조회 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns OrganizationWorkspacePageViewDTO (성공) | Error (실패)
 */
export async function getOrganizationWorkspacePageViewAction(
  request: unknown
): Promise<ActionResult<OrganizationWorkspacePageViewDTO>> {
  // 1. Runtime Validation (필수)
  const parseResult = GetWorkspacePagesRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn(
      '[Security] Invalid request to getOrganizationWorkspacePageViewAction',
      {
        errors: parseResult.error.issues,
        timestamp: new Date().toISOString(),
      }
    );

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: GetWorkspacePagesRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await getOrganizationWorkspacePageViewInternal(
      validatedRequest,
      user
    );
  } catch (error) {
    console.error(
      '[getOrganizationWorkspacePageViewAction] Authentication error:',
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
async function getOrganizationWorkspacePageViewInternal(
  request: GetWorkspacePagesRequest,
  user: AuthenticatedUser
): Promise<ActionResult<OrganizationWorkspacePageViewDTO>> {
  try {
    // 1. 의존성 주입
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const pageRepo = new DrizzlePageRepository();
    const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
    const orgMemberRepo = new DrizzleOrganizationMemberRepository();
    const orgRepo = new DrizzleOrganizationRepository();

    const service = new DefaultWorkspaceNavigationService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo,
      orgRepo
    );

    // 2. Service 호출
    const result = await service.getOrganizationWorkspacePageView(
      new OrganizationId(request.organizationId),
      user.id,
      request.cookiePageId
    );

    if (!result.success) {
      return err(result.error, {
        code: result.error,
      });
    }

    // 3. Domain Entity → DTO 변환
    const dto: OrganizationWorkspacePageViewDTO = {
      organizationId: result.data.organizationId,
      workspaces: result.data.workspaces.map(ws => ({
        workspaceId: ws.workspaceId,
        name: ws.name,
        description: ws.description,
        icon: ws.icon,
        isDefault: ws.isDefault,
        isPersonal: ws.isPersonal,
        ownerId: ws.ownerId,
        pageTree: buildPageTreeDTO(ws.pageTree),
        pageCount: ws.pageCount,
        workspaceName: ws.workspaceName,
        organizationName: ws.organizationName,
      })),
      selectedPageId: result.data.selectedPageId ?? null,
    };

    return ok(dto);
  } catch (error) {
    console.error(
      '[getOrganizationWorkspacePageViewInternal] Internal error:',
      error
    );
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
 * Page 상세 정보 조회 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns PageAccessResultDTO (성공) | Error (실패)
 */
export async function getPageDetailsAction(
  request: unknown
): Promise<ActionResult<PageAccessResultDTO>> {
  // 1. Runtime Validation (필수)
  const parseResult = GetPageDetailsRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to getPageDetailsAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: GetPageDetailsRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await getPageDetailsInternal(validatedRequest, user);
  } catch (error) {
    console.error('[getPageDetailsAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function getPageDetailsInternal(
  request: GetPageDetailsRequest,
  user: AuthenticatedUser
): Promise<ActionResult<PageAccessResultDTO>> {
  try {
    // 1. 의존성 주입
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const pageRepo = new DrizzlePageRepository();
    const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
    const orgMemberRepo = new DrizzleOrganizationMemberRepository();

    const service = new DefaultWorkspaceNavigationService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo
    );

    // 2. Service 호출 (권한 검증 포함)
    const result = await service.verifyPageAccess(
      new OrganizationId(request.organizationId),
      new WorkspaceId(request.workspaceId),
      new PageId(request.pageId),
      user.id
    );

    if (!result.success) {
      return err(result.error, {
        code: result.error,
      });
    }

    // 3. Workspace 정보 조회 (DTO에 포함)
    const workspace = await workspaceRepo.findById(
      new WorkspaceId(request.workspaceId)
    );

    // 4. Domain Entity → DTO 변환
    const dto: PageAccessResultDTO = {
      pageId: result.data.page.pageId.value,
      title: result.data.page.title,
      icon: result.data.page.icon,
      workspaceId: result.data.page.workspaceId.value,
      workspaceName: workspace?.name || 'Unknown Workspace',
      userRole: result.data.userRole,
    };

    return ok(dto);
  } catch (error) {
    console.error('[getPageDetailsInternal] Internal error:', error);
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
 * 최근 페이지 조회 Server Action (경량화)
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns GetRecentPagesResponse (성공) | Error (실패)
 */
export async function getRecentPagesAction(
  request: unknown
): Promise<ActionResult<GetRecentPagesResponse>> {
  // 1. Runtime Validation (필수)
  const parseResult = GetRecentPagesRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to getRecentPagesAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: GetRecentPagesRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await getRecentPagesInternal(validatedRequest, user);
  } catch (error) {
    console.error('[getRecentPagesAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function getRecentPagesInternal(
  request: GetRecentPagesRequest,
  user: AuthenticatedUser
): Promise<ActionResult<GetRecentPagesResponse>> {
  try {
    const limit = Math.min(request.limit || 20, 50); // 최대 50개

    // 1. Repository 초기화
    const pageRepo = new DrizzlePageRepository();
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const memberRepo = new DrizzleWorkspaceMemberRepository();

    // 2. 워크스페이스 조회 및 권한 확인
    const workspaceId = new WorkspaceId(request.workspaceId);
    const workspace = await workspaceRepo.findById(workspaceId);

    if (!workspace) {
      return err('Workspace not found', {
        code: 'WORKSPACE_NOT_FOUND',
      });
    }

    // 3. 워크스페이스 멤버십 확인
    const isMember = await memberRepo.isMember(workspaceId, user.id);
    if (!isMember) {
      return err('User is not a member of this workspace', {
        code: 'NOT_WORKSPACE_MEMBER',
      });
    }

    // 4. 최근 페이지 조회
    const results = await pageRepo.findRecentByWorkspaceId(workspaceId, limit);

    // 5. DTO 변환
    const pages: RecentPageDTO[] = results.map(({ page, workspaceName }) => ({
      pageId: page.pageId.value,
      title: page.title,
      icon: page.icon,
      workspaceId: page.workspaceId.value,
      workspaceName,
      updatedAt: page.updatedAt.toISOString(),
    }));

    return ok({ pages });
  } catch (error) {
    console.error('[getRecentPagesInternal] Internal error:', error);
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
 * 페이지 검색 Server Action
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
 * @returns SearchPagesResponse (성공) | Error (실패)
 */
export async function searchPagesAction(
  request: unknown // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<SearchPagesResponse>> {
  // 1. Runtime Validation (필수)
  const parseResult = SearchPagesRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to searchPagesAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: SearchPagesRequest

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
    return await searchPagesInternal(
      validatedRequest,
      user,
      accessResult.workspace!
    );
  } catch (error) {
    console.error('[searchPagesAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function searchPagesInternal(
  request: SearchPagesRequest,
  user: AuthenticatedUser,
  workspace: Workspace
): Promise<ActionResult<SearchPagesResponse>> {
  try {
    const pageRepo = new DrizzlePageRepository();
    const limit = Math.min(request.limit || 50, 50); // 최대 50개 제한

    const results = await pageRepo.searchByWorkspaceId(
      new WorkspaceId(request.workspaceId),
      request.query,
      limit
    );

    const pages: RecentPageDTO[] = results.map(({ page, workspaceName }) => ({
      pageId: page.pageId.value,
      title: page.title,
      icon: page.icon,
      workspaceId: page.workspaceId.value,
      workspaceName,
      updatedAt: page.updatedAt.toISOString(),
    }));

    return ok({
      pages,
      hasMore: pages.length === limit, // limit에 도달하면 더 있을 수 있음
    });
  } catch (error) {
    console.error('[searchPagesInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request,
      },
    });
  }
}
