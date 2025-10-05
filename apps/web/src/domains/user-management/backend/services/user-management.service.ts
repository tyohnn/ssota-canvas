// apps/web/src/domains/user-management/services/user-management.service.ts

import { UserRepository } from '../repositories/interfaces/user.repository.interface';
import { OrganizationRepository } from '../repositories/interfaces/organization.repository.interface';
import { SupabaseAuthService } from '../anti-corruption-layers/supabase-auth-acl';
import { UserAggregate } from '../../shared/aggregates/user.aggregate';
import { OrganizationAggregate } from '../../shared/aggregates/organization.aggregate';
import { UserId } from '../../shared/value-objects/ids.vo';
import { UserManagementError } from '../../shared/errors/user-management.error';
import { Result } from '../../shared/types';
import {
  CreateUserProfileCommand,
  CreateDefaultOrganizationCommand,
  GetUserOrganizationsCommand,
} from '../../shared/commands';
import { OrganizationSummary } from '../../shared/dtos';

export class UserManagementService {
  constructor(
    private userRepository: UserRepository,
    private organizationRepository: OrganizationRepository,
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

      // Serialize to DTO (plain objects for Next.js boundary)
      const summaries: OrganizationSummary[] = organizations.map(org => ({
        id: org.id.value, // Serialize OrganizationId to string
        name: org.entity.name,
        isDefault: org.entity.isDefault,
        createdAt: org.entity.createdAt.toISOString(), // Serialize Date to ISO string
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

  private async createDefaultOrganizationInternal(
    user: UserAggregate
  ): Promise<void> {
    const orgName = `${user.entity.name}'s Organization`;

    const organization = OrganizationAggregate.createDefault(orgName, user.id);

    await this.organizationRepository.save(organization);
  }
}
