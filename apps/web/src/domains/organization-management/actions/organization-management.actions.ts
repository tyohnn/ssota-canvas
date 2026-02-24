// apps/web/src/domains/organization-management/actions/organization-management.actions.ts
'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { getAuthenticatedUserOrRedirect } from '@/domains/common/auth/server-auth.helpers';
import { DrizzleNotificationRepository } from '@/domains/notification-management/backend/repositories/implementations/drizzle-notification.repository';
import { NotificationService } from '@/domains/notification-management/backend/services/notification.service';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace-member.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { DefaultWorkspaceCrudService } from '@/domains/workspace-management/backend/services/workspace-crud.service';
import { createClient } from '@/utils/supabase/server';
import { isRedirectError } from '@/utils/next-redirect';

import { DrizzleInvitationRepository } from '../backend/repositories/implementations/drizzle-invitation.repository';
import { DrizzleOrganizationMemberRepository } from '../backend/repositories/implementations/drizzle-organization-member.repository';
import { DrizzleOrganizationRepository } from '../backend/repositories/implementations/drizzle-organization.repository';
import { DefaultOrganizationCrudService } from '../backend/services/organization-crud.service';
import { DefaultOrganizationInvitationService } from '../backend/services/organization-invitation.service';
import { DefaultOrganizationMemberService } from '../backend/services/organization-member.service';
import {
  AcceptInvitationCommand,
  ChangeMemberRoleCommand,
  CreateDefaultOrganizationCommand,
  CreateOrganizationCommand,
  GetUserOrganizationsCommand,
  RejectInvitationCommand,
  RequestMemberInvitationCommand,
} from '../shared/commands';
import {
  CreateOrganizationRequest,
  CreateOrganizationResult,
  InviteMemberRequest,
  OrganizationMemberView,
  OrganizationSummary,
  RespondToInvitationRequest,
  UserProfile,
} from '../shared/dtos';

export async function getUserOrganizationsAction(): Promise<
  OrganizationSummary[]
> {
  // 1. 인증 확인 (미인증 시 로그인으로 리다이렉트 - server-auth.helpers 사용)
  const user = await getAuthenticatedUserOrRedirect(
    'Please log in to continue.'
  );

  try {
    // 2. Repository 인스턴스 생성
    const organizationRepository = new DrizzleOrganizationRepository();
    const organizationMemberRepository =
      new DrizzleOrganizationMemberRepository();

    // 3. Service 생성 (OrganizationCrudService)
    const crudService = new DefaultOrganizationCrudService(
      organizationRepository,
      organizationMemberRepository,
      null as any // workspaceCrudService는 조회에 불필요
    );

    // 4. Command 생성
    const command: GetUserOrganizationsCommand = {
      userId: user.id,
    };

    // 5. 도메인 로직 실행
    const result = await crudService.getUserOrganizations(command);

    if (result.isError()) {
      console.error('[getUserOrganizationsAction] Failed:', {
        code: result.error.code,
        message: result.error.message,
      });
      throw new Error(result.error.message);
    }

    return result.value;
  } catch (error) {
    // NEXT_REDIRECT는 예상된 동작이므로 로깅하지 않고 그대로 rethrow
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('[getUserOrganizationsAction] Error:', error);
    throw error;
  }
}

const createDefaultOrganizationSchema = z.object({
  organizationName: z.string().min(1).max(255),
});

/**
 * 기본 조직 생성 (is_default=true)
 * - 사용자 가입 시 자동 호출
 * - Default Workspace + Welcome 페이지 자동 생성
 * - 생성 완료 후 리다이렉션 URL 반환
 */
export async function createDefaultOrganizationAction(
  input: z.infer<typeof createDefaultOrganizationSchema>
): Promise<{
  organization: OrganizationSummary;
  workspace: { id: string; name: string; isDefault: boolean };
  page: { id: string; title: string; icon: string | null };
  personalWorkspace: { id: string; name: string; isDefault: boolean }; // v1.2
  personalPage: { id: string; title: string; icon: string | null }; // v1.2
  redirectUrl: string;
}> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error('Authentication required');
    }

    // 2. Input validation
    const validatedInput = createDefaultOrganizationSchema.parse(input);

    // 3. Repository 인스턴스 생성
    const organizationRepository = new DrizzleOrganizationRepository();
    const organizationMemberRepository =
      new DrizzleOrganizationMemberRepository();

    // Workspace Management Domain Repositories
    const workspaceRepository = new DrizzleWorkspaceRepository();
    const pageRepository = new DrizzlePageRepository();
    const workspaceMemberRepository = new DrizzleWorkspaceMemberRepository();

    // 4. Workspace Service 생성
    const workspaceCrudService = new DefaultWorkspaceCrudService(
      workspaceRepository,
      pageRepository,
      workspaceMemberRepository,
      organizationMemberRepository
    );

    // 5. Organization CRUD Service 생성
    const crudService = new DefaultOrganizationCrudService(
      organizationRepository,
      organizationMemberRepository,
      workspaceCrudService
    );

    // 6. Command 생성
    const command: CreateDefaultOrganizationCommand = {
      userId: user.id,
      organizationName: validatedInput.organizationName,
    };

    // 7. 도메인 로직 실행 (트랜잭션: 조직 → 워크스페이스 → 페이지)
    const result = await crudService.createDefaultOrganization(command);

    if (result.isError()) {
      throw new Error(result.error.message);
    }

    // 7. 관련 페이지 재검증
    revalidatePath('/dashboard');
    revalidatePath('/organizations');
    revalidatePath('/r');

    return result.value;
  } catch (error) {
    console.error('[createDefaultOrganizationAction] Error:', error);
    throw error;
  }
}

