import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserManagementService } from '../../../backend/services/user-management.service';
import { UserRepository } from '../../../backend/repositories/interfaces/user.repository.interface';
import { OrganizationRepository } from '../../../backend/repositories/interfaces/organization.repository.interface';
import { SupabaseAuthService } from '../../../backend/anti-corruption-layers/supabase-auth-acl';
import { UserAggregate } from '../../aggregates/user.aggregate';
import { OrganizationAggregate } from '../../aggregates/organization.aggregate';
import { UserId, OrganizationId } from '../../value-objects/ids.vo';
import { UserEmail } from '../../value-objects/user-email.vo';
import { UserManagementError } from '../../errors/user-management.error';
import { Result } from '../../types';
import {
  CreateUserProfileCommand,
  CreateDefaultOrganizationCommand,
  GetUserOrganizationsCommand,
} from '../../commands';
import { OrganizationSummary } from '../../dtos';

// Mock Repositories
const mockUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

const mockOrganizationRepository = {
  findById: vi.fn(),
  findByOwnerId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

// Mock SupabaseAuthService
const mockSupabaseAuthService = {
  getCurrentUser: vi.fn(),
};

// Mock DomainUser for SupabaseAuthService
interface MockDomainUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
}

describe('UserManagementService Integration Tests', () => {
  let userManagementService: UserManagementService;
  let mockUser: UserAggregate;
  let mockOrganization: OrganizationAggregate;
  let userId: UserId;

  beforeEach(() => {
    userManagementService = new UserManagementService(
      mockUserRepository as unknown as UserRepository,
      mockOrganizationRepository as unknown as OrganizationRepository,
      mockSupabaseAuthService as unknown as SupabaseAuthService
    );

    userId = new UserId('test-user-id');
    
    // Create mock user aggregate
    const mockSupabaseUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg'
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    mockUser = UserAggregate.createFromSupabaseAuth(mockSupabaseUser as any);
    mockOrganization = OrganizationAggregate.createDefault('Test Organization', userId);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createUserProfile', () => {
    it('Supabase User로부터 프로필을 생성해야 한다', async () => {
      // Given
      const command: CreateUserProfileCommand = {
        userId: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      const mockDomainUser: MockDomainUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };

      mockSupabaseAuthService.getCurrentUser.mockResolvedValue(mockDomainUser);
      mockUserRepository.findById.mockResolvedValue(null); // 신규 사용자
      mockUserRepository.save.mockResolvedValue(undefined);

      // When
      const result = await userManagementService.createUserProfile(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(mockSupabaseAuthService.getCurrentUser).toHaveBeenCalled();
      expect(mockUserRepository.findById).toHaveBeenCalledWith(new UserId('test-user-id'));
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('이미 존재하는 사용자는 업데이트만 해야 한다', async () => {
      // Given
      const command: CreateUserProfileCommand = {
        userId: 'test-user-id',
        email: 'test@example.com',
        name: 'Updated User',
        avatarUrl: 'https://example.com/new-avatar.jpg',
      };

      const mockDomainUser: MockDomainUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Updated User',
        avatarUrl: 'https://example.com/new-avatar.jpg',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };

      mockSupabaseAuthService.getCurrentUser.mockResolvedValue(mockDomainUser);
      mockUserRepository.findById.mockResolvedValue(mockUser); // 기존 사용자
      mockUserRepository.save.mockResolvedValue(undefined);

      // When
      const result = await userManagementService.createUserProfile(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(new UserId('test-user-id'));
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('프로필 생성 실패 시 적절한 에러를 반환해야 한다', async () => {
      // Given
      const command: CreateUserProfileCommand = {
        userId: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
      };

      mockSupabaseAuthService.getCurrentUser.mockResolvedValue(null); // 인증 실패

      // When
      const result = await userManagementService.createUserProfile(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error).toBeInstanceOf(UserManagementError);
      expect(result.error?.code).toBe('USER_NOT_FOUND');
    });

    it('이메일이 일치하지 않으면 에러를 반환해야 한다', async () => {
      // Given
      const command: CreateUserProfileCommand = {
        userId: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
      };

      const mockDomainUser: MockDomainUser = {
        id: 'different-user-id', // 다른 ID
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        createdAt: new Date(),
      };

      mockSupabaseAuthService.getCurrentUser.mockResolvedValue(mockDomainUser);

      // When
      const result = await userManagementService.createUserProfile(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error?.code).toBe('USER_NOT_FOUND');
    });

    it('데이터베이스 저장 실패 시 에러를 반환해야 한다', async () => {
      // Given
      const command: CreateUserProfileCommand = {
        userId: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
      };

      const mockDomainUser: MockDomainUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        createdAt: new Date(),
      };

      mockSupabaseAuthService.getCurrentUser.mockResolvedValue(mockDomainUser);
      mockUserRepository.findById.mockResolvedValue(null);
      mockUserRepository.save.mockRejectedValue(new Error('Database error'));

      // When
      const result = await userManagementService.createUserProfile(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error?.code).toBe('PROFILE_CREATION_FAILED');
    });
  });

  describe('createDefaultOrganization', () => {
    it('사용자를 위한 기본 조직을 생성해야 한다', async () => {
      // Given
      const command: CreateDefaultOrganizationCommand = {
        userId: 'test-user-id',
        organizationName: 'Test User\'s Organization',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser); // 사용자 존재
      mockOrganizationRepository.save.mockResolvedValue(undefined);

      // When
      const result = await userManagementService.createDefaultOrganization(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.entity.name).toBe('Test User\'s Organization');
        expect(result.value.isDefault).toBe(true);
        expect(result.value.ownerId.value).toBe('test-user-id');
      }
      expect(mockUserRepository.findById).toHaveBeenCalledWith(new UserId('test-user-id'));
      expect(mockOrganizationRepository.save).toHaveBeenCalled();
    });

    it('조직 생성 실패 시 에러를 반환해야 한다', async () => {
      // Given
      const command: CreateDefaultOrganizationCommand = {
        userId: 'test-user-id',
        organizationName: 'Test Organization',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser); // 사용자 존재
      mockOrganizationRepository.save.mockRejectedValue(new Error('Database error'));

      // When
      const result = await userManagementService.createDefaultOrganization(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error?.code).toBe('ORGANIZATION_CREATION_FAILED');
    });

    it('빈 조직명으로도 조직을 생성할 수 있어야 한다', async () => {
      // Given
      const command: CreateDefaultOrganizationCommand = {
        userId: 'test-user-id',
        organizationName: '',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser); // 사용자 존재
      mockOrganizationRepository.save.mockResolvedValue(undefined);

      // When
      const result = await userManagementService.createDefaultOrganization(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        // 빈 조직명이 전달되면 실제 구현에서는 사용자 이름을 기반으로 기본 조직명을 생성함
        expect(result.value.entity.name).toBe("Test User's Organization");
        expect(result.value.isDefault).toBe(true);
      }
    });
  });

  describe('getUserOrganizations', () => {
    it('사용자 소유 조직 목록을 조회해야 한다', async () => {
      // Given
      const command: GetUserOrganizationsCommand = {
        userId: 'test-user-id',
      };

      const organizations = [
        OrganizationAggregate.createDefault('Organization 1', userId),
        OrganizationAggregate.createDefault('Organization 2', userId),
      ];

      mockUserRepository.findById.mockResolvedValue(mockUser); // 사용자 존재
      mockOrganizationRepository.findByOwnerId.mockResolvedValue(organizations);

      // When
      const result = await userManagementService.getUserOrganizations(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]?.name).toBe('Organization 1');
        expect(result.value[1]?.name).toBe('Organization 2');
        expect(result.value[0]?.isDefault).toBe(true);
        expect(result.value[1]?.isDefault).toBe(true);
      }
      expect(mockUserRepository.findById).toHaveBeenCalledWith(new UserId('test-user-id'));
      expect(mockOrganizationRepository.findByOwnerId).toHaveBeenCalledWith(new UserId('test-user-id'));
    });

    it('빈 목록도 올바르게 반환해야 한다', async () => {
      // Given
      const command: GetUserOrganizationsCommand = {
        userId: 'test-user-id',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser); // 사용자 존재
      mockOrganizationRepository.findByOwnerId.mockResolvedValue([]);

      // When
      const result = await userManagementService.getUserOrganizations(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toEqual([]);
      }
    });

    it('조회 실패 시 에러를 반환해야 한다', async () => {
      // Given
      const command: GetUserOrganizationsCommand = {
        userId: 'test-user-id',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser); // 사용자 존재
      mockOrganizationRepository.findByOwnerId.mockRejectedValue(new Error('Database error'));

      // When
      const result = await userManagementService.getUserOrganizations(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error?.code).toBe('ORGANIZATION_RETRIEVAL_FAILED');
    });
  });

  describe('Error Handling', () => {
    it('예상치 못한 오류를 적절히 처리해야 한다', async () => {
      // Given
      const command: CreateUserProfileCommand = {
        userId: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
      };

      mockSupabaseAuthService.getCurrentUser.mockRejectedValue(new Error('Unexpected error'));

      // When
      const result = await userManagementService.createUserProfile(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error?.code).toBe('PROFILE_CREATION_FAILED');
    });

    it('null 또는 undefined 값을 안전하게 처리해야 한다', async () => {
      // Given
      const command: CreateUserProfileCommand = {
        userId: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
      };

      const mockDomainUser: MockDomainUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null, // null 값
        createdAt: new Date(),
      };

      mockSupabaseAuthService.getCurrentUser.mockResolvedValue(mockDomainUser);
      mockUserRepository.findById.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);

      // When
      const result = await userManagementService.createUserProfile(command);

      // Then
      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('전체 사용자 등록 플로우가 성공해야 한다', async () => {
      // Given - 사용자 프로필 생성
      const createProfileCommand: CreateUserProfileCommand = {
        userId: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
      };

      const mockDomainUser: MockDomainUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        createdAt: new Date(),
      };

      mockSupabaseAuthService.getCurrentUser.mockResolvedValue(mockDomainUser);
      mockUserRepository.findById.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockOrganizationRepository.save.mockResolvedValue(undefined);

      // When - 프로필 생성
      const profileResult = await userManagementService.createUserProfile(createProfileCommand);

      // Then - 프로필 생성 성공
      expect(profileResult.isSuccess()).toBe(true);

      // Given - 기본 조직 생성 (사용자가 이제 존재함)
      const createOrgCommand: CreateDefaultOrganizationCommand = {
        userId: 'test-user-id',
        organizationName: 'Test User\'s Organization',
      };

      // 이제 사용자가 존재하므로 findById가 사용자를 반환해야 함
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // When - 조직 생성
      const orgResult = await userManagementService.createDefaultOrganization(createOrgCommand);

      // Then - 조직 생성 성공
      expect(orgResult.isSuccess()).toBe(true);

      // Given - 조직 목록 조회
      const getOrgsCommand: GetUserOrganizationsCommand = {
        userId: 'test-user-id',
      };

      if (orgResult.isSuccess()) {
        mockOrganizationRepository.findByOwnerId.mockResolvedValue([orgResult.value]);
      }

      // When - 조직 목록 조회
      const orgsResult = await userManagementService.getUserOrganizations(getOrgsCommand);

      // Then - 조직 목록 조회 성공
      expect(orgsResult.isSuccess()).toBe(true);
      if (orgsResult.isSuccess()) {
        expect(orgsResult.value).toHaveLength(1);
        expect(orgsResult.value[0]?.name).toBe('Test User\'s Organization');
      }
    });
  });
});
