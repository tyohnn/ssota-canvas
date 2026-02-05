// apps/web/src/domains/user-management/services/user-management.service.ts

import { UserRepository } from '../repositories/interfaces/user.repository.interface';
import { SupabaseAuthService } from '../anti-corruption-layers/supabase-auth-acl';
import { UserAggregate } from '../../shared/aggregates/user.aggregate';
import { UserId } from '../../shared/value-objects/ids.vo';
import { UserManagementError } from '../../shared/errors/user-management.error';
import type { AuthUserInfo } from '../../shared/types';
import { Result } from '@/utils/result';
import { CreateUserProfileCommand } from '../../shared/commands';
import { DrizzleOrganizationRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';

/** 온보딩용 인증 사용자 (프로필 없을 수 있음) */
export interface OnboardingAuthUser {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
}

export class UserManagementService {
  constructor(
    private userRepository: UserRepository,
    private supabaseAuthService: SupabaseAuthService
  ) { }

  /**
   * 프로필 생성 (SafeDTO → Command 변환은 서비스 내부에서 수행)
   */
  async createUserProfile(
    authUser: OnboardingAuthUser,
    language?: string
  ): Promise<Result<UserAggregate, UserManagementError>> {
    try {
      const supabaseUser = await this.supabaseAuthService.getCurrentUser();
      if (!supabaseUser || supabaseUser.id !== authUser.id) {
        return Result.error(
          new UserManagementError(
            'USER_NOT_FOUND',
            'User not found in Supabase Auth'
          )
        );
      }

      const metadata = authUser.user_metadata as
        | { name?: string; avatar_url?: string | null }
        | undefined;
      const command: CreateUserProfileCommand = {
        userId: authUser.id,
        email: authUser.email,
        name: metadata?.name ?? 'User',
        avatarUrl: metadata?.avatar_url ?? null,
        language: language ?? 'en',
      };

      const authUserInfo: AuthUserInfo = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: command.name ?? supabaseUser.name,
        avatarUrl: command.avatarUrl ?? supabaseUser.avatarUrl,
        createdAt: supabaseUser.createdAt,
      };

      const existingUser = await this.userRepository.findById(
        new UserId(command.userId)
      );
      if (existingUser) {
        existingUser.updateFromAuthUserInfo(authUserInfo, command.language);
        await this.userRepository.save(existingUser);
        return Result.success(existingUser);
      }

      const newUser = UserAggregate.createFromAuthUserInfo(
        authUserInfo,
        command.language || 'en'
      );
      await this.userRepository.save(newUser);
      return Result.success(newUser);
    } catch (error) {
      console.error('[UserManagementService] Profile creation error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      return Result.error(
        new UserManagementError(
          'PROFILE_CREATION_FAILED',
          'Failed to create user profile',
          {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
          }
        )
      );
    }
  }

  /**
   * 사용자 설정 완료 상태 확인
   *
   * @param userId - 확인할 사용자 ID
   * @returns 설정 완료 여부, 베타 상태 및 리다이렉트 URL
   */
  async checkUserSetupStatus(userId: string): Promise<
    Result<
      {
        isSetupComplete: boolean;
        redirectUrl?: string;
        // Beta access fields
        isBetaApproved: boolean;
        beta_status: string;
        beta_application: any;
      },
      UserManagementError
    >
  > {
    try {
      const userIdVO = new UserId(userId);

      // 1. 프로필 확인
      const existingProfile = await this.userRepository.findById(userIdVO);

      // 베타 상태 조회 (User entity에서 가져옴, optional)
      const isBetaApproved = existingProfile?.entity.betaStatus === 'approved';
      const beta_status = existingProfile?.entity.betaStatus || 'pending';
      const beta_application = existingProfile?.entity.betaApplication || null;

      // 2. 조직 확인
      const organizationRepository = new DrizzleOrganizationRepository();
      const existingOrganizations =
        await organizationRepository.findByOwnerId(userIdVO);

      // 3. 설정 완료 여부 판단
      const isSetupComplete =
        existingProfile !== null && existingOrganizations.length > 0;

      // 4. 설정이 완료된 경우, 기본 리다이렉트 URL 생성
      let redirectUrl: string | undefined;
      if (isSetupComplete && existingOrganizations.length > 0) {
        const defaultOrg = existingOrganizations.find(
          org => org.entity.isDefault
        );
        const firstOrg = defaultOrg || existingOrganizations[0]!;

        // 해당 조직의 워크스페이스와 페이지 조회
        const workspaceRepository = new DrizzleWorkspaceRepository();
        const pageRepository = new DrizzlePageRepository();

        const workspaces = await workspaceRepository.findByOrganizationId(
          firstOrg.id
        );
        const defaultWorkspace = workspaces.find(ws => ws.isDefault);

        if (defaultWorkspace) {
          const pages = await pageRepository.findTreeByWorkspaceId(
            defaultWorkspace.workspaceId
          );
          const firstPage = pages.length > 0 ? pages[0]! : null;

          if (firstPage) {
            redirectUrl = `/r/${firstOrg.id.value}/${firstPage.pageId.value}`;
          }
        }
      }

      return Result.success({
        isSetupComplete,
        redirectUrl,
        isBetaApproved,
        beta_status,
        beta_application,
      });
    } catch (error) {
      console.error('[UserManagementService] Check setup status error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });

      return Result.error(
        new UserManagementError(
          'SETUP_STATUS_CHECK_FAILED',
          'Failed to check user setup status',
          {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
          }
        )
      );
    }
  }

  /**
   * 프로필 업데이트 (이름, 아바타, 언어)
   * 제공된 필드만 반영하고 나머지는 기존 값 유지.
   */
  async updateUserProfile(
    userId: string,
    updateData: { name?: string; avatarUrl?: string | null; language?: string }
  ): Promise<Result<UserAggregate, UserManagementError>> {
    try {
      const userIdVO = new UserId(userId);
      const aggregate = await this.userRepository.findById(userIdVO);
      if (!aggregate) {
        return Result.error(
          new UserManagementError('USER_NOT_FOUND', 'User profile not found')
        );
      }
      const entity = aggregate.entity;
      const name = updateData.name ?? entity.name;
      const avatarUrl =
        updateData.avatarUrl !== undefined
          ? updateData.avatarUrl
          : entity.avatarUrl;
      const language = updateData.language ?? entity.language;
      entity.updateProfile(name, avatarUrl, language);
      await this.userRepository.save(aggregate);
      return Result.success(aggregate);
    } catch (error) {
      console.error('[UserManagementService] updateUserProfile error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return Result.error(
        new UserManagementError(
          'PROFILE_UPDATE_FAILED',
          'Failed to update user profile',
          {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
          }
        )
      );
    }
  }
}
