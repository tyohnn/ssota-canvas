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
import {
  ActionResult,
  ok,
  err,
  isSuccess,
  isFailure,
} from '@/lib/action-result';

// Organization management imports
import {
  getUserOrganizationsAction as getOrganizationsAction,
  createDefaultOrganizationAction,
  createOrganizationAction,
} from '@/domains/organization-management/actions/organization-management.actions';
import { DrizzleOrganizationRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';

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

// ============================================
// Types
// ============================================

// AI 자동화 패턴 준수: Repository 패턴 기반 사용자 등록
// createDefaultOrganizationAction의 반환 타입 재사용 (organization, workspace, page, redirectUrl)
export type UserRegistrationResult = {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
} & Awaited<ReturnType<typeof createDefaultOrganizationAction>>;

// ============================================
// Public Server Action
// ============================================

/**
 * 사용자 등록 처리 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * Defense in Depth:
 * 1. 사용자 인증 확인 (Supabase Auth)
 * 2. 프로필 생성 또는 업데이트
 * 3. 기본 조직 생성 또는 기존 조직 조회
 *
 * @returns UserRegistrationResult (성공) | Error (실패)
 */
export async function processUserRegistrationAction(): Promise<
  ActionResult<UserRegistrationResult>
> {
  // 1. 인증 확인 (Supabase Auth)
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.warn(
        '[Security] Unauthenticated request to processUserRegistrationAction',
        {
          timestamp: new Date().toISOString(),
        }
      );

      return err('Authentication required', {
        code: 'UNAUTHORIZED',
      });
    }

    // 2. 검증 완료 - Internal 함수 호출
    return await processUserRegistrationInternal({
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    });
  } catch (error) {
    console.error(
      '[processUserRegistrationAction] Authentication error:',
      error
    );

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      {
        code: 'UNAUTHORIZED',
      }
    );
  }
}

// ============================================
// Internal Implementation
// ============================================

/**
 * 내부 구현 (검증된 사용자만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 Supabase 사용자만 받습니다
 *
 * @param user - 인증된 Supabase 사용자
 */
