'use server';

import { revalidatePath } from 'next/cache';
import { DrizzleWorkspaceRepository } from '../backend/repositories/implementations/drizzle-workspace.repository';
import { DrizzleWorkspaceMemberRepository } from '../backend/repositories/implementations/drizzle-workspace-member.repository';
import { DrizzleWorkspaceInvitationRepository } from '../backend/repositories/implementations/drizzle-workspace-invitation.repository';
import { DrizzleOrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization-member.repository';
import { DrizzleOrganizationRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository';
import { DefaultOrganizationQueryService } from '@/domains/organization-management/backend/services/organization-query.service';
import { DrizzleNotificationRepository } from '@/domains/notification-management/backend/repositories/implementations/drizzle-notification.repository';
import { NotificationService } from '@/domains/notification-management/backend/services/notification.service';
import { DefaultWorkspaceInvitationService } from '../backend/services';
import { WorkspaceId } from '../shared/value-objects/workspace-id.vo';
import type {
  InviteWorkspaceMemberResponse,
  OrganizationMemberSearchResultDTO,
  WorkspaceMemberView,
} from '../shared/dtos';
import {
  InviteWorkspaceMemberRequestSchema,
  ProcessInvitationRequestSchema,
  SearchOrganizationMembersRequestSchema,
  GetWorkspaceMembersRequestSchema,
  type InviteWorkspaceMemberRequest,
  type ProcessInvitationRequest,
  type SearchOrganizationMembersRequest,
  type GetWorkspaceMembersRequest,
} from '../shared/schemas/workspace-member.schemas';
import { ActionResult, ok, err } from '@/lib/action-result';
import {
  getAuthenticatedUser,
  type AuthenticatedUser,
} from '@/domains/common/auth/helpers';

/**
 * Workspace 멤버 초대 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns InviteWorkspaceMemberResponse (성공) | Error (실패)
 */
export async function inviteWorkspaceMemberAction(
  request: unknown
): Promise<ActionResult<InviteWorkspaceMemberResponse>> {
  // 1. Runtime Validation (필수)
  const parseResult = InviteWorkspaceMemberRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to inviteWorkspaceMemberAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: InviteWorkspaceMemberRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await inviteWorkspaceMemberInternal(validatedRequest, user);
  } catch (error) {
    console.error('[inviteWorkspaceMemberAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function inviteWorkspaceMemberInternal(
  request: InviteWorkspaceMemberRequest,
  user: AuthenticatedUser
): Promise<ActionResult<InviteWorkspaceMemberResponse>> {
  try {
    // 1. 의존성 주입
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
    const invitationRepo = new DrizzleWorkspaceInvitationRepository();

    // Organization Query Service (도메인 경계 유지)
    const orgMemberRepo = new DrizzleOrganizationMemberRepository();
    const orgRepo = new DrizzleOrganizationRepository();
    const orgQueryService = new DefaultOrganizationQueryService(
      orgRepo,
      orgMemberRepo
    );

    // Notification Service
    const notificationRepo = new DrizzleNotificationRepository();
    const notificationService = new NotificationService(notificationRepo);

    const service = new DefaultWorkspaceInvitationService(
      workspaceRepo,
      workspaceMemberRepo,
      orgQueryService,
      invitationRepo,
      notificationService
    );

    // 2. Service 호출
    const result = await service.inviteWorkspaceMembers(
      new WorkspaceId(request.workspaceId),
      request.memberEmails,
      user.id
    );

    if (!result.success) {
      return err(result.error, {
        code: 'INVITATION_FAILED',
      });
    }

    // 3. DTO 반환
    return ok({
      invitedCount: result.data,
    });
  } catch (error) {
    console.error('[inviteWorkspaceMemberInternal] Internal error:', error);
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
 * 조직 멤버 검색 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns OrganizationMemberSearchResultDTO[] (성공) | Error (실패)
 */
export async function searchOrganizationMembersAction(
  request: unknown
): Promise<ActionResult<OrganizationMemberSearchResultDTO[]>> {
  // 1. Runtime Validation (필수)
  const parseResult = SearchOrganizationMembersRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn(
      '[Security] Invalid request to searchOrganizationMembersAction',
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
  const validatedRequest = parseResult.data; // type: SearchOrganizationMembersRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await searchOrganizationMembersInternal(validatedRequest, user);
  } catch (error) {
    console.error(
      '[searchOrganizationMembersAction] Authentication error:',
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
async function searchOrganizationMembersInternal(
  request: SearchOrganizationMembersRequest,
  user: AuthenticatedUser
): Promise<ActionResult<OrganizationMemberSearchResultDTO[]>> {
  try {
    // 1. Repository 초기화
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const memberRepo = new DrizzleWorkspaceMemberRepository();
    const invitationRepo = new DrizzleWorkspaceInvitationRepository();
    const orgMemberRepo = new DrizzleOrganizationMemberRepository();

    // 2. Workspace 조회 (Organization ID 확인용)
    const workspaceId = new WorkspaceId(request.workspaceId);
    const workspace = await workspaceRepo.findById(workspaceId);

    if (!workspace) {
      return err('Workspace not found', {
        code: 'WORKSPACE_NOT_FOUND',
      });
    }

    // 3. 권한 확인: 워크스페이스 멤버인지 확인
    const isMember = await memberRepo.isMember(workspaceId, user.id);
    if (!isMember) {
      return err('User is not a member of this workspace', {
        code: 'NOT_WORKSPACE_MEMBER',
      });
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
    // Batch fetch instead of per-member queries
    const userIds = organizationMembers.map(m => m.userId);

    const membershipMap = await memberRepo.getMembershipStatusBatch(
      workspaceId,
      userIds
    );

    const pendingInvitations =
      await invitationRepo.findPendingInvitationsForUsers(workspaceId, userIds);
    const pendingSet = new Set(pendingInvitations.map(i => i.invitedUserId));

    // Then map results without additional queries
    const results: OrganizationMemberSearchResultDTO[] =
      organizationMembers.map(member => ({
        userId: member.userId,
        email: member.email,
        name: member.name,
        avatarUrl: member.profileImageUrl ?? null,
        isAlreadyMember: membershipMap.get(member.userId) ?? false,
        hasPendingInvitation: pendingSet.has(member.userId),
      }));

    return ok(results);
  } catch (error) {
    console.error('[searchOrganizationMembersInternal] Internal error:', error);
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
 * Workspace 초대 수락 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns void (성공) | Error (실패)
 */
export async function acceptWorkspaceInvitationAction(
  request: unknown
): Promise<ActionResult<void>> {
  // 1. Runtime Validation (필수)
  const parseResult = ProcessInvitationRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn(
      '[Security] Invalid request to acceptWorkspaceInvitationAction',
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
  const validatedRequest = parseResult.data; // type: ProcessInvitationRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await acceptWorkspaceInvitationInternal(validatedRequest, user);
  } catch (error) {
    console.error(
      '[acceptWorkspaceInvitationAction] Authentication error:',
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
async function acceptWorkspaceInvitationInternal(
  request: ProcessInvitationRequest,
  user: AuthenticatedUser
): Promise<ActionResult<void>> {
  try {
    // 1. 의존성 주입
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
    const invitationRepo = new DrizzleWorkspaceInvitationRepository();

    // Organization Query Service (도메인 경계 유지)
    const orgMemberRepo = new DrizzleOrganizationMemberRepository();
    const orgRepo = new DrizzleOrganizationRepository();
    const orgQueryService = new DefaultOrganizationQueryService(
      orgRepo,
      orgMemberRepo
    );

    // Notification Service
    const notificationRepo = new DrizzleNotificationRepository();
    const notificationService = new NotificationService(notificationRepo);

    const service = new DefaultWorkspaceInvitationService(
      workspaceRepo,
      workspaceMemberRepo,
      orgQueryService,
      invitationRepo,
      notificationService
    );

    // 2. Service 호출
    const result = await service.acceptWorkspaceInvitation(
      request.invitationId,
      user.id
    );

    if (!result.success) {
      return err(result.error, {
        code: 'ACCEPT_INVITATION_FAILED',
      });
    }

    // 3. 캐시 무효화 (사이드바 Workspace 목록 갱신)
    revalidatePath('/r');

    return ok(undefined);
  } catch (error) {
    console.error('[acceptWorkspaceInvitationInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * Workspace 초대 거절 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns void (성공) | Error (실패)
 */
export async function rejectWorkspaceInvitationAction(
  request: unknown
): Promise<ActionResult<void>> {
  // 1. Runtime Validation (필수)
  const parseResult = ProcessInvitationRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn(
      '[Security] Invalid request to rejectWorkspaceInvitationAction',
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
  const validatedRequest = parseResult.data; // type: ProcessInvitationRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await rejectWorkspaceInvitationInternal(validatedRequest, user);
  } catch (error) {
    console.error(
      '[rejectWorkspaceInvitationAction] Authentication error:',
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
async function rejectWorkspaceInvitationInternal(
  request: ProcessInvitationRequest,
  user: AuthenticatedUser
): Promise<ActionResult<void>> {
  try {
    // 1. 의존성 주입
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
    const invitationRepo = new DrizzleWorkspaceInvitationRepository();

    // Organization Query Service (도메인 경계 유지)
    const orgMemberRepo = new DrizzleOrganizationMemberRepository();
    const orgRepo = new DrizzleOrganizationRepository();
    const orgQueryService = new DefaultOrganizationQueryService(
      orgRepo,
      orgMemberRepo
    );

    // Notification Service
    const notificationRepo = new DrizzleNotificationRepository();
    const notificationService = new NotificationService(notificationRepo);

    const service = new DefaultWorkspaceInvitationService(
      workspaceRepo,
      workspaceMemberRepo,
      orgQueryService,
      invitationRepo,
      notificationService
    );

    // 2. Service 호출
    const result = await service.rejectWorkspaceInvitation(
      request.invitationId,
      user.id
    );

    if (!result.success) {
      return err(result.error, {
        code: 'REJECT_INVITATION_FAILED',
      });
    }

    // 3. 캐시 무효화 (사이드바 Workspace 목록 갱신)
    revalidatePath('/r');

    return ok(undefined);
  } catch (error) {
    console.error('[rejectWorkspaceInvitationInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * Workspace 멤버 목록 조회 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns WorkspaceMemberView (성공) | Error (실패)
 */
export async function getWorkspaceMembersAction(
  request: unknown
): Promise<ActionResult<WorkspaceMemberView>> {
  // 1. Runtime Validation (필수)
  const parseResult = GetWorkspaceMembersRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to getWorkspaceMembersAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: GetWorkspaceMembersRequest

  // 3. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. Internal 함수 호출
    return await getWorkspaceMembersInternal(validatedRequest, user);
  } catch (error) {
    console.error('[getWorkspaceMembersAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function getWorkspaceMembersInternal(
  request: GetWorkspaceMembersRequest,
  user: AuthenticatedUser
): Promise<ActionResult<WorkspaceMemberView>> {
  try {
    // 1. Repository 초기화
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const memberRepo = new DrizzleWorkspaceMemberRepository();
    const invitationRepo = new DrizzleWorkspaceInvitationRepository();

    // 2. Workspace 조회
    const workspace = await workspaceRepo.findById(
      new WorkspaceId(request.workspaceId)
    );

    if (!workspace) {
      return err('Workspace not found', {
        code: 'WORKSPACE_NOT_FOUND',
      });
    }

    // 3. 권한 확인: 워크스페이스 멤버인지 확인
    const isMember = await memberRepo.isMember(
      new WorkspaceId(request.workspaceId),
      user.id
    );
    if (!isMember) {
      return err('User is not a member of this workspace', {
        code: 'NOT_WORKSPACE_MEMBER',
      });
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

    return ok(memberView);
  } catch (error) {
    console.error('[getWorkspaceMembersInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        workspaceId: request.workspaceId,
      },
    });
  }
}
