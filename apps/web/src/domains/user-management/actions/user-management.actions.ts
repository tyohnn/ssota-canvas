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
  createDefaultOrganizationWithWorkspaceAndPageAction as createDefaultOrgWithWorkspaceAndPageAction,
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
  workspace: {
    id: string;
    name: string;
    isDefault: boolean;
  };
  page: {
    id: string;
    title: string;
    icon: string;
  };
  redirectUrl: string;
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

    // 5. 기본 조직 + 워크스페이스 + Welcome 페이지 생성 (Organization/Workspace Management Domain에 위임)
    let orgWithWorkspaceAndPageResult;
    try {
      const orgName = `${user.user_metadata?.name || 'User'}'s Organization`;
      orgWithWorkspaceAndPageResult =
        await createDefaultOrgWithWorkspaceAndPageAction({
          organizationName: orgName,
        });
    } catch (organizationError) {
      // 조직 생성 실패 시 사용자 프로필 롤백 고려
      console.error(
        '[processUserRegistrationAction] Organization creation failed, user profile already created:',
        organizationError
      );

      // 현재는 사용자 프로필은 유지하고 조직 생성 실패만 보고
      // 향후 정책에 따라 사용자 프로필도 롤백할 수 있음
      throw new Error(
        `Failed to create default organization: ${organizationError instanceof Error ? organizationError.message : 'Unknown error'}`
      );
    }

    // 6. 결과 반환 (AI 자동화 패턴 준수 + 리다이렉션 URL 포함)
    return {
      success: true,
      user: {
        id: userResult.value.id.value,
        email: userResult.value.entity.email.value,
        name: userResult.value.entity.name,
        avatarUrl: userResult.value.entity.avatarUrl,
      },
      defaultOrganization: {
        id: orgWithWorkspaceAndPageResult.organization.id,
        name: orgWithWorkspaceAndPageResult.organization.name,
        isDefault: orgWithWorkspaceAndPageResult.organization.isDefault,
      },
      workspace: orgWithWorkspaceAndPageResult.workspace,
      page: orgWithWorkspaceAndPageResult.page,
      redirectUrl: orgWithWorkspaceAndPageResult.redirectUrl,
    };
  } catch (error) {
    console.error(
      '[processUserRegistrationAction] Registration process failed:',
      error
    );
    throw error;
  }
}

// Delegated to organization-management domain
export const getUserOrganizationsAction = getOrganizationsAction;
export const createDefaultOrganizationAction = createDefaultOrgAction;
export const createDefaultOrganizationWithWorkspaceAndPageAction =
  createDefaultOrgWithWorkspaceAndPageAction;
export const createNewOrganizationAction = createNewOrgAction;
