'use server';

import { revalidatePath } from 'next/cache';
import { DrizzlePageRepository } from '../backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '../backend/repositories/implementations/drizzle-workspace-member.repository';
import { DefaultPageHierarchyService } from '../backend/services';
import { DefaultPageLifecycleService } from '../backend/services/page-lifecycle.service';
import { WorkspaceId } from '../shared/value-objects/workspace-id.vo';
import { PageId } from '../shared/value-objects/page-id.vo';
import type { CreatePageResponse, DuplicatePageResponse } from '../shared/dtos';
import {
  CreatePageRequestSchema,
  MovePageRequestSchema,
  UpdatePageInfoRequestSchema,
  ReorderPagesRequestSchema,
  DeletePageRequestSchema,
  DuplicatePageRequestSchema,
  type CreatePageRequest,
  type MovePageRequest,
  type UpdatePageInfoRequest,
  type ReorderPagesRequest,
  type DeletePageRequest,
  type DuplicatePageRequest,
} from '../shared/schemas/page.schemas';
import { ActionResult, ok, err } from '@/lib/action-result';
import {
  getAuthenticatedUser,
  type AuthenticatedUser,
} from '@/domains/common/auth/helpers';

/**
 * Page 생성 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns CreatePageResponse (성공) | Error (실패)
 */
export async function createPageAction(
  request: unknown
): Promise<ActionResult<CreatePageResponse>> {
  // 1. Runtime Validation (필수)
  const parseResult = CreatePageRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to createPageAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: CreatePageRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await createPageInternal(validatedRequest, user);
  } catch (error) {
    console.error('[createPageAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function createPageInternal(
  request: CreatePageRequest,
  user: AuthenticatedUser
): Promise<ActionResult<CreatePageResponse>> {
  try {
    // 1. 의존성 주입
    const pageRepo = new DrizzlePageRepository();
    const memberRepo = new DrizzleWorkspaceMemberRepository();

    const service = new DefaultPageHierarchyService(pageRepo, memberRepo);

    // 2. Service 호출
    const result = await service.createPage(
      new WorkspaceId(request.workspaceId),
      request.parentId ? new PageId(request.parentId) : null,
      request.title || 'Untitled',
      request.icon || 'Briefcase',
      user.id
    );

    // 3. Result 처리
    if (!result.success) {
      return err(result.error, {
        code: result.error,
        meta: { details: `Failed to create page: ${result.error}` },
      });
    }

    return ok({ pageId: result.data });
  } catch (error) {
    console.error('[createPageInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        workspaceId: request.workspaceId,
      },
    });
  }
}

/**
 * Page 이동 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns void (성공) | Error (실패)
 */
export async function movePageAction(
  request: unknown
): Promise<ActionResult<void>> {
  // 1. Runtime Validation (필수)
  const parseResult = MovePageRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to movePageAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: MovePageRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await movePageInternal(validatedRequest, user);
  } catch (error) {
    console.error('[movePageAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function movePageInternal(
  request: MovePageRequest,
  user: AuthenticatedUser
): Promise<ActionResult<void>> {
  try {
    // 1. 의존성 주입
    const pageRepo = new DrizzlePageRepository();
    const memberRepo = new DrizzleWorkspaceMemberRepository();

    const service = new DefaultPageHierarchyService(pageRepo, memberRepo);

    // 2. Service 호출
    const result = await service.movePage(
      new PageId(request.pageId),
      request.newParentId ? new PageId(request.newParentId) : null,
      user.id,
      request.insertIndex,
      request.prevPageId ? new PageId(request.prevPageId) : undefined,
      request.nextPageId ? new PageId(request.nextPageId) : undefined
    );

    // 3. Result 처리
    if (!result.success) {
      return err(result.error, {
        code: result.error,
        meta: { details: `Failed to move page: ${result.error}` },
      });
    }

    // 4. 캐시 무효화: Next.js가 페이지 데이터를 다시 가져오도록 함
    revalidatePath('/r');

    return ok(undefined);
  } catch (error) {
    console.error('[movePageInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        pageId: request.pageId,
      },
    });
  }
}

/**
 * Page 정보 수정 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns void (성공) | Error (실패)
 */
export async function updatePageInfoAction(
  request: unknown
): Promise<ActionResult<void>> {
  // 1. Runtime Validation (필수)
  const parseResult = UpdatePageInfoRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to updatePageInfoAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: UpdatePageInfoRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await updatePageInfoInternal(validatedRequest, user);
  } catch (error) {
    console.error('[updatePageInfoAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function updatePageInfoInternal(
  request: UpdatePageInfoRequest,
  user: AuthenticatedUser
): Promise<ActionResult<void>> {
  try {
    // 1. 의존성 주입
    const pageRepo = new DrizzlePageRepository();
    const memberRepo = new DrizzleWorkspaceMemberRepository();

    const service = new DefaultPageHierarchyService(pageRepo, memberRepo);

    // 2. Service 호출
    const result = await service.updatePageInfo(
      new PageId(request.pageId),
      request.title,
      request.icon,
      user.id
    );

    // 3. Result 처리
    if (!result.success) {
      return err(result.error, {
        code: result.error,
        meta: { details: `Failed to update page info: ${result.error}` },
      });
    }

    // 4. 캐시 무효화
    revalidatePath('/r');

    return ok(undefined);
  } catch (error) {
    console.error('[updatePageInfoInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        pageId: request.pageId,
      },
    });
  }
}

