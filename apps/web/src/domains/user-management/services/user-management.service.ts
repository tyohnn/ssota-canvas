// apps/web/src/domains/user-management/services/user-management.service.ts

import { UserRepository } from '../repositories/interfaces/user.repository.interface';
import { OrganizationRepository } from '../repositories/interfaces/organization.repository.interface';
import { OrganizationContextRepository } from '../repositories/interfaces/organization-context.repository.interface';
import { SupabaseAuthService } from '../anti-corruption-layers/supabase-auth-acl';
import { UserAggregate } from '../aggregates/user.aggregate';
import { OrganizationAggregate } from '../aggregates/organization.aggregate';
import { OrganizationContextAggregate } from '../aggregates/organization-context.aggregate';
import { UserId, OrganizationId } from '../value-objects/ids.vo';
import { UserManagementError } from '../errors/user-management.error';
import { Result } from '../types';
import {
  CreateUserProfileCommand,
  CreateDefaultOrganizationCommand,
  GetUserOrganizationsCommand,
  SelectOrganizationCommand,
} from '../commands';
import { OrganizationSummary } from '../events';

export class UserManagementService {
  constructor(
    private userRepository: UserRepository,
    private organizationRepository: OrganizationRepository,
    private organizationContextRepository: OrganizationContextRepository,
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

      // 4. 기본 조직 생성
      await this.createDefaultOrganizationInternal(newUser);

      return Result.success(newUser);
    } catch (error) {
      return Result.error(
        new UserManagementError(
          'PROFILE_CREATION_FAILED',
          'Failed to create user profile',
          {
            error,
          }
        )
      );
    }
  }

  async createDefaultOrganization(
    command: CreateDefaultOrganizationCommand
  ): Promise<Result<OrganizationAggregate, UserManagementError>> {
    try {
      // 1. 사용자 확인
      const user = await this.userRepository.findById(
        new UserId(command.userId)
      );
      if (!user) {
        return Result.error(
          new UserManagementError('USER_NOT_FOUND', 'User not found')
        );
      }

      // 2. 기본 조직 생성
      const organization = OrganizationAggregate.createDefault(
        command.organizationName || `${user.entity.name}'s Organization`,
        user.id
      );

      await this.organizationRepository.save(organization);

      return Result.success(organization);
    } catch (error) {
      return Result.error(
        new UserManagementError(
          'ORGANIZATION_CREATION_FAILED',
          'Failed to create default organization',
          { error }
        )
      );
    }
  }

  async getUserOrganizations(
    command: GetUserOrganizationsCommand
  ): Promise<Result<OrganizationSummary[], UserManagementError>> {
    try {
      // 1. 사용자 확인
      const user = await this.userRepository.findById(
        new UserId(command.userId)
      );
      if (!user) {
        return Result.error(
          new UserManagementError('USER_NOT_FOUND', 'User not found')
        );
      }

      // 2. 사용자 조직 조회
      const organizations = await this.organizationRepository.findByOwnerId(
        user.id
      );

      const summaries: OrganizationSummary[] = organizations.map(org => ({
        id: org.id,
        name: org.entity.name,
        isDefault: org.entity.isDefault,
        createdAt: org.entity.createdAt,
      }));

      return Result.success(summaries);
    } catch (error) {
      return Result.error(
        new UserManagementError(
          'ORGANIZATION_RETRIEVAL_FAILED',
          'Failed to get user organizations',
          { error }
        )
      );
    }
  }

  async selectOrganization(
    command: SelectOrganizationCommand
  ): Promise<Result<OrganizationContextAggregate, UserManagementError>> {
    try {
      // 1. 사용자 확인
      const user = await this.userRepository.findById(new UserId(command.userId));
      if (!user) {
        return Result.error(new UserManagementError('USER_NOT_FOUND', 'User not found'));
      }

      // 2. 조직 존재 및 권한 확인
      const organization = await this.organizationRepository.findById(new OrganizationId(command.organizationId));
      if (!organization) {
        return Result.error(new UserManagementError('ORGANIZATION_NOT_FOUND', 'Organization not found'));
      }

      // 3. 사용자가 해당 조직의 소유자인지 확인 (Scenario 0-1에서는 소유자만 접근 가능)
      if (organization.entity.ownerId.value !== command.userId) {
        return Result.error(new UserManagementError('ACCESS_DENIED', 'Access denied to this organization'));
      }

      // 4. 기존 컨텍스트 확인 및 업데이트 또는 새로 생성
      const existingContext = await this.organizationContextRepository.findByUserId(user.id);
      
      if (existingContext) {
        // 기존 컨텍스트 업데이트
        existingContext.updateContext(new OrganizationId(command.organizationId));
        await this.organizationContextRepository.save(existingContext);
        return Result.success(existingContext);
      } else {
        // 새 컨텍스트 생성
        const newContext = OrganizationContextAggregate.create(
          user.id,
          new OrganizationId(command.organizationId)
        );
        await this.organizationContextRepository.save(newContext);
        return Result.success(newContext);
      }
    } catch (error) {
      return Result.error(
        new UserManagementError(
          'ORGANIZATION_SELECTION_FAILED',
          'Failed to select organization',
          { error }
        )
      );
    }
  }

  private async createDefaultOrganizationInternal(
    user: UserAggregate
  ): Promise<void> {
    const orgName = `${user.entity.name}'s Organization`;

    const organization = OrganizationAggregate.createDefault(orgName, user.id);

    await this.organizationRepository.save(organization);
  }
}
