// apps/web/src/domains/organization-management/actions/organization-management.actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { DrizzleOrganizationRepository } from '../backend/repositories/implementations/drizzle-organization.repository';
import { DrizzleInvitationRepository } from '../backend/repositories/implementations/drizzle-invitation.repository';
import { DrizzleOrganizationMemberRepository } from '../backend/repositories/implementations/drizzle-organization-member.repository';
import { OrganizationManagementService } from '../backend/services/organization-management.service';
import { DrizzleNotificationRepository } from '@/domains/notification-management/backend/repositories/implementations/drizzle-notification.repository';
import { NotificationService } from '@/domains/notification-management/backend/services/notification.service';
import {
  CreateDefaultOrganizationCommand,
  CreateNewOrganizationCommand,
  GetUserOrganizationsCommand,
  RequestMemberInvitationCommand,
  AcceptInvitationCommand,
  RejectInvitationCommand,
  ChangeMemberRoleCommand,
} from '../shared/commands';
import {
  OrganizationSummary,
  CreateOrganizationRequest,
  CreateOrganizationResult,
  InviteMemberRequest,
  RespondToInvitationRequest,
  OrganizationMemberView,
  UserProfile,
} from '../shared/dtos';

export async function getUserOrganizationsAction(): Promise<
  OrganizationSummary[]
> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error(
        '[getUserOrganizationsAction] Authentication failed:',
        error
      );
      throw new Error('Authentication required');
    }

    // 2. Service 사용 (Drizzle Repository)
    const organizationRepository = new DrizzleOrganizationRepository();
    const invitationRepository = new DrizzleInvitationRepository();
    const organizationMemberRepository =
      new DrizzleOrganizationMemberRepository();
    const service = new OrganizationManagementService(
      organizationRepository,
      invitationRepository,
      organizationMemberRepository
    );

    // 3. Command 생성
    const command: GetUserOrganizationsCommand = {
      userId: user.id,
    };

    // 4. 도메인 로직 실행
    const result = await service.getUserOrganizations(command);

    if (result.isError()) {
      console.error('[getUserOrganizationsAction] Failed:', {
        code: result.error.code,
        message: result.error.message,
      });
      throw new Error(result.error.message);
    }

    return result.value;
  } catch (error) {
    console.error('[getUserOrganizationsAction] Error:', error);
    throw error;
  }
}

const createDefaultOrganizationSchema = z.object({
  organizationName: z.string().min(1).max(255),
});

export async function createDefaultOrganizationAction(
  input: z.infer<typeof createDefaultOrganizationSchema>
): Promise<OrganizationSummary> {
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

    // 3. Service 사용 (Drizzle Repository)
    const organizationRepository = new DrizzleOrganizationRepository();
    const organizationMemberRepository =
      new DrizzleOrganizationMemberRepository();
    const service = new OrganizationManagementService(
      organizationRepository,
      undefined, // invitationRepository
      organizationMemberRepository
    );

    // 4. Command 생성
    const command: CreateDefaultOrganizationCommand = {
      userId: user.id,
      organizationName: validatedInput.organizationName,
    };

    // 5. 도메인 로직 실행
    const result = await service.createDefaultOrganization(command);

    if (result.isError()) {
      throw new Error(result.error.message);
    }

    // 6. 관련 페이지 재검증
    revalidatePath('/dashboard');
    revalidatePath('/organizations');

    // Serialize to DTO (plain object for Next.js client)
    return {
      id: result.value.id.value, // Serialize OrganizationId to string
      name: result.value.entity.name,
      organizationType: result.value.entity.organizationType,
      isDefault: result.value.entity.isDefault,
      createdAt: result.value.entity.createdAt.toISOString(), // Serialize Date to ISO string
    };
  } catch (error) {
    throw error;
  }
}

const createNewOrganizationSchema = z.object({
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

export async function createNewOrganizationAction(
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
    const validationResult = createNewOrganizationSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid input',
      };
    }

    const validatedInput = validationResult.data;

    // 3. Service 사용 (Drizzle Repository)
    const organizationRepository = new DrizzleOrganizationRepository();
    const organizationMemberRepository =
      new DrizzleOrganizationMemberRepository();
    const service = new OrganizationManagementService(
      organizationRepository,
      undefined, // invitationRepository
      organizationMemberRepository
    );

    // 4. Command 생성
    const command: CreateNewOrganizationCommand = {
      name: validatedInput.name,
      organizationType: validatedInput.organizationType,
      ownerId: user.id,
    };

    // 5. 도메인 로직 실행
    const result = await service.createNewOrganization(command);

    if (result.isError()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    // 6. 관련 페이지 재검증
    revalidatePath('/dashboard');
    revalidatePath('/organizations');

    return {
      success: true,
      organization: {
        id: result.value.id,
        name: result.value.name,
        organizationType: result.value.organizationType!,
        isDefault: result.value.isDefault,
        createdAt: result.value.createdAt,
      },
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

    // 2. Service 사용
    const organizationRepository = new DrizzleOrganizationRepository();
    const invitationRepository = new DrizzleInvitationRepository();
    const organizationMemberRepository =
      new DrizzleOrganizationMemberRepository();

    // Notification Service 추가 (Notification Management Domain과 통합)
    const notificationRepository = new DrizzleNotificationRepository();
    const notificationService = new NotificationService(notificationRepository);

    const service = new OrganizationManagementService(
      organizationRepository,
      invitationRepository,
      organizationMemberRepository,
      notificationService
    );

    // Get inviter name from profile (profiles 테이블에서 조회)
    const userProfiles =
      await organizationMemberRepository.searchUserProfileByEmail(
        user.email || ''
      );
    const inviterName =
      userProfiles.length > 0 && userProfiles[0]?.name
        ? userProfiles[0].name
        : user.email || 'Someone';

    // 3. Command 생성
    const command: RequestMemberInvitationCommand = {
      organizationId: input.organizationId,
      inviterUserId: user.id,
      inviterName: inviterName, // Profile 테이블에서 조회한 이름
      inviteeEmail: input.inviteeEmail,
      role: input.role,
    };

    // 4. 도메인 로직 실행
    const result = await service.inviteMember(command);

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

    // 2. Service 사용
    const organizationRepository = new DrizzleOrganizationRepository();
    const invitationRepository = new DrizzleInvitationRepository();
    const organizationMemberRepository =
      new DrizzleOrganizationMemberRepository();
    const service = new OrganizationManagementService(
      organizationRepository,
      invitationRepository,
      organizationMemberRepository
    );

    // 3. Command 생성
    if (input.accept) {
      const command: AcceptInvitationCommand = {
        invitationId: input.invitationId,
        inviteeUserId: user.id,
      };

      const result = await service.acceptInvitation(command);

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

      const result = await service.rejectInvitation(command);

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

    // 2. 의존성 주입 (Repository, Service)
    const organizationRepository = new DrizzleOrganizationRepository();
    const invitationRepository = new DrizzleInvitationRepository();
    const organizationMemberRepository =
      new DrizzleOrganizationMemberRepository();
    const notificationRepository = new DrizzleNotificationRepository();
    const notificationService = new NotificationService(notificationRepository);

    const service = new OrganizationManagementService(
      organizationRepository,
      invitationRepository,
      organizationMemberRepository,
      notificationService
    );

    // 3. Command 생성
    const command: ChangeMemberRoleCommand = {
      organizationId: data.organizationId,
      userId: data.targetUserId,
      newRole: data.newRole,
      requesterId: user.id,
    };

    // 4. 도메인 로직 실행
    const result = await service.changeMemberRole(command);

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