async function processUserRegistrationInternal(user: {
  id: string;
  email: string | undefined;
  user_metadata: any;
}): Promise<ActionResult<UserRegistrationResult>> {
  try {
    // 1. 의존성 주입 (Repository 패턴 준수)
    const supabase = await createClient();
    const userRepository = new DrizzleUserRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);

    const service = new UserManagementService(
      userRepository,
      supabaseAuthService
    );

    // 2. Command 생성 (AI 자동화 패턴 준수)
    const createUserProfileCommand: CreateUserProfileCommand = {
      userId: user.id,
      email: user.email!,
      name: user.user_metadata?.name || 'User',
      avatarUrl: user.user_metadata?.avatar_url || null,
    };

    // 3. 도메인 로직 실행 (Repository 패턴)
    const userResult = await service.createUserProfile(
      createUserProfileCommand
    );

    if (userResult.isError()) {
      console.error(
        '[processUserRegistrationInternal] User profile creation failed:',
        userResult.error
      );

      return err(`Failed to create user profile: ${userResult.error.message}`, {
        code: 'PROFILE_CREATION_FAILED',
        meta: {
          originalError: userResult.error,
        },
      });
    }

    // 4. 기본 조직 + 워크스페이스 + Welcome 페이지 생성 (Organization/Workspace Management Domain에 위임)
    const orgResult = await createOrGetDefaultOrganization(
      user.id,
      user.user_metadata?.name || 'User'
    );

    if (isFailure(orgResult)) {
      console.error(
        '[processUserRegistrationInternal] Organization setup failed:',
        orgResult.error
      );

      return err(`Failed to setup organization: ${orgResult.error}`, {
        code: 'ORGANIZATION_SETUP_FAILED',
        meta: {
          originalError: orgResult.error,
        },
      });
    }

    // 5. 결과 반환 (AI 자동화 패턴 준수 + 리다이렉션 URL 포함)
    return ok({
      user: {
        id: userResult.value.id.value,
        email: userResult.value.entity.email.value,
        name: userResult.value.entity.name,
        avatarUrl: userResult.value.entity.avatarUrl,
      },
      ...orgResult.data,
    });
  } catch (error) {
    console.error('[processUserRegistrationInternal] Internal error:', error);

    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * 기본 조직 생성 또는 기존 조직 조회
 *
 * @param userId - 사용자 ID
 * @param userName - 사용자 이름
 * @returns 조직 정보 또는 에러
 */
async function createOrGetDefaultOrganization(
  userId: string,
  userName: string
): Promise<
  ActionResult<Awaited<ReturnType<typeof createDefaultOrganizationAction>>>
> {
  try {
    // 1. 기본 조직 생성 시도
    const orgName = `${userName}'s Organization`;
    const orgResult = await createDefaultOrganizationAction({
      organizationName: orgName,
    });

    return ok(orgResult);
  } catch (organizationError) {
    // 2. 이미 default org가 있는 경우, 기존 조직 정보를 조회해서 반환
    if (
      organizationError instanceof Error &&
      (organizationError.message.includes(
        'DEFAULT_ORGANIZATION_ALREADY_EXISTS'
      ) ||
        organizationError.message.includes('already exists'))
    ) {
      console.log(
        '[createOrGetDefaultOrganization] Default organization already exists, retrieving existing organization...'
      );

      // 기존 default org 조회
      const userIdVO = new UserId(userId);
      const organizationRepository = new DrizzleOrganizationRepository();
      const existingOrganizations =
        await organizationRepository.findByOwnerId(userIdVO);
      const existingDefaultOrg = existingOrganizations.find(
        org => org.entity.isDefault
      );

      if (!existingDefaultOrg) {
        return err('Default organization not found', {
          code: 'DEFAULT_ORGANIZATION_NOT_FOUND',
        });
      }

      // 기존 조직의 워크스페이스와 페이지 조회
      const workspaceRepository = new DrizzleWorkspaceRepository();
      const pageRepository = new DrizzlePageRepository();
      const orgId = existingDefaultOrg.id;

      // Default workspace 조회
      const allWorkspaces =
        await workspaceRepository.findByOrganizationId(orgId);
      const defaultWorkspace = allWorkspaces.find(ws => ws.isDefault);
      const personalWorkspace = allWorkspaces.find(
        ws => ws.isPersonal && ws.ownerId === userId
      );

      if (!defaultWorkspace) {
        return err('Default workspace not found', {
          code: 'DEFAULT_WORKSPACE_NOT_FOUND',
        });
      }

      // Default workspace의 첫 페이지 조회
      const defaultPages = await pageRepository.findTreeByWorkspaceId(
        defaultWorkspace.workspaceId
      );
      const firstPage = defaultPages.length > 0 ? defaultPages[0]! : null;

      if (!firstPage) {
        return err('First page not found in default workspace', {
          code: 'FIRST_PAGE_NOT_FOUND',
        });
      }

      // Personal workspace와 첫 페이지 조회 (optional)
      let personalPageId = '';
      let personalPageTitle = '';
      let personalPageIcon: string | null = null;
      let personalWorkspaceId = '';
      let personalWorkspaceName = '';
      let personalWorkspaceIsDefault = false;

      if (personalWorkspace) {
        const personalPages = await pageRepository.findTreeByWorkspaceId(
          personalWorkspace.workspaceId
        );
        const firstPersonalPage =
          personalPages.length > 0 ? personalPages[0]! : null;

        personalWorkspaceId = personalWorkspace.workspaceId.value;
        personalWorkspaceName = personalWorkspace.name;
        personalWorkspaceIsDefault = personalWorkspace.isDefault;

        if (firstPersonalPage) {
          personalPageId = firstPersonalPage.pageId.value;
          personalPageTitle = firstPersonalPage.title;
          personalPageIcon = firstPersonalPage.icon;
        }
      }

      // 리다이렉션 URL 생성
      const redirectUrl = `/r/${orgId.value}/workspace/${defaultWorkspace.workspaceId.value}/page/${firstPage.pageId.value}`;

      // 기존 조직 정보를 동일한 형식으로 반환
      return ok({
        organization: {
          id: existingDefaultOrg.id.value,
          name: existingDefaultOrg.entity.name,
          organizationType: existingDefaultOrg.entity.organizationType,
          isDefault: true,
          role: 'owner' as const,
          createdAt: existingDefaultOrg.entity.createdAt.toISOString(),
        },
        workspace: {
          id: defaultWorkspace.workspaceId.value,
          name: defaultWorkspace.name,
          isDefault: defaultWorkspace.isDefault,
        },
        page: {
          id: firstPage.pageId.value,
          title: firstPage.title,
          icon: firstPage.icon,
        },
        personalWorkspace: {
          id: personalWorkspaceId,
          name: personalWorkspaceName,
          isDefault: personalWorkspaceIsDefault,
        },
        personalPage: {
          id: personalPageId,
          title: personalPageTitle,
          icon: personalPageIcon,
        },
        redirectUrl,
      });
    }

    // 3. 다른 에러인 경우 기존대로 처리
    console.error(
      '[createOrGetDefaultOrganization] Organization creation failed:',
      organizationError
    );

    return err(
      `Failed to create default organization: ${organizationError instanceof Error ? organizationError.message : 'Unknown error'}`,
      {
        code: 'ORGANIZATION_CREATION_FAILED',
        meta: {
          originalError:
            organizationError instanceof Error
              ? organizationError.message
              : 'Unknown error',
        },
      }
    );
  }
}

/**
 * 사용자 설정 상태 확인 (Server Action - Client Component용)
 *
 * 사용자가 프로필과 조직 설정을 완료했는지 확인합니다.
 * - 프로필이 존재하는가?
 * - 최소 하나 이상의 조직이 존재하는가?
 *
 * ⚠️ Note: Route handlers는 UserManagementService.checkUserSetupStatus()를 직접 사용하세요.
 * 이 action은 클라이언트 컴포넌트에서 호출하기 위한 래퍼입니다.
 *
 * @returns isSetupComplete: boolean, redirectUrl?: string
 */
export async function checkUserSetupStatusAction(): Promise<
  ActionResult<{
    isSetupComplete: boolean;
    redirectUrl?: string;
  }>
> {
  try {
    // 1. 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return err('Authentication required', {
        code: 'UNAUTHORIZED',
      });
    }

    // 2. Service를 통한 비즈니스 로직 처리
    const userRepository = new DrizzleUserRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);
    const userManagementService = new UserManagementService(
      userRepository,
      supabaseAuthService
    );

    const result = await userManagementService.checkUserSetupStatus(user.id);

    if (result.isError()) {
      return err(result.error.message, {
        code: 'INTERNAL_SERVER_ERROR',
        meta: {
          originalError: result.error,
        },
      });
    }

    return ok(result.value);
  } catch (error) {
    console.error('[checkUserSetupStatusAction] Error:', error);

    return err('Failed to check user setup status', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

// Delegated to organization-management domain
export const getUserOrganizationsAction = getOrganizationsAction;
// Note: createDefaultOrganizationAction and createOrganizationAction are available
// directly from @/domains/organization-management/actions/organization-management.actions
