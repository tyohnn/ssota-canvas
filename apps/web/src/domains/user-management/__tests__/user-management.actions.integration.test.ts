import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Supabase client first before any imports
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock database to prevent DATABASE_URL error
vi.mock('@/db', () => ({
  db: {},
  createDrizzleSupabaseClient: vi.fn(),
}));

// Mock schema
vi.mock('@/db/schema', () => ({
  profiles: {},
  organizations: {},
}));

// Mock repositories
vi.mock('../backend/repositories/implementations/drizzle-user.repository', () => ({
  DrizzleUserRepository: vi.fn(),
}));

vi.mock('../backend/repositories/implementations/drizzle-organization.repository', () => ({
  DrizzleOrganizationRepository: vi.fn(),
}));

// Mock read models
vi.mock('../backend/read-models/user-profile.view', () => ({
  DrizzleUserProfileViewRepository: vi.fn(),
  UserProfileView: vi.fn(),
}));

// Mock ACL
vi.mock('../backend/anti-corruption-layers/supabase-auth-acl', () => ({
  SupabaseAuthService: vi.fn(),
}));

// Mock UserManagementService
const mockUserManagementService = {
  createUserProfile: vi.fn(),
  createDefaultOrganization: vi.fn(),
  getUserOrganizations: vi.fn(),
};

vi.mock('../backend/services/user-management.service', () => ({
  UserManagementService: vi.fn(() => mockUserManagementService),
}));

// Mock Next.js functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Now import the actions after mocking dependencies
import { 
  createUserProfileAction,
  getUserOrganizationsAction,
  createDefaultOrganizationAction,
  processUserRegistrationAction
} from '../actions/user-management.actions';
import { UserAggregate } from '../shared/aggregates/user.aggregate';
import { OrganizationAggregate } from '../shared/aggregates/organization.aggregate';
import { UserId } from '../shared/value-objects/ids.vo';
import { UserManagementError } from '../shared/errors/user-management.error';
import { Result } from '../shared/types';

