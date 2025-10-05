// apps/web/src/domains/user-management/services/user-management.service.ts

import { UserRepository } from '../repositories/interfaces/user.repository.interface';
import { OrganizationRepository } from '../repositories/interfaces/organization.repository.interface';
import { SupabaseAuthService } from '../anti-corruption-layers/supabase-auth-acl';
import { UserAggregate } from '../../shared/aggregates/user.aggregate';
import { OrganizationAggregate } from '../../shared/aggregates/organization.aggregate';
import { UserId } from '../../shared/value-objects/ids.vo';
import { UserManagementError } from '../../shared/errors/user-management.error';
import { Result } from '../../../../utils/result';
import {
  CreateUserProfileCommand,
  CreateDefaultOrganizationCommand,
  CreateNewOrganizationCommand,
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
        organizationType: org.entity.organizationType,
        isDefault: org.entity.isDefault,
        role: 'owner', // 현재는 소유자만 조회
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

  async createNewOrganization(
    command: CreateNewOrganizationCommand
  ): Promise<Result<OrganizationSummary, UserManagementError>> {
    try {
      // 1. 사용자 인증 확인
      const supabaseUser = await this.supabaseAuthService.getCurrentUser();
      if (!supabaseUser || supabaseUser.id !== command.ownerId) {
        return Result.error(
          new UserManagementError('USER_NOT_FOUND', 'Authentication required')
        );
      }

      // 2. 조직 이름 중복 검사
      const existingOrganizations =
        await this.organizationRepository.findByOwnerId(
          new UserId(command.ownerId)
        );

      const duplicateOrg = existingOrganizations.find(
        org => org.entity.name.toLowerCase() === command.name.toLowerCase()
      );

      if (duplicateOrg) {
        return Result.error(
          new UserManagementError(
            'ORGANIZATION_NAME_DUPLICATE',
            'Organization with this name already exists'
          )
        );
      }

      // 3. 새로운 조직 생성
      const newOrganization = OrganizationAggregate.createNew(
        command.name,
        command.organizationType,
        new UserId(command.ownerId)
      );

      // 4. 조직 저장
      await this.organizationRepository.save(newOrganization);

      // 5. DTO로 변환하여 반환
      const organizationSummary: OrganizationSummary = {
        id: newOrganization.id.value,
        name: newOrganization.entity.name,
        organizationType: newOrganization.entity.organizationType,
        isDefault: newOrganization.entity.isDefault,
        role: 'owner',
        createdAt: newOrganization.entity.createdAt.toISOString(),
      };

      return Result.success(organizationSummary);
    } catch (error) {
      return Result.error(
        new UserManagementError(
          'ORGANIZATION_CREATION_FAILED',
          'Failed to create new organization',
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
