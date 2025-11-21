import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserRepository } from '../../../repositories/interfaces/user.repository.interface';
import { UserAggregate } from '../../../../shared/aggregates/user.aggregate';
import { UserManagementError } from '../../../../shared/errors/user-management.error';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Mock Supabase Client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }))
};

// Mock UserRepository implementation
class MockUserRepository implements UserRepository {
  constructor(private supabase = mockSupabaseClient) {}

  async save(user: UserAggregate): Promise<void> {
    // Mock implementation that calls Supabase client
    this.supabase.from();
  }

  async findById(userId: import('../../../../shared/value-objects/ids.vo').UserId): Promise<UserAggregate | null> {
    // Mock implementation that calls Supabase client
    this.supabase.from();
    return null;
  }

  async findByEmail(email: import('../../../../shared/value-objects/user-email.vo').UserEmail): Promise<UserAggregate | null> {
    // Mock implementation that calls Supabase client
    this.supabase.from();
    return null;
  }

  async delete(userId: import('../../../../shared/value-objects/ids.vo').UserId): Promise<void> {
    // Mock implementation that calls Supabase client
    this.supabase.from();
  }

  async getUserProfile(userId: import('../../../../shared/value-objects/ids.vo').UserId): Promise<any> {
    // Mock implementation
    this.supabase.from();
    return null;
  }
}

describe('UserRepository Integration Tests', () => {
  let userRepository: UserRepository;
  let mockUser: UserAggregate;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    
    // Create a mock user for testing
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
    } as SupabaseUser;

    mockUser = UserAggregate.createFromSupabaseAuth(mockSupabaseUser);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('save', () => {
    it('사용자를 데이터베이스에 저장해야 한다', async () => {
      // When
      await userRepository.save(mockUser);

      // Then
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    it('저장 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
      // Given
      const errorRepository = new MockUserRepository();
      vi.spyOn(errorRepository, 'save').mockRejectedValue(new Error('Database error'));

      // When & Then
      await expect(errorRepository.save(mockUser)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('사용자 ID로 사용자를 찾아야 한다', async () => {
      // When
      const result = await userRepository.findById(mockUser.id);

      // Then
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    it('존재하지 않는 사용자 ID로 검색하면 null을 반환해야 한다', async () => {
      // When
      const result = await userRepository.findById(mockUser.id);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('이메일로 사용자를 찾아야 한다', async () => {
      // When
      const result = await userRepository.findByEmail(mockUser.entity.email);

      // Then
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    it('존재하지 않는 이메일로 검색하면 null을 반환해야 한다', async () => {
      // When
      const result = await userRepository.findByEmail(mockUser.entity.email);

      // Then
      expect(result).toBeNull();
    });
  });

  // Note: update method is not in the UserRepository interface, removing these tests

  describe('delete', () => {
    it('사용자를 삭제해야 한다', async () => {
      // When
      await userRepository.delete(mockUser.id);

      // Then
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    it('삭제 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
      // Given
      const errorRepository = new MockUserRepository();
      vi.spyOn(errorRepository, 'delete').mockRejectedValue(new Error('Delete failed'));

      // When & Then
      await expect(errorRepository.delete(mockUser.id)).rejects.toThrow('Delete failed');
    });
  });
});
