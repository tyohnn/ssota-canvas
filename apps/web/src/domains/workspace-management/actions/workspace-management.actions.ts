// apps/web/src/domains/workspace-management/actions/workspace-management.actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { DrizzleWorkspaceRepository } from '../backend/repositories/implementations/drizzle-workspace.repository';
import { DrizzlePageRepository } from '../backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '../backend/repositories/implementations/drizzle-workspace-member.repository';
import { DrizzleWorkspaceInvitationRepository } from '../backend/repositories/implementations/drizzle-workspace-invitation.repository';
import { DrizzleOrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization-member.repository';
import { DrizzleOrganizationRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository';
import { DrizzleNotificationRepository } from '@/domains/notification-management/backend/repositories/implementations/drizzle-notification.repository';
import { DefaultWorkspaceManagementService } from '../backend/services/workspace-management.service';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
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
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  UpdateWorkspaceInfoRequest,
  InviteWorkspaceMemberRequest,
  InviteWorkspaceMemberResponse,
  ProcessInvitationRequest,
  SearchOrganizationMembersRequest,
  OrganizationMemberSearchResultDTO,
  GetWorkspaceMembersRequest,
  WorkspaceMemberView,
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
    const orgRepo = new DrizzleOrganizationRepository();

    const service = new DefaultWorkspaceManagementService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo,
      orgRepo
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
        description: ws.description,
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
    const orgRepo = new DrizzleOrganizationRepository();

    const service = new DefaultWorkspaceManagementService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo,
      orgRepo
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
 * Workspace 생성 Server Action (Scenario 2)
 *
 * 트랜잭션:
 * 1. Workspace 생성
 * 2. 생성자를 Workspace 멤버로 추가
 * 3. 초기 "Untitled" 페이지 생성
 *
 * @param request - Workspace 생성 요청
 * @returns CreateWorkspaceResponse (성공) | Error (실패)
 */
export async function createWorkspaceAction(
  request: CreateWorkspaceRequest
): Promise<ServerActionResult<CreateWorkspaceResponse>> {
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

    // 2. 입력 검증
    if (!request.name || request.name.trim().length === 0) {
      return {
        success: false,
        error: 'INVALID_WORKSPACE_NAME',
        details: 'Workspace name is required',
      };
    }

    // 3. 의존성 주입
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const pageRepo = new DrizzlePageRepository();
    const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
    const orgMemberRepo = new DrizzleOrganizationMemberRepository();
    const orgRepo = new DrizzleOrganizationRepository();

    const service = new DefaultWorkspaceManagementService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo,
      orgRepo
    );

    // 4. Service 호출 (트랜잭션: Workspace + 초기 Page 생성)
    const result = await service.createWorkspace(
      new OrganizationId(request.organizationId),
      request.name,
      request.description || null,
      request.icon || null,
      user.id
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // 5. DTO 반환
    const response: CreateWorkspaceResponse = {
      workspaceId: result.data.workspaceId,
      firstPageId: result.data.firstPageId,
    };

    // 6. 캐시 무효화
    revalidatePath(`/r/${request.organizationId}`);

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('[createWorkspaceAction] Error:', error);
    return {
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Workspace 정보 수정 Server Action (Scenario 2)
 *
 * @param request - Workspace 정보 수정 요청
 * @returns void (성공) | Error (실패)
 */
export async function updateWorkspaceInfoAction(
  request: UpdateWorkspaceInfoRequest
): Promise<ServerActionResult<void>> {
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
    const orgRepo = new DrizzleOrganizationRepository();

    const service = new DefaultWorkspaceManagementService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo,
      orgRepo
    );

    // 3. Service 호출
    const result = await service.updateWorkspaceInfo(
      new WorkspaceId(request.workspaceId),
      request.name,
      request.description,
      request.icon,
      user.id
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // 4. 캐시 무효화 (사이드바 Workspace 목록 갱신)
    const workspace = await workspaceRepo.findById(
      new WorkspaceId(request.workspaceId)
    );
    if (workspace) {
      revalidatePath(`/r/${workspace.organizationId.value}`);
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('[updateWorkspaceInfoAction] Error:', error);
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

// ────────────────────────────────────────────────────────────
// Scenario 3: Workspace 멤버 초대 및 수락/거절
// ────────────────────────────────────────────────────────────

/**
 * Workspace 멤버 초대 Server Action (Scenario 3)
 *
 * @param request - Workspace ID 및 초대할 멤버 이메일 배열
 * @returns 초대한 멤버 수 (성공) | Error (실패)
 */
export async function inviteWorkspaceMemberAction(
  request: InviteWorkspaceMemberRequest
): Promise<ServerActionResult<InviteWorkspaceMemberResponse>> {
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

    // 2. 입력 검증
    if (!request.memberEmails || request.memberEmails.length === 0) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        details: 'No member emails provided',
      };
    }

    // 3. 의존성 주입
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const pageRepo = new DrizzlePageRepository();
    const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
    const orgMemberRepo = new DrizzleOrganizationMemberRepository();
    const orgRepo = new DrizzleOrganizationRepository();
    const invitationRepo = new DrizzleWorkspaceInvitationRepository();
    const notificationRepo = new DrizzleNotificationRepository();

    const service = new DefaultWorkspaceManagementService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo,
      orgRepo,
      invitationRepo,
      notificationRepo
    );

    // 4. Service 호출
    const result = await service.inviteWorkspaceMembers(
      new WorkspaceId(request.workspaceId),
      request.memberEmails,
      user.id
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // 5. DTO 반환
    return {
      success: true,
      data: {
        invitedCount: result.data,
      },
    };
  } catch (error) {
    console.error('[inviteWorkspaceMemberAction] Error:', error);
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 조직 멤버 검색 Server Action (Scenario 3)
 *
 * @param request - Workspace ID 및 검색 쿼리
 * @returns 조직 멤버 검색 결과 배열
 */
export async function searchOrganizationMembersAction(
  request: SearchOrganizationMembersRequest
): Promise<ServerActionResult<OrganizationMemberSearchResultDTO[]>> {
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

    // 2. Repository 초기화
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const memberRepo = new DrizzleWorkspaceMemberRepository();
    const invitationRepo = new DrizzleWorkspaceInvitationRepository();
    const orgMemberRepo = new DrizzleOrganizationMemberRepository();

    // 3. Workspace 조회 (Organization ID 확인용)
    const workspaceId = new WorkspaceId(request.workspaceId);
    const workspace = await workspaceRepo.findById(workspaceId);

    if (!workspace) {
      return {
        success: false,
        error: 'WORKSPACE_NOT_FOUND',
        details: 'Workspace not found',
      };
    }

    // 4. Organization 멤버 중 이메일로 검색 (효율적: JOIN 쿼리 1번)
    // 이전: 전체 사용자 검색 → 각 사용자마다 Organization 멤버십 확인 (N+1 문제)
    // 개선: Organization 멤버를 JOIN하여 한 번에 조회
    const organizationMembers =
      await orgMemberRepo.searchOrganizationMembersByEmail(
        workspace.organizationId.value,
        request.query
      );

    // 5. Workspace 멤버십 + pending 초대 확인 후 결과 반환
    const results: OrganizationMemberSearchResultDTO[] = [];

    for (const member of organizationMembers) {
      // Workspace 멤버인지 확인
      const isWorkspaceMember = await memberRepo.isMember(
        new WorkspaceId(request.workspaceId),
        member.userId
      );

      // Pending 초대가 있는지 확인
      const pendingInvitation = await invitationRepo.findInvitation(
        new WorkspaceId(request.workspaceId),
        member.userId,
        'pending'
      );

      results.push({
        userId: member.userId,
        email: member.email,
        name: member.name,
        avatarUrl: member.profileImageUrl ?? null,
        isAlreadyMember: isWorkspaceMember,
        hasPendingInvitation: pendingInvitation !== null,
      });
    }

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error('[searchOrganizationMembersAction] Error:', error);
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Workspace 초대 수락 Server Action (Scenario 3)
 *
 * @param request - 초대 ID
 * @returns void (성공) | Error (실패)
 */
export async function acceptWorkspaceInvitationAction(
  request: ProcessInvitationRequest
): Promise<ServerActionResult<void>> {
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
    const orgRepo = new DrizzleOrganizationRepository();
    const invitationRepo = new DrizzleWorkspaceInvitationRepository();

    const service = new DefaultWorkspaceManagementService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo,
      orgRepo,
      invitationRepo
    );

    // 3. Service 호출
    const result = await service.acceptWorkspaceInvitation(
      request.invitationId,
      user.id
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // 4. 캐시 무효화 (사이드바 Workspace 목록 갱신)
    revalidatePath('/r');

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('[acceptWorkspaceInvitationAction] Error:', error);
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Workspace 초대 거절 Server Action (Scenario 3)
 *
 * @param request - 초대 ID
 * @returns void (성공) | Error (실패)
 */
export async function rejectWorkspaceInvitationAction(
  request: ProcessInvitationRequest
): Promise<ServerActionResult<void>> {
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
    const orgRepo = new DrizzleOrganizationRepository();
    const invitationRepo = new DrizzleWorkspaceInvitationRepository();

    const service = new DefaultWorkspaceManagementService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo,
      orgRepo,
      invitationRepo
    );

    // 3. Service 호출
    const result = await service.rejectWorkspaceInvitation(
      request.invitationId,
      user.id
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('[rejectWorkspaceInvitationAction] Error:', error);
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Workspace 멤버 목록 조회 Server Action
 *
 * @param request - Workspace ID
 * @returns WorkspaceMemberView (성공) | Error (실패)
 */
export async function getWorkspaceMembersAction(
  request: GetWorkspaceMembersRequest
): Promise<ServerActionResult<WorkspaceMemberView>> {
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

    // 2. Repository 초기화
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const memberRepo = new DrizzleWorkspaceMemberRepository();
    const invitationRepo = new DrizzleWorkspaceInvitationRepository();

    // 3. Workspace 조회
    const workspace = await workspaceRepo.findById(
      new WorkspaceId(request.workspaceId)
    );

    if (!workspace) {
      return {
        success: false,
        error: 'WORKSPACE_NOT_FOUND',
        details: 'Workspace not found',
      };
    }

    // 4. 멤버 목록 조회
    const members = await memberRepo.findByWorkspaceId(
      new WorkspaceId(request.workspaceId)
    );

    // 5. 대기 중인 초대 목록 조회 (Profile JOIN)
    const pendingInvitations =
      await invitationRepo.findPendingByWorkspaceWithProfiles(
        new WorkspaceId(request.workspaceId)
      );

    // 6. DTO 변환
    const memberView: WorkspaceMemberView = {
      workspaceId: request.workspaceId,
      workspaceName: workspace.name,
      currentMembers: members.map(member => ({
        userId: member.userId,
        name: member.name,
        email: member.email,
        profileImageUrl: member.profileImageUrl,
        joinedAt: member.joinedAt.toISOString(),
      })),
      pendingInvitations: pendingInvitations.map(inv => ({
        id: inv.id.value,
        invitedUserId: inv.invitedUserId,
        invitedUserName: inv.invitedUserName,
        invitedUserEmail: inv.invitedUserEmail,
        inviterName: inv.inviterName,
        createdAt: inv.createdAt.toISOString(),
      })),
    };

    return {
      success: true,
      data: memberView,
    };
  } catch (error) {
    console.error('[getWorkspaceMembersAction] Error:', error);
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
