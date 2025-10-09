// apps/web/src/domains/user-management/actions/user-management.actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';

import { DrizzleUserRepository } from '../backend/repositories/implementations/drizzle-user.repository';
import { SupabaseAuthService } from '../backend/anti-corruption-layers/supabase-auth-acl';
import { UserManagementService } from '../backend/services/user-management.service';
import { DrizzleUserProfileViewRepository } from '../backend/read-models/user-profile.view';
import { CreateUserProfileCommand } from '../shared/commands';
import { UserId } from '../shared/value-objects/ids.vo';
import { UserProfileView } from '../backend/read-models/user-profile.view';

// Organization management imports
import {
  getUserOrganizationsAction as getOrganizationsAction,
  createDefaultOrganizationAction as createDefaultOrgAction,
  createNewOrganizationAction as createNewOrgAction,
} from '@/domains/organization-management/actions/organization-management.actions';

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
    const supabaseAuthService = new SupabaseAuthService(supabase);

    const service = new UserManagementService(
      userRepository,
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

// Delegated to organization-management domain
export const getUserOrganizationsAction = getOrganizationsAction;
export const createDefaultOrganizationAction = createDefaultOrgAction;
export const createNewOrganizationAction = createNewOrgAction;

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
    const supabaseAuthService = new SupabaseAuthService(supabase);

    const service = new UserManagementService(
      userRepository,
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

    // 5. 기본 조직 생성 (Organization Management Domain에 위임)
    const orgName = `${user.user_metadata?.name || 'User'}'s Organization`;
    const orgResult = await createDefaultOrgAction({
      organizationName: orgName,
    });

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
        id: orgResult.id,
        name: orgResult.name,
        isDefault: orgResult.isDefault,
      },
    };
  } catch (error) {
    throw error;
  }
}
