import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SupabaseAuthService, SupabaseAuthACL, DomainUser, AuthResult, SessionInfo } from '../../../backend/anti-corruption-layers/supabase-auth-acl';
import { User as SupabaseUser, Session, AuthResponse } from '@supabase/supabase-js';

// Mock Supabase Client
const mockSupabaseClient = {
  auth: {
    signInWithOAuth: vi.fn(),
    getUser: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
  },
};

describe('SupabaseAuthACL Tests', () => {
  describe('toDomainUser', () => {
    it('완전한 Supabase User를 DomainUser로 변환해야 한다', () => {
      // Given
      const supabaseUser: SupabaseUser = {
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
      } as SupabaseUser;

      // When
      const domainUser = SupabaseAuthACL.toDomainUser(supabaseUser);

      // Then
      expect(domainUser).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: new Date('2024-01-01T00:00:00Z')
      });
    });

    it('이메일이 없는 Supabase User를 처리해야 한다', () => {
      // Given
      const supabaseUser: SupabaseUser = {
        id: 'test-user-id',
        email: null,
        user_metadata: {
          name: 'Test User',
          avatar_url: null
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      } as unknown as SupabaseUser;

      // When
      const domainUser = SupabaseAuthACL.toDomainUser(supabaseUser);

      // Then
      expect(domainUser.email).toBe('');
      expect(domainUser.name).toBe('Test User');
      expect(domainUser.avatarUrl).toBe(null);
    });

    it('메타데이터가 없는 Supabase User를 처리해야 한다', () => {
      // Given
      const supabaseUser: SupabaseUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      } as SupabaseUser;

      // When
      const domainUser = SupabaseAuthACL.toDomainUser(supabaseUser);

      // Then
      expect(domainUser.name).toBe('User');
      expect(domainUser.avatarUrl).toBe(null);
    });

    it('빈 메타데이터를 가진 Supabase User를 처리해야 한다', () => {
      // Given
      const supabaseUser: SupabaseUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          name: '',
          avatar_url: ''
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      } as SupabaseUser;

      // When
      const domainUser = SupabaseAuthACL.toDomainUser(supabaseUser);

      // Then
      expect(domainUser.name).toBe('User'); // 빈 문자열은 기본값으로 대체
      expect(domainUser.avatarUrl).toBe(null); // 빈 문자열은 null로 변환
    });

    it('잘못된 날짜 형식을 처리해야 한다', () => {
      // Given
      const supabaseUser: SupabaseUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
          avatar_url: null
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: 'invalid-date',
        updated_at: '2024-01-01T00:00:00Z'
      } as SupabaseUser;

      // When
      const domainUser = SupabaseAuthACL.toDomainUser(supabaseUser);

      // Then
      expect(domainUser.createdAt).toBeInstanceOf(Date);
      expect(isNaN(domainUser.createdAt.getTime())).toBe(true); // Invalid Date
    });
  });

  describe('toSupabaseUser', () => {
    it('DomainUser를 Supabase User로 변환해야 한다', () => {
      // Given
      const domainUser: DomainUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: new Date('2024-01-01T00:00:00Z')
      };

      // When
      const supabaseUser = SupabaseAuthACL.toSupabaseUser(domainUser);

      // Then
      expect(supabaseUser).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg'
        }
      });
    });

    it('avatarUrl이 null인 DomainUser를 처리해야 한다', () => {
      // Given
      const domainUser: DomainUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        createdAt: new Date('2024-01-01T00:00:00Z')
      };

      // When
      const supabaseUser = SupabaseAuthACL.toSupabaseUser(domainUser);

      // Then
      expect(supabaseUser.user_metadata?.avatar_url).toBe(null);
    });
  });

  describe('toAuthResult', () => {
    it('성공적인 AuthResponse를 AuthResult로 변환해야 한다', () => {
      // Given
      const authResponse: AuthResponse = {
        data: {
          user: {
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
          } as SupabaseUser,
          session: null
        },
        error: null
      };

      // When
      const authResult = SupabaseAuthACL.toAuthResult(authResponse);

      // Then
      expect(authResult.success).toBe(true);
      expect(authResult.user).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: new Date('2024-01-01T00:00:00Z')
      });
      expect(authResult.error).toBeUndefined();
    });

    it('실패한 AuthResponse를 AuthResult로 변환해야 한다', () => {
      // Given
      const authResponse: AuthResponse = {
        data: {
          user: null,
          session: null
        },
        error: {
          message: 'Authentication failed',
          status: 401,
          code: 'invalid_grant',
          __isAuthError: true,
          name: 'AuthError',
          severity: 'error'
        } as any
      };

      // When
      const authResult = SupabaseAuthACL.toAuthResult(authResponse);

      // Then
      expect(authResult.success).toBe(false);
      expect(authResult.user).toBeUndefined();
      expect(authResult.error).toBe('Authentication failed');
    });

    it('사용자 없이 성공한 AuthResponse를 처리해야 한다', () => {
      // Given
      const authResponse: AuthResponse = {
        data: {
          user: null,
          session: null
        },
        error: null
      };

      // When
      const authResult = SupabaseAuthACL.toAuthResult(authResponse);

      // Then
      expect(authResult.success).toBe(true);
      expect(authResult.user).toBeUndefined();
      expect(authResult.error).toBeUndefined();
    });
  });

  describe('toSessionInfo', () => {
    it('Session을 SessionInfo로 변환해야 한다', () => {
      // Given
      const session: Session = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        expires_at: 1704067200, // 2024-01-01 00:00:00 UTC timestamp
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        } as SupabaseUser
      };

      // When
      const sessionInfo = SupabaseAuthACL.toSessionInfo(session);

      // Then
      expect(sessionInfo).toEqual({
        userId: 'test-user-id',
        email: 'test@example.com',
        expiresAt: new Date(1704067200 * 1000),
        accessToken: 'access-token-123'
      });
    });

    it('이메일이 없는 Session을 처리해야 한다', () => {
      // Given
      const session: Session = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        expires_at: 1704067200,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          email: null,
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        } as unknown as SupabaseUser
      };

      // When
      const sessionInfo = SupabaseAuthACL.toSessionInfo(session);

      // Then
      expect(sessionInfo.email).toBe('');
    });

    it('expires_at이 없는 Session을 처리해야 한다', () => {
      // Given
      const session: Session = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        expires_at: undefined,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        } as SupabaseUser
      };

      // When
      const sessionInfo = SupabaseAuthACL.toSessionInfo(session);

      // Then
      expect(sessionInfo.expiresAt).toEqual(new Date(0));
    });
  });
});

