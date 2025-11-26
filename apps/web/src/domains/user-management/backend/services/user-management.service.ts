// apps/web/src/domains/user-management/services/user-management.service.ts

import { UserRepository } from '../repositories/interfaces/user.repository.interface';
import { SupabaseAuthService } from '../anti-corruption-layers/supabase-auth-acl';
import { UserAggregate } from '../../shared/aggregates/user.aggregate';
import { UserId } from '../../shared/value-objects/ids.vo';
import { UserManagementError } from '../../shared/errors/user-management.error';
import { Result } from '@/utils/result';
import { CreateUserProfileCommand } from '../../shared/commands';
import { DrizzleOrganizationRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';

export class UserManagementService {
  constructor(
    private userRepository: UserRepository,
    private supabaseAuthService: SupabaseAuthService
  ) {}

  async createUserProfile(
    command: CreateUserProfileCommand
  ): Promise<Result<UserAggregate, UserManagementError>> {
    try {
      // 1. Supabase Auth에서 사용자 확인
      const supabaseUser = await this.supabaseAuthService.getCurrentUser();

      if (!supabaseUser || supabaseUser.id !== command.userId) {
        return Result.error(
          new UserManagementError(
            'USER_NOT_FOUND',
            'User not found in Supabase Auth'
          )
        );
      }

      // 2. 기존 프로필 확인
      const existingUser = await this.userRepository.findById(
        new UserId(command.userId)
      );
      if (existingUser) {
        // 업데이트 (Supabase User 객체 생성 필요)
        const supabaseUserObj = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          user_metadata: {
            name: supabaseUser.name,
            avatar_url: supabaseUser.avatarUrl,
          },
          created_at: supabaseUser.createdAt.toISOString(),
        };
        // @ts-expect-error - simplified supabase user object
        existingUser.updateFromSupabaseAuth(supabaseUserObj);
        await this.userRepository.save(existingUser);
        return Result.success(existingUser);
      }

      // 3. 신규 프로필 생성
      const supabaseUserObj = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        user_metadata: {
          name: supabaseUser.name,
          avatar_url: supabaseUser.avatarUrl,
        },
        created_at: supabaseUser.createdAt.toISOString(),
      };
      // @ts-expect-error - simplified supabase user object
      const newUser = UserAggregate.createFromSupabaseAuth(supabaseUserObj);
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
            redirectUrl = `/r/${firstOrg.id.value}/workspace/${defaultWorkspace.workspaceId.value}/page/${firstPage.pageId.value}`;
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
}
