// apps/web/src/domains/user-management/actions/user-management.actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createDrizzleSupabaseClient } from '@/db';
import { profiles, organizations } from '@/db/schema';

import { DrizzleUserRepository } from '../backend/repositories/implementations/drizzle-user.repository';
import { DrizzleOrganizationRepository } from '../backend/repositories/implementations/drizzle-organization.repository';
import { SupabaseAuthService } from '../backend/anti-corruption-layers/supabase-auth-acl';
import { UserManagementService } from '../backend/services/user-management.service';
import { DrizzleUserProfileViewRepository } from '../backend/read-models/user-profile.view';
import {
  CreateUserProfileCommand,
  GetUserOrganizationsCommand,
  CreateDefaultOrganizationCommand,
  CreateNewOrganizationCommand,
} from '../shared/commands';
import { UserId } from '../shared/value-objects/ids.vo';
import { UserProfileView } from '../backend/read-models/user-profile.view';
import {
  OrganizationSummary,
  CreateOrganizationRequest,
  CreateOrganizationResult,
} from '../shared/dtos';

export async function createUserProfileAction(): Promise<UserProfileView> {
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

    // 2. 의존성 주입 (Drizzle Repository)
    const userRepository = new DrizzleUserRepository();
    const organizationRepository = new DrizzleOrganizationRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);

    const service = new UserManagementService(
      userRepository,
      organizationRepository,
      supabaseAuthService
    );

    // 3. Command 생성
    const command: CreateUserProfileCommand = {
      userId: user.id,
      email: user.email!,
      name: user.user_metadata?.name || 'User',
      avatarUrl: user.user_metadata?.avatar_url || null,
    };

    // 4. 도메인 로직 실행
    const result = await service.createUserProfile(command);

    if (result.isError()) {
      throw new Error(result.error.message);
    }

    // 5. Read Model 조회 (Drizzle)
    const viewRepository = new DrizzleUserProfileViewRepository();
    const view = await viewRepository.getByUserId(new UserId(user.id));

    if (!view) {
      throw new Error('User profile view not found');
    }

    return view;
  } catch (error) {
    throw error;
  }
}

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
      throw new Error('Authentication required');
    }

    // 2. Service 사용 (Drizzle Repository)
    const userRepository = new DrizzleUserRepository();
    const organizationRepository = new DrizzleOrganizationRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);

    const service = new UserManagementService(
      userRepository,
      organizationRepository,
      supabaseAuthService
    );

    // 3. Command 생성
    const command: GetUserOrganizationsCommand = {
      userId: user.id,
    };

    // 4. 도메인 로직 실행
    const result = await service.getUserOrganizations(command);

    if (result.isError()) {
      throw new Error(result.error.message);
    }

    return result.value;
  } catch (error) {
    throw error;
  }
}

const createDefaultOrganizationSchema = z.object({
  organizationName: z.string().min(1).max(255),
});

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
    const userRepository = new DrizzleUserRepository();
    const organizationRepository = new DrizzleOrganizationRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);

    const service = new UserManagementService(
      userRepository,
      organizationRepository,
      supabaseAuthService
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
      isDefault: result.value.entity.isDefault,
      createdAt: result.value.entity.createdAt.toISOString(), // Serialize Date to ISO string
    };
  } catch (error) {
    throw error;
  }
}

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
    const userRepository = new DrizzleUserRepository();
    const organizationRepository = new DrizzleOrganizationRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);

    const service = new UserManagementService(
      userRepository,
      organizationRepository,
      supabaseAuthService
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

// AI 자동화 패턴 준수: Repository 패턴 기반 사용자 등록
export interface UserRegistrationResult {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
  defaultOrganization: {
    id: string;
    name: string;
    isDefault: boolean;
  };
}

export async function processUserRegistrationAction(): Promise<UserRegistrationResult> {
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

    // 2. 의존성 주입 (Repository 패턴 준수)
    const userRepository = new DrizzleUserRepository();
    const organizationRepository = new DrizzleOrganizationRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);

    const service = new UserManagementService(
      userRepository,
      organizationRepository,
      supabaseAuthService
    );

    // 3. Command 생성 (AI 자동화 패턴 준수)
    const createUserProfileCommand: CreateUserProfileCommand = {
      userId: user.id,
      email: user.email!,
      name: user.user_metadata?.name || 'User',
      avatarUrl: user.user_metadata?.avatar_url || null,
    };

    // 4. 도메인 로직 실행 (Repository 패턴)
    const userResult = await service.createUserProfile(
      createUserProfileCommand
    );
    if (userResult.isError()) {
      throw new Error(
        `Failed to create user profile: ${userResult.error.message}`
      );
    }

    // 5. 기본 조직 생성 (Repository 패턴)
    const createDefaultOrgCommand: CreateDefaultOrganizationCommand = {
      userId: user.id,
      organizationName: `${user.user_metadata?.name || 'User'}'s Organization`,
    };

    const orgResult = await service.createDefaultOrganization(
      createDefaultOrgCommand
    );
    if (orgResult.isError()) {
      throw new Error(orgResult.error.message);
    }

    // 6. 결과 반환 (AI 자동화 패턴 준수)
    return {
      success: true,
      user: {
        id: userResult.value.id.value,
        email: userResult.value.entity.email.value,
        name: userResult.value.entity.name,
        avatarUrl: userResult.value.entity.avatarUrl,
      },
      defaultOrganization: {
        id: orgResult.value.id.value,
        name: orgResult.value.entity.name,
        isDefault: orgResult.value.entity.isDefault,
      },
    };
  } catch (error) {
    throw error;
  }
}