describe('SupabaseAuthService Tests', () => {
  let supabaseAuthService: SupabaseAuthService;

  beforeEach(() => {
    supabaseAuthService = new SupabaseAuthService(mockSupabaseClient as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('성공적인 Google 로그인을 처리해야 한다', async () => {
      // Given
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-url.com', provider: 'google' },
        error: null
      });

      // When
      const result = await supabaseAuthService.signInWithGoogle();

      // Then
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google'
      });
    });

    it('Google 로그인 실패를 처리해야 한다', async () => {
      // Given
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth provider error', status: 400 }
      });

      // When
      const result = await supabaseAuthService.signInWithGoogle();

      // Then
      expect(result.success).toBe(false);
      expect(result.error).toBe('OAuth provider error');
    });

    it('예외 발생 시 에러를 처리해야 한다', async () => {
      // Given
      mockSupabaseClient.auth.signInWithOAuth.mockRejectedValue(new Error('Network error'));

      // When
      const result = await supabaseAuthService.signInWithGoogle();

      // Then
      expect(result.success).toBe(false);
      expect(result.error).toBe('Login failed');
    });
  });

  describe('getCurrentUser', () => {
    it('현재 로그인된 사용자를 반환해야 한다', async () => {
      // Given
      const mockSupabaseUser: SupabaseUser = {
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
      } as SupabaseUser;

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null
      });

      // When
      const result = await supabaseAuthService.getCurrentUser();

      // Then
      expect(result).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: new Date('2024-01-01T00:00:00Z')
      });
    });

    it('로그인되지 않은 사용자에 대해 null을 반환해야 한다', async () => {
      // Given
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      // When
      const result = await supabaseAuthService.getCurrentUser();

      // Then
      expect(result).toBe(null);
    });

    it('인증 에러가 발생해도 null을 반환해야 한다', async () => {
      // Given
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token', status: 401 }
      });

      // When
      const result = await supabaseAuthService.getCurrentUser();

      // Then
      expect(result).toBe(null);
    });
  });

  describe('signOut', () => {
    it('로그아웃을 처리해야 한다', async () => {
      // Given
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      // When
      await supabaseAuthService.signOut();

      // Then
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('로그아웃 실패를 처리해야 한다', async () => {
      // Given
      mockSupabaseClient.auth.signOut.mockRejectedValue(new Error('Signout failed'));

      // When & Then
      await expect(supabaseAuthService.signOut()).rejects.toThrow('Signout failed');
    });
  });

  describe('getSession', () => {
    it('현재 세션을 반환해야 한다', async () => {
      // Given
      const mockSession: Session = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        expires_at: 1704067200,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        } as SupabaseUser
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      // When
      const result = await supabaseAuthService.getSession();

      // Then
      expect(result).toEqual({
        userId: 'test-user-id',
        email: 'test@example.com',
        expiresAt: new Date(1704067200 * 1000),
        accessToken: 'access-token-123'
      });
    });

    it('세션이 없을 때 null을 반환해야 한다', async () => {
      // Given
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      // When
      const result = await supabaseAuthService.getSession();

      // Then
      expect(result).toBe(null);
    });

    it('세션 조회 에러를 처리해야 한다', async () => {
      // Given
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired', status: 401 }
      });

      // When
      const result = await supabaseAuthService.getSession();

      // Then
      expect(result).toBe(null);
    });
  });

  describe('Edge Cases', () => {
    it('매우 긴 이름을 가진 사용자를 처리해야 한다', async () => {
      // Given
      const longName = 'A'.repeat(1000);
      const mockSupabaseUser: SupabaseUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          name: longName,
          avatar_url: null
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      } as SupabaseUser;

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null
      });

      // When
      const result = await supabaseAuthService.getCurrentUser();

      // Then
      expect(result?.name).toBe(longName);
    });

    it('특수 문자가 포함된 사용자 정보를 처리해야 한다', async () => {
      // Given
      const specialName = '테스트 사용자!@#$%^&*()_+-=[]{}|;:,.<>? 🚀';
      const mockSupabaseUser: SupabaseUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          name: specialName,
          avatar_url: 'https://example.com/avatar.jpg?param=value&other=123'
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      } as SupabaseUser;

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null
      });

      // When
      const result = await supabaseAuthService.getCurrentUser();

      // Then
      expect(result?.name).toBe(specialName);
      expect(result?.avatarUrl).toBe('https://example.com/avatar.jpg?param=value&other=123');
    });

    it('동시에 여러 요청이 들어와도 안전해야 한다', async () => {
      // Given
      const mockSupabaseUser: SupabaseUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
          avatar_url: null
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      } as SupabaseUser;

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null
      });

      // When
      const promises = Array(10).fill(null).map(() => 
        supabaseAuthService.getCurrentUser()
      );
      const results = await Promise.all(promises);

      // Then
      results.forEach(result => {
        expect(result?.id).toBe('test-user-id');
        expect(result?.email).toBe('test@example.com');
      });
    });
  });
});
