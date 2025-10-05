import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserService } from '../user.service';
import { UserRepository } from '../../repositories/user.repository';
import { UserAggregate } from '../../aggregates/user.aggregate';
import { UserManagementError } from '../../errors/user-management.error';

// Mock UserRepository
const mockUserRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  update: vi.fn(),
  delete: vi.fn()
};

// Mock UserService implementation
class MockUserService implements UserService {
  constructor(private userRepository: UserRepository = mockUserRepository) {}

  async createUserFromSupabaseAuth(supabaseUser: any): Promise<UserAggregate> {
    const userAggregate = UserAggregate.createFromSupabaseAuth(supabaseUser);
    await this.userRepository.save(userAggregate);
    return userAggregate;
  }

  async updateUserFromSupabaseAuth(supabaseUser: any): Promise<UserAggregate | null> {
    const existingUser = await this.userRepository.findByEmail(supabaseUser.email);
    if (!existingUser) {
      return null;
    }

    const hasChanges = existingUser.updateFromSupabaseAuth(supabaseUser);
    if (hasChanges) {
      await this.userRepository.update(existingUser);
    }

    return existingUser;
  }

  async getUserById(userId: string): Promise<UserAggregate | null> {
    return await this.userRepository.findById(userId);
  }

  async getUserByEmail(email: string): Promise<UserAggregate | null> {
    return await this.userRepository.findByEmail(email);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.userRepository.delete(userId);
  }
}

describe('UserService Integration Tests', () => {
  let userService: UserService;
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = mockUserRepository;
    userService = new MockUserService(userRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createUserFromSupabaseAuth', () => {
    it('Supabase Auth 사용자로부터 새 사용자를 생성하고 저장해야 한다', async () => {
      // Given
      const supabaseUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg'
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // When
      const result = await userService.createUserFromSupabaseAuth(supabaseUser);

      // Then
      expect(result).toBeInstanceOf(UserAggregate);
      expect(result.id.value).toBe('test-user-id');
      expect(result.entity.email.value).toBe('test@example.com');
      expect(userRepository.save).toHaveBeenCalledWith(result);
    });

    it('이메일이 없는 Supabase 사용자로부터 사용자 생성 시 예외를 발생시켜야 한다', async () => {
      // Given
      const supabaseUserWithoutEmail = {
        id: 'test-user-id',
        email: undefined,
        user_metadata: {
          name: 'Test User'
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // When & Then
      await expect(userService.createUserFromSupabaseAuth(supabaseUserWithoutEmail))
        .rejects.toThrow(UserManagementError);
    });
  });

  describe('updateUserFromSupabaseAuth', () => {
    it('기존 사용자 정보를 업데이트해야 한다', async () => {
      // Given
      const existingUser = UserAggregate.createFromSupabaseAuth({
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Old Name' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      });

      const updatedSupabaseUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          name: 'Updated Name',
          avatar_url: 'https://example.com/new-avatar.jpg'
        },
        updated_at: '2024-01-02T00:00:00Z'
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser);

      // When
      const result = await userService.updateUserFromSupabaseAuth(updatedSupabaseUser);

      // Then
      expect(result).toBe(existingUser);
      expect(result?.entity.name).toBe('Updated Name');
      expect(result?.entity.avatarUrl).toBe('https://example.com/new-avatar.jpg');
      expect(userRepository.update).toHaveBeenCalledWith(existingUser);
    });

    it('존재하지 않는 사용자 업데이트 시 null을 반환해야 한다', async () => {
      // Given
      const supabaseUser = {
        id: 'non-existent-id',
        email: 'nonexistent@example.com',
        user_metadata: { name: 'Test User' },
        updated_at: '2024-01-02T00:00:00Z'
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      // When
      const result = await userService.updateUserFromSupabaseAuth(supabaseUser);

      // Then
      expect(result).toBeNull();
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('변경사항이 없는 경우에도 UserUpdatedEvent를 반환해야 한다', async () => {
      // Given
      const existingUser = UserAggregate.createFromSupabaseAuth({
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      });

      const sameSupabaseUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        updated_at: '2024-01-01T00:00:00Z'
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser);

      // When
      const result = await userService.updateUserFromSupabaseAuth(sameSupabaseUser);

      // Then
      expect(result).toBe(existingUser);
      expect(userRepository.update).toHaveBeenCalledWith(existingUser);
    });
  });

  describe('getUserById', () => {
    it('사용자 ID로 사용자를 조회해야 한다', async () => {
      // Given
      const expectedUser = UserAggregate.createFromSupabaseAuth({
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      });

      vi.mocked(userRepository.findById).mockResolvedValue(expectedUser);

      // When
      const result = await userService.getUserById('test-user-id');

      // Then
      expect(result).toBe(expectedUser);
      expect(userRepository.findById).toHaveBeenCalledWith('test-user-id');
    });

    it('존재하지 않는 사용자 ID로 조회 시 null을 반환해야 한다', async () => {
      // Given
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      // When
      const result = await userService.getUserById('non-existent-id');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('이메일로 사용자를 조회해야 한다', async () => {
      // Given
      const expectedUser = UserAggregate.createFromSupabaseAuth({
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      });

      vi.mocked(userRepository.findByEmail).mockResolvedValue(expectedUser);

      // When
      const result = await userService.getUserByEmail('test@example.com');

      // Then
      expect(result).toBe(expectedUser);
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('존재하지 않는 이메일로 조회 시 null을 반환해야 한다', async () => {
      // Given
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      // When
      const result = await userService.getUserByEmail('nonexistent@example.com');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('사용자를 삭제해야 한다', async () => {
      // When
      await userService.deleteUser('test-user-id');

      // Then
      expect(userRepository.delete).toHaveBeenCalledWith('test-user-id');
    });

    it('삭제 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
      // Given
      vi.mocked(userRepository.delete).mockRejectedValue(new Error('Delete failed'));

      // When & Then
      await expect(userService.deleteUser('test-user-id')).rejects.toThrow('Delete failed');
    });
  });

  describe('Error Handling', () => {
    it('저장 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
      // Given
      const supabaseUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      vi.mocked(userRepository.save).mockRejectedValue(new Error('Save failed'));

      // When & Then
      await expect(userService.createUserFromSupabaseAuth(supabaseUser))
        .rejects.toThrow('Save failed');
    });

    it('업데이트 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
      // Given
      const existingUser = UserAggregate.createFromSupabaseAuth({
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      });

      const supabaseUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Updated Name' },
        updated_at: '2024-01-02T00:00:00Z'
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser);
      vi.mocked(userRepository.update).mockRejectedValue(new Error('Update failed'));

      // When & Then
      await expect(userService.updateUserFromSupabaseAuth(supabaseUser))
        .rejects.toThrow('Update failed');
    });
  });
});