const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, '조직명은 필수입니다')
    .max(255, '조직명은 255자를 초과할 수 없습니다'),
  organizationType: z.enum(
    ['personal', 'education', 'startup', 'agency', 'company', 'n/a'],
    {
      message: '올바른 조직 타입을 선택해주세요',
    }
  ),
});

/**
 * 일반 조직 생성 (is_default=false)
 * - 사용자가 수동으로 생성
 * - Default Workspace + Untitled 페이지 자동 생성
 * - 생성 완료 후 조직, 워크스페이스, 페이지 정보 반환
 */
export async function createOrganizationAction(
  input: CreateOrganizationRequest
): Promise<CreateOrganizationResult> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // 2. Input validation
    const validationResult = createOrganizationSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid input',
      };
    }

    const validatedInput = validationResult.data;

    // 3. Repository 인스턴스 생성
    const organizationRepository = new DrizzleOrganizationRepository();
    const organizationMemberRepository =
      new DrizzleOrganizationMemberRepository();

    // Workspace Management Domain Repositories
    const workspaceRepository = new DrizzleWorkspaceRepository();
    const pageRepository = new DrizzlePageRepository();
    const workspaceMemberRepository = new DrizzleWorkspaceMemberRepository();

    // 4. Workspace Service 생성
    const workspaceCrudService = new DefaultWorkspaceCrudService(
      workspaceRepository,
      pageRepository,
      workspaceMemberRepository,
      organizationMemberRepository
    );

    // 5. Organization CRUD Service 생성
    const crudService = new DefaultOrganizationCrudService(
      organizationRepository,
      organizationMemberRepository,
      workspaceCrudService
    );

    // 6. Command 생성
    const command: CreateOrganizationCommand = {
      name: validatedInput.name,
      organizationType: validatedInput.organizationType,
      ownerId: user.id,
    };

    // 7. 도메인 로직 실행 (트랜잭션: 조직 → 워크스페이스 → 페이지)
    const result = await crudService.createOrganization(command);

    if (result.isError()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    // 7. 관련 페이지 재검증
    revalidatePath('/dashboard');
    revalidatePath('/organizations');
    revalidatePath('/r');

    return {
      success: true,
      organization: {
        id: result.value.organization.id,
        name: result.value.organization.name,
        organizationType: result.value.organization.organizationType!,
        isDefault: result.value.organization.isDefault,
        createdAt: result.value.organization.createdAt,
      },
      workspace: result.value.workspace,
      page: result.value.page,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create organization',
    };
  }
}

// Invite Member Action
export async function inviteMemberAction(
  input: InviteMemberRequest
): Promise<void> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error('Authentication required');
    }

    // 2. Repository 인스턴스 생성
    const organizationRepository = new DrizzleOrganizationRepository();
    const invitationRepository = new DrizzleInvitationRepository();
    const organizationMemberRepository =
      new DrizzleOrganizationMemberRepository();

    // 3. Workspace Management Domain Repositories
    const workspaceRepository = new DrizzleWorkspaceRepository();
    const pageRepository = new DrizzlePageRepository();
    const workspaceMemberRepository = new DrizzleWorkspaceMemberRepository();

    // 4. Workspace CRUD Service 생성
    const workspaceCrudService = new DefaultWorkspaceCrudService(
      workspaceRepository,
      pageRepository,
      workspaceMemberRepository,
      organizationMemberRepository
    );

    // 5. Notification Service 생성 (Notification Management Domain과 통합)
    const notificationRepository = new DrizzleNotificationRepository();
    const notificationService = new NotificationService(notificationRepository);

    // 6. Organization Invitation Service 생성
    const invitationService = new DefaultOrganizationInvitationService(
      organizationRepository,
      invitationRepository,
      organizationMemberRepository,
      workspaceCrudService, // v1.2
      notificationService
    );

    // 7. Get inviter name from profile
    const userProfiles =
      await organizationMemberRepository.searchUserProfileByEmail(
        user.email || ''
      );
    const inviterName =
      userProfiles.length > 0 && userProfiles[0]?.name
        ? userProfiles[0].name
        : user.email || 'Someone';

    // 8. Command 생성
    const command: RequestMemberInvitationCommand = {
      organizationId: input.organizationId,
      inviterUserId: user.id,
      inviterName: inviterName,
      inviteeEmail: input.inviteeEmail,
      role: input.role,
    };

    // 9. 도메인 로직 실행
    const result = await invitationService.inviteMember(command);

    if (result.isError()) {
      console.error('[inviteMemberAction] Error:', result.error);
      throw new Error(result.error.message);
    }

    // 5. Notification은 Service Layer에서 생성됨 (Notification Management Domain 통합)
    // Policy: "Whenever 멤버 초대 요청함, then always 멤버 초대 알림 추가"

    // 6. 관련 페이지 재검증
    revalidatePath('/dashboard');
    revalidatePath(`/organizations/${input.organizationId}`);
  } catch (error) {
    throw error;
  }
}

