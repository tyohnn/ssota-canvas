// apps/web/src/domains/workspace-management/actions/workspace-management.actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { DrizzleWorkspaceRepository } from '../backend/repositories/implementations/drizzle-workspace.repository';
import { DrizzlePageRepository } from '../backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '../backend/repositories/implementations/drizzle-workspace-member.repository';
import { DrizzleOrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization-member.repository';
import { DefaultWorkspaceManagementService } from '../backend/services/workspace-management.service';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '../shared/value-objects/workspace-id.vo';
import { PageId } from '../shared/value-objects/page-id.vo';
import type {
  GetWorkspacePagesRequest,
  GetPageDetailsRequest,
  OrganizationWorkspacePageViewDTO,
  PageAccessResultDTO,
  ServerActionResult,
  PageTreeNodeDTO,
  WorkspaceWithPagesDTO,
} from '../shared/dtos';
import type { Page } from '../shared/entities/page.entity';

/**
 * 조직의 Workspace-Page 목록 조회 Server Action
 *
 * @param request - 조직 ID 및 쿠키 페이지 ID
 * @returns OrganizationWorkspacePageViewDTO (성공) | Error (실패)
 */
export async function getOrganizationWorkspacePageViewAction(
  request: GetWorkspacePagesRequest
): Promise<ServerActionResult<OrganizationWorkspacePageViewDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        details: 'User not authenticated',
      };
    }

    // 2. 의존성 주입
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const pageRepo = new DrizzlePageRepository();
    const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
    const orgMemberRepo = new DrizzleOrganizationMemberRepository();

    const service = new DefaultWorkspaceManagementService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo
    );

    // 3. Service 호출
    const result = await service.getOrganizationWorkspacePageView(
      new OrganizationId(request.organizationId),
      user.id,
      request.cookiePageId
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // 4. Domain Entity → DTO 변환
    const dto: OrganizationWorkspacePageViewDTO = {
      organizationId: result.data.organizationId,
      workspaces: result.data.workspaces.map(ws => ({
        workspaceId: ws.workspaceId,
        name: ws.name,
        icon: ws.icon,
        isDefault: ws.isDefault,
        pageTree: buildPageTreeDTO(ws.pageTree),
        pageCount: ws.pageCount,
      })),
      selectedPageId: result.data.selectedPageId ?? null,
    };

    return {
      success: true,
      data: dto,
    };
  } catch (error) {
    console.error('[getOrganizationWorkspacePageViewAction] Error:', error);
    return {
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Page 상세 정보 조회 Server Action
 *
 * @param request - 조직 ID, Workspace ID, Page ID
 * @returns PageAccessResultDTO (성공) | Error (실패)
 */
export async function getPageDetailsAction(
  request: GetPageDetailsRequest
): Promise<ServerActionResult<PageAccessResultDTO>> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        details: 'User not authenticated',
      };
    }

    // 2. 의존성 주입
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const pageRepo = new DrizzlePageRepository();
    const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
    const orgMemberRepo = new DrizzleOrganizationMemberRepository();

    const service = new DefaultWorkspaceManagementService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo
    );

    // 3. Service 호출 (권한 검증 포함)
    const result = await service.verifyPageAccess(
      new OrganizationId(request.organizationId),
      new WorkspaceId(request.workspaceId),
      new PageId(request.pageId),
      user.id
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // 4. Workspace 정보 조회 (DTO에 포함)
    const workspace = await workspaceRepo.findById(
      new WorkspaceId(request.workspaceId)
    );

    // 5. Domain Entity → DTO 변환
    const dto: PageAccessResultDTO = {
      pageId: result.data.page.pageId.value,
      title: result.data.page.title,
      icon: result.data.page.icon,
      workspaceId: result.data.page.workspaceId.value,
      workspaceName: workspace?.name || 'Unknown Workspace',
      userRole: result.data.userRole,
    };

    return {
      success: true,
      data: dto,
    };
  } catch (error) {
    console.error('[getPageDetailsAction] Error:', error);
    return {
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Page Entity 배열 → PageTreeNodeDTO 변환 (재귀 구조)
 *
 * @param pages - Page Entity 배열 (flat, depth/order 정렬됨)
 * @returns PageTreeNodeDTO 배열 (재귀 트리)
 */
function buildPageTreeDTO(pages: Page[]): PageTreeNodeDTO[] {
  const pageMap = new Map<string, PageTreeNodeDTO>();
  const rootNodes: PageTreeNodeDTO[] = [];

  // 1. 모든 페이지를 DTO로 변환하고 Map에 저장
  for (const page of pages) {
    const dto: PageTreeNodeDTO = {
      id: page.pageId.value,
      title: page.title,
      icon: page.icon,
      children: [],
      depth: page.depth,
      isFavorite: false, // TODO: page_favorites 테이블 조인 필요
      lastModified:
        page.updatedAt instanceof Date
          ? page.updatedAt.toISOString()
          : page.updatedAt,
      parentId: page.parentId?.value || null,
      order: page.order,
    };
    pageMap.set(page.pageId.value, dto);
  }

  // 2. 부모-자식 관계 구성 (재귀 트리)
  for (const page of pages) {
    const dto = pageMap.get(page.pageId.value)!;
    if (page.parentId) {
      const parent = pageMap.get(page.parentId.value);
      if (parent) {
        parent.children.push(dto);
      } else {
        // 부모가 없으면 root로 취급 (안전장치)
        rootNodes.push(dto);
      }
    } else {
      // 최상위 페이지 (parentId === null)
      rootNodes.push(dto);
    }
  }

  return rootNodes;
}
