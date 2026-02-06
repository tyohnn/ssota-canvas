// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Supabase client first before any imports
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(function () {
    return mockSupabaseClient;
  }),
}));

// Mock database to prevent POSTGRES_URL error
vi.mock('@/db', () => ({
  db: {},
  createDrizzleSupabaseClient: vi.fn(),
}));

// Mock schema
vi.mock('@/db/schema', () => ({
  profiles: {},
  organizations: {},
}));

// Mock repositories (Vitest 4: constructor mocks must use function/class)
vi.mock('../backend/repositories/implementations/drizzle-user.repository', () => ({
  DrizzleUserRepository: vi.fn(function () {}),
}));

vi.mock('../backend/repositories/implementations/drizzle-organization.repository', () => ({
  DrizzleOrganizationRepository: vi.fn(function () {}),
}));

// Mock read models
vi.mock('../backend/read-models/user-profile.view', () => ({
  DrizzleUserProfileViewRepository: vi.fn(function () {}),
  UserProfileView: vi.fn(function () {}),
}));

// Mock ACL
vi.mock('../backend/anti-corruption-layers/supabase-auth-acl', () => ({
  SupabaseAuthService: vi.fn(function () {}),
}));

// Mock UserManagementService
const mockUserManagementService = {
  createUserProfile: vi.fn(),
  createDefaultOrganization: vi.fn(),
  getUserOrganizations: vi.fn(),
};

vi.mock('../backend/services/user-management.service', () => ({
  UserManagementService: vi.fn(function () {
    return mockUserManagementService;
  }),
}));

// Mock Organization Management Actions
vi.mock('@/domains/organization-management/actions/organization-management.actions', () => ({
  getUserOrganizationsAction: vi.fn(),
  createDefaultOrganizationAction: vi.fn(),
  createOrganizationAction: vi.fn(),
}));

// Mock Next.js functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Now import the actions after mocking dependencies
import { createUserProfileAction } from '../actions/create-user-profile.action';
import {
  createDefaultOrganizationAction,
  getUserOrganizationsAction,
} from '@/domains/organization-management/actions/organization-management.actions';
import { UserAggregate } from '../shared/aggregates/user.aggregate';
import { UserManagementError } from '../shared/errors/user-management.error';
import { Result } from '@/utils/result';

describe('Server Actions Integration Tests', () => {
  let mockUser: UserAggregate;

  beforeEach(() => {
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
      const result = await createUserProfileAction({});

      // Then (ActionResult)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockUserProfileView);
      }
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      expect(mockUserManagementService.createUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: expect.any(Object),
        }),
        undefined
      );
    });

    it('미인증 사용자는 거부해야 한다', async () => {
      // Given
      const mockAuthUser = {
        data: { user: null },
        error: { message: 'Not authenticated' }
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthUser);

      // When
      const result = await createUserProfileAction({});

      // Then (ActionResult: success false, no throw)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('UNAUTHORIZED');
      }
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

      // When & Then (ActionResult)
      const result = await createUserProfileAction({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockUserProfileView);
      }
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

      // When
      const result = await createUserProfileAction({});

      // Then (ActionResult: success false)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to create profile');
      }
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

      // When (secure action catches and returns ActionResult)
      const result = await createUserProfileAction({});

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('UNAUTHORIZED');
      }
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
      const profileResult = await createUserProfileAction({});

      // Then - 등록 성공 (ActionResult)
      expect(profileResult.success).toBe(true);
      if (profileResult.success) {
        expect(profileResult.data).toEqual(mockUserProfileView);
      }

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

  describe('processUserRegistrationAction', () => {
    it('프로필 → 조직 → 워크스페이스 → 페이지 생성 전체 플로우가 성공해야 한다', async () => {
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

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthUser);
      mockUserManagementService.createUserProfile.mockResolvedValue(
        Result.success(mockUser)
      );

      // Mock: Organization + Workspace + Page 생성 성공
      const mockOrgWithWorkspaceAndPage = {
        organization: {
          id: 'org-123',
          name: "Test User's Organization",
          organizationType: 'personal' as const,
          isDefault: true,
          role: 'owner' as const,
          createdAt: '2024-01-01T00:00:00Z',
        },
        workspace: {
          id: 'workspace-123',
          name: 'Default Workspace',
          isDefault: true,
        },
        page: {
          id: 'page-123',
          title: 'Welcome',
          icon: '👋',
        },
        personalWorkspace: {
          id: 'personal-workspace-123',
          name: 'Test User의 개인 워크스페이스',
          isDefault: false,
        },
        personalPage: {
          id: 'personal-page-123',
          title: 'Untitled',
          icon: 'File',
        },
        redirectUrl: '/r/page-123',
      };

      vi.mocked(createDefaultOrganizationAction).mockResolvedValue(mockOrgWithWorkspaceAndPage);

      // When
      const { processUserRegistrationAction } = await import('../actions/process-user-registration.action');
      const result = await processUserRegistrationAction({});

      // Then (ActionResult: result.data)
      expect(result.success).toBe(true);
      if (!result.success) return;
      const data = result.data;
      expect(data.user.id).toBe('test-user-id');
      expect(data.user.email).toBe('test@example.com');
      expect(data.organization.id).toBe('org-123');
      expect(data.organization.isDefault).toBe(true);
      expect(data.workspace.id).toBe('workspace-123');
      expect(data.workspace.name).toBe('Default Workspace');
      expect(data.page.id).toBe('page-123');
      expect(data.page.title).toBe('Welcome');
      expect(data.personalWorkspace.id).toBe('personal-workspace-123'); // v1.2
      expect(data.personalPage.id).toBe('personal-page-123'); // v1.2
      expect(data.redirectUrl).toMatch(/^\/r\/[a-z0-9-]+$/);
    });

    it('프로필 생성 실패 시 전체 플로우가 중단되어야 한다', async () => {
      // Given
      const mockAuthUser = {
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: { name: 'Test User' }
          }
        },
        error: null
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthUser);
      mockUserManagementService.createUserProfile.mockResolvedValue(
        Result.error(new UserManagementError(
          'PROFILE_CREATION_FAILED',
          'Failed to create user profile'
        ))
      );

      // When
      const { processUserRegistrationAction } = await import('../actions/process-user-registration.action');
      const result = await processUserRegistrationAction({});

      // Then (ActionResult: success false)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to create user profile');
      }
    });
  });
});