// Respond to Invitation Action
export async function respondToInvitationAction(
  input: RespondToInvitationRequest
): Promise<void> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error(
        '[respondToInvitationAction] Authentication failed:',
        error
      );
      throw new Error('Authentication required');
    }

    // 2. Repository 인스턴스 생성
    const organizationRepository = new DrizzleOrganizationRepository();
    const invitationRepository = new DrizzleInvitationRepository();
    const organizationMemberRepository =
      new DrizzleOrganizationMemberRepository();

    // 3. Workspace Management Domain Repositories
    const workspaceRepository = new DrizzleWorkspaceRepository();
    const pageRepository = new DrizzlePageRepository();
    const workspaceMemberRepository = new DrizzleWorkspaceMemberRepository();

    // 4. Workspace CRUD Service 생성
    const workspaceCrudService = new DefaultWorkspaceCrudService(
      workspaceRepository,
      pageRepository,
      workspaceMemberRepository,
      organizationMemberRepository
    );

    // 5. Notification Service 생성
    const notificationRepository = new DrizzleNotificationRepository();
    const notificationService = new NotificationService(notificationRepository);

    // 6. Organization Invitation Service 생성
    const invitationService = new DefaultOrganizationInvitationService(
      organizationRepository,
      invitationRepository,
      organizationMemberRepository,
      workspaceCrudService, // v1.2
      notificationService
    );

    // 7. Command 생성 및 실행
    if (input.accept) {
      const command: AcceptInvitationCommand = {
        invitationId: input.invitationId,
        inviteeUserId: user.id,
      };

      const result = await invitationService.acceptInvitation(command);

      if (result.isError()) {
        console.error('[respondToInvitationAction] Accept failed:', {
          code: result.error.code,
          message: result.error.message,
        });
        throw new Error(result.error.message);
      }
    } else {
      const command: RejectInvitationCommand = {
        invitationId: input.invitationId,
        inviteeUserId: user.id,
      };

      const result = await invitationService.rejectInvitation(command);

      if (result.isError()) {
        console.error('[respondToInvitationAction] Reject failed:', {
          code: result.error.code,
          message: result.error.message,
        });
        throw new Error(result.error.message);
      }
    }

    // 4. 관련 페이지 재검증
    revalidatePath('/dashboard');
    revalidatePath('/notifications');
  } catch (error) {
    console.error('[respondToInvitationAction] Error:', error);
    throw error;
  }
}

// Get Organization Members Action
export async function getOrganizationMembersAction(
  organizationId: string
): Promise<OrganizationMemberView> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error('Authentication required');
    }

    // 2. Repository를 통한 조회 (Code Convention 준수)
    const memberRepository = new DrizzleOrganizationMemberRepository();
    const memberView = await memberRepository.getOrganizationMemberView(
      organizationId,
      user.id
    );

    return memberView;
  } catch (error) {
    throw error;
  }
}

// Search User by Email Action
export async function searchUserByEmailAction(
  email: string
): Promise<UserProfile[]> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // 2. Repository를 통한 조회 (Code Convention 준수)
    const memberRepository = new DrizzleOrganizationMemberRepository();
    const userProfiles = await memberRepository.searchUserProfileByEmail(email);

    return userProfiles;
  } catch (error) {
    throw error;
  }
}

// Change Member Role Action (Scenario 3)
export async function changeMemberRoleAction(data: {
  organizationId: string;
  targetUserId: string;
  newRole: 'admin' | 'member';
}): Promise<void> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error('Authentication required');
    }

    // 2. Repository 인스턴스 생성
    const organizationRepository = new DrizzleOrganizationRepository();
    const organizationMemberRepository =
      new DrizzleOrganizationMemberRepository();

    // 3. Organization Member Service 생성
    const memberService = new DefaultOrganizationMemberService(
      organizationRepository,
      organizationMemberRepository
    );

    // 4. Command 생성
    const command: ChangeMemberRoleCommand = {
      organizationId: data.organizationId,
      userId: data.targetUserId,
      newRole: data.newRole,
      requesterId: user.id,
    };

    // 5. 도메인 로직 실행
    const result = await memberService.changeMemberRole(command);

    if (result.isError()) {
      console.error('[changeMemberRoleAction] Failed:', {
        code: result.error.code,
        message: result.error.message,
      });
      throw new Error(result.error.message);
    }

    // 5. 관련 페이지 재검증
    revalidatePath('/dashboard');
    revalidatePath(`/organization/${data.organizationId}/members`);

    console.log('[changeMemberRoleAction] Success:', {
      eventType: result.value.type,
      targetUserId: data.targetUserId,
      newRole: data.newRole,
    });
  } catch (error) {
    console.error('[changeMemberRoleAction] Error:', error);
    throw error;
  }
}