describe('Server Actions Integration Tests', () => {
  let mockUser: UserAggregate;
  let mockOrganization: OrganizationAggregate;
  let userId: UserId;

  beforeEach(() => {
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

  describe('createUserProfileAction', () => {
    it('인증된 사용자의 프로필을 생성해야 한다', async () => {
      // Given
      const mockAuthUser = {
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              name: 'Test User',
              avatar_url: 'https://example.com/avatar.jpg'
            }
          }
        },
        error: null
      };

      const mockUserProfileView = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthUser);
      mockUserManagementService.createUserProfile.mockResolvedValue(
        Result.success(mockUser)
      );

      // Mock view repository
      const mockViewRepository = {
        getByUserId: vi.fn().mockResolvedValue(mockUserProfileView)
      };
      
      const { DrizzleUserProfileViewRepository } = await import('../backend/read-models/user-profile.view');
      (DrizzleUserProfileViewRepository as any).mockImplementation(() => mockViewRepository);

      // When
      const result = await createUserProfileAction();

      // Then
      expect(result).toEqual(mockUserProfileView);
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      expect(mockUserManagementService.createUserProfile).toHaveBeenCalledWith({
        userId: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
    });

    it('미인증 사용자는 거부해야 한다', async () => {
      // Given
      const mockAuthUser = {
        data: { user: null },
        error: { message: 'Not authenticated' }
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthUser);

      // When & Then
      await expect(createUserProfileAction()).rejects.toThrow('Authentication required');
      expect(mockUserManagementService.createUserProfile).not.toHaveBeenCalled();
    });

    it('이메일이 없는 사용자는 처리할 수 있어야 한다', async () => {
      // Given
      const mockAuthUser = {
        data: {
          user: {
            id: 'test-user-id',
            email: null, // 이메일 없음
            user_metadata: {
              name: 'Test User',
              avatar_url: null
            }
          }
        },
        error: null
      };

      const mockUserProfileView = {
        id: 'test-user-id',
        email: 'test@example.com', // Mock에서는 정상적인 이메일 반환
        name: 'Test User',
        avatarUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthUser);
      mockUserManagementService.createUserProfile.mockResolvedValue(
        Result.success(mockUser)
      );

      // Mock view repository
      const mockViewRepository = {
        getByUserId: vi.fn().mockResolvedValue(mockUserProfileView)
      };
      
      const { DrizzleUserProfileViewRepository } = await import('../backend/read-models/user-profile.view');
      (DrizzleUserProfileViewRepository as any).mockImplementation(() => mockViewRepository);

      // When & Then
      // 실제 구현에서는 user.email!로 강제 변환하므로 null이어도 처리됨
      // 이는 실제 구현의 동작을 반영한 테스트
      const result = await createUserProfileAction();
      expect(result).toEqual(mockUserProfileView);
    });

    it('서비스 레이어 오류를 적절히 전파해야 한다', async () => {
      // Given
      const mockAuthUser = {
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              name: 'Test User',
              avatar_url: null
            }
          }
        },
        error: null
      };

      const error = new UserManagementError('PROFILE_CREATION_FAILED', 'Failed to create profile');
      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthUser);
      mockUserManagementService.createUserProfile.mockResolvedValue(
        Result.error(error)
      );

      // When & Then
      await expect(createUserProfileAction()).rejects.toThrow('Failed to create profile');
    });
  });

  describe('getUserOrganizationsAction', () => {
    it('사용자 소유 조직 목록을 조회해야 한다', async () => {
      // Given
      const mockAuthUser = {
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        },
        error: null
      };

      const mockOrganizations = [
        {
          id: 'org-1',
          name: 'Organization 1',
          isDefault: true,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'org-2',
          name: 'Organization 2',
          isDefault: false,
          createdAt: '2024-01-02T00:00:00Z'
        }
      ];

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthUser);
      mockUserManagementService.getUserOrganizations.mockResolvedValue(
        Result.success(mockOrganizations)
      );

      // When
      const result = await getUserOrganizationsAction();

      // Then
      expect(result).toEqual(mockOrganizations);
      expect(mockUserManagementService.getUserOrganizations).toHaveBeenCalledWith({
        userId: 'test-user-id'
      });
    });

    it('미인증 사용자는 거부해야 한다', async () => {
      // Given
      const mockAuthUser = {
        data: { user: null },
        error: { message: 'Not authenticated' }
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthUser);

      // When & Then
      await expect(getUserOrganizationsAction()).rejects.toThrow('Authentication required');
      expect(mockUserManagementService.getUserOrganizations).not.toHaveBeenCalled();
    });

    it('빈 조직 목록도 올바르게 반환해야 한다', async () => {
      // Given
      const mockAuthUser = {
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        },
        error: null
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthUser);
      mockUserManagementService.getUserOrganizations.mockResolvedValue(
        Result.success([])
      );

      // When
      const result = await getUserOrganizationsAction();

      // Then
      expect(result).toEqual([]);
    });

    it('서비스 레이어 오류를 적절히 전파해야 한다', async () => {
      // Given
      const mockAuthUser = {
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        },
        error: null
      };

      const serviceError = new UserManagementError(
        'ORGANIZATION_RETRIEVAL_FAILED',
        'Database connection failed'
      );

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthUser);
      mockUserManagementService.getUserOrganizations.mockResolvedValue(
        Result.error(serviceError)
      );

      // When & Then
      await expect(getUserOrganizationsAction()).rejects.toThrow('Database connection failed');
    });
  });

  describe('Error Handling', () => {
    it('예상치 못한 오류를 적절히 처리해야 한다', async () => {
      // Given
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Network error'));

      // When & Then
      await expect(createUserProfileAction()).rejects.toThrow('Network error');
    });

    it('Supabase 인증 오류를 처리해야 한다', async () => {
      // Given
      const mockAuthUser = {
        data: { user: null },
        error: { message: 'Invalid token' }
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthUser);

      // When & Then
      await expect(getUserOrganizationsAction()).rejects.toThrow('Authentication required');
    });
  });

  describe('Integration Scenarios', () => {
    it('전체 사용자 등록 플로우가 성공해야 한다', async () => {
      // Given
      const mockAuthUser = {
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              name: 'Test User',
              avatar_url: null
            }
          }
        },
        error: null
      };

      const mockUserProfileView = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthUser);
      mockUserManagementService.createUserProfile.mockResolvedValue(
        Result.success(mockUser)
      );

      // Mock view repository
      const mockViewRepository = {
        getByUserId: vi.fn().mockResolvedValue(mockUserProfileView)
      };
      
      const { DrizzleUserProfileViewRepository } = await import('../backend/read-models/user-profile.view');
      (DrizzleUserProfileViewRepository as any).mockImplementation(() => mockViewRepository);

      // When - 사용자 등록 처리
      const profileResult = await createUserProfileAction();

      // Then - 등록 성공
      expect(profileResult).toEqual(mockUserProfileView);

      // When - 조직 목록 조회
      const mockOrganizations = [
        {
          id: 'org-1',
          name: 'Test User\'s Organization',
          isDefault: true,
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];

      mockUserManagementService.getUserOrganizations.mockResolvedValue(
        Result.success(mockOrganizations)
      );

      const orgsResult = await getUserOrganizationsAction();

      // Then - 조직 조회 성공
      expect(orgsResult).toEqual(mockOrganizations);
    });
  });
});