/**
 * Page 순서 재정렬 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns void (성공) | Error (실패)
 */
export async function reorderPagesAction(
  request: unknown
): Promise<ActionResult<void>> {
  // 1. Runtime Validation (필수)
  const parseResult = ReorderPagesRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to reorderPagesAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: ReorderPagesRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. 권한 확인: 워크스페이스 멤버인지 확인 (Action layer에서 수행)
    const memberRepo = new DrizzleWorkspaceMemberRepository();
    const workspaceId = new WorkspaceId(validatedRequest.workspaceId);
    const isMember = await memberRepo.isMember(workspaceId, user.id);

    if (!isMember) {
      return err('User is not a member of this workspace', {
        code: 'NOT_WORKSPACE_MEMBER',
      });
    }

    // 5. Internal 함수 호출 (비즈니스 로직은 Service로 위임)
    return await reorderPagesInternal(validatedRequest);
  } catch (error) {
    console.error('[reorderPagesAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function reorderPagesInternal(
  request: ReorderPagesRequest
): Promise<ActionResult<void>> {
  try {
    // 1. 의존성 주입
    const pageRepo = new DrizzlePageRepository();
    const memberRepo = new DrizzleWorkspaceMemberRepository();
    const service = new DefaultPageHierarchyService(pageRepo, memberRepo);

    // 2. Service 호출
    const result = await service.reorderPages(
      new WorkspaceId(request.workspaceId),
      request.parentId ? new PageId(request.parentId) : null,
      request.orderedPageIds
    );

    if (!result.success) {
      return err(result.error, {
        code: result.error,
        meta: { details: `Failed to reorder pages: ${result.error}` },
      });
    }

    return ok(undefined);
  } catch (error) {
    console.error('[reorderPagesInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        workspaceId: request.workspaceId,
      },
    });
  }
}

/**
 * Page 삭제 Server Action (Soft Delete)
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns void (성공) | Error (실패)
 */
export async function deletePageAction(
  request: unknown
): Promise<ActionResult<void>> {
  // 1. Runtime Validation (필수)
  const parseResult = DeletePageRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to deletePageAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: DeletePageRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await deletePageInternal(validatedRequest, user);
  } catch (error) {
    console.error('[deletePageAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function deletePageInternal(
  request: DeletePageRequest,
  user: AuthenticatedUser
): Promise<ActionResult<void>> {
  try {
    // 1. 의존성 주입
    const pageRepo = new DrizzlePageRepository();
    const memberRepo = new DrizzleWorkspaceMemberRepository();

    const service = new DefaultPageLifecycleService(pageRepo, memberRepo);

    // 2. Service 호출 (params 패턴)
    const result = await service.deletePage({
      pageId: new PageId(request.pageId),
      userId: user.id,
    });

    // 3. Result 처리
    if (!result.success) {
      return err(result.error, {
        code: result.error,
        meta: { details: `Failed to delete page: ${result.error}` },
      });
    }

    // 4. 캐시 무효화
    revalidatePath('/r');

    return ok(undefined);
  } catch (error) {
    console.error('[deletePageInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        pageId: request.pageId,
      },
    });
  }
}

/**
 * Page 복제 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns DuplicatePageResponse (성공) | Error (실패)
 */
export async function duplicatePageAction(
  request: unknown
): Promise<ActionResult<DuplicatePageResponse>> {
  // 1. Runtime Validation (필수)
  const parseResult = DuplicatePageRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to duplicatePageAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: DuplicatePageRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await duplicatePageInternal(validatedRequest, user);
  } catch (error) {
    console.error('[duplicatePageAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function duplicatePageInternal(
  request: DuplicatePageRequest,
  user: AuthenticatedUser
): Promise<ActionResult<DuplicatePageResponse>> {
  try {
    // 1. 의존성 주입
    const pageRepo = new DrizzlePageRepository();
    const memberRepo = new DrizzleWorkspaceMemberRepository();

    const service = new DefaultPageLifecycleService(pageRepo, memberRepo);

    // 2. Service 호출 (params 패턴)
    const result = await service.duplicatePage({
      pageId: new PageId(request.pageId),
      userId: user.id,
    });

    // 3. Result 처리
    if (!result.success) {
      return err(result.error, {
        code: result.error,
        meta: { details: `Failed to duplicate page: ${result.error}` },
      });
    }

    // 4. Aggregate → DTO 변환
    const aggregate = result.data;
    const responseData: DuplicatePageResponse = {
      pageId: aggregate.page.pageId.value,
    };

    // 5. 캐시 무효화
    revalidatePath('/r');

    return ok(responseData);
  } catch (error) {
    console.error('[duplicatePageInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        pageId: request.pageId,
      },
    });
  }
}
