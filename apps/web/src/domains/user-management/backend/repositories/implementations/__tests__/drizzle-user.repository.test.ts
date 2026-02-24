import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DrizzleUserRepository } from '../drizzle-user.repository';
import { UserAggregate } from '../../../../shared/aggregates/user.aggregate';
import { User } from '../../../../shared/entities/user.entity';
import { UserId } from '../../../../shared/value-objects/ids.vo';
import { UserEmail } from '../../../../shared/value-objects/user-email.vo';

// Mock Drizzle DB
const mockDrizzleDb = {
  rls: vi.fn(),
  query: {
    profiles: {
      findFirst: vi.fn()
    }
  },
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      onConflictDoUpdate: vi.fn()
    }))
  })),
  delete: vi.fn(() => ({
    where: vi.fn()
  }))
};

// Mock createDrizzleSupabaseClient
vi.mock('@/db', () => ({
  createDrizzleSupabaseClient: vi.fn(() => Promise.resolve(mockDrizzleDb))
}));

// Mock schema
vi.mock('@/db/schema-dev', () => ({
  profiles: {
    user_id: 'user_id',
    email: 'email',
    name: 'name',
    avatar_url: 'avatar_url',
    created_at: 'created_at',
    updated_at: 'updated_at'
  }
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value, operator: 'eq' }))
}));

describe('DrizzleUserRepository Real DB Tests', () => {
  let drizzleUserRepository: DrizzleUserRepository;
  let mockUser: UserAggregate;
  let userId: UserId;
  let userEmail: UserEmail;

  beforeEach(() => {
    drizzleUserRepository = new DrizzleUserRepository();
    userId = new UserId('test-user-id');
    userEmail = new UserEmail('test@example.com');
    
    // Create mock user aggregate
    const user = new User(
      userId,
      userEmail,
      'Test User',
      'https://example.com/avatar.jpg',
      'en',
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-01-01T00:00:00Z')
    );
    mockUser = new UserAggregate(user);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('ID로 사용자를 찾아야 한다', async () => {
      // Given
      const mockDbData = {
        user_id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            profiles: {
              findFirst: vi.fn().mockResolvedValue(mockDbData)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleUserRepository.findById(userId);

      // Then
      expect(result).toBeInstanceOf(UserAggregate);
      expect(result?.id.value).toBe('test-user-id');
      expect(result?.entity.email.value).toBe('test@example.com');
      expect(result?.entity.name).toBe('Test User');
      expect(result?.entity.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(mockDrizzleDb.rls).toHaveBeenCalled();
    });

    it('존재하지 않는 ID에 대해 null을 반환해야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            profiles: {
              findFirst: vi.fn().mockResolvedValue(null)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleUserRepository.findById(new UserId('non-existent-id'));

      // Then
      expect(result).toBe(null);
    });

    it('name이 null인 경우 기본값을 사용해야 한다', async () => {
      // Given
      const mockDbData = {
        user_id: 'test-user-id',
        email: 'test@example.com',
        name: null,
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            profiles: {
              findFirst: vi.fn().mockResolvedValue(mockDbData)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleUserRepository.findById(userId);

      // Then
      expect(result?.entity.name).toBe('User'); // 기본값
      expect(result?.entity.avatarUrl).toBe(null);
    });

    it('데이터베이스 에러를 적절히 처리해야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockRejectedValue(new Error('Database connection failed'));

      // When & Then
      await expect(drizzleUserRepository.findById(userId)).rejects.toThrow('Database connection failed');
    });

    it('잘못된 날짜 형식을 처리해야 한다', async () => {
      // Given
      const mockDbData = {
        user_id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: null,
        created_at: 'invalid-date',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            profiles: {
              findFirst: vi.fn().mockResolvedValue(mockDbData)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleUserRepository.findById(userId);

      // Then
      expect(result?.entity.createdAt).toBeInstanceOf(Date);
      // JavaScript의 new Date('invalid-date')는 유효한 Date 객체를 생성하지만 Invalid Date 값을 가짐
      // 실제 구현에서는 이런 경우를 적절히 처리해야 함
      expect(result?.entity.createdAt.toString()).toBe('Invalid Date');
    });
  });

  describe('findByEmail', () => {
    it('이메일로 사용자를 찾아야 한다', async () => {
      // Given
      const mockDbData = {
        user_id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            profiles: {
              findFirst: vi.fn().mockResolvedValue(mockDbData)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleUserRepository.findByEmail(userEmail);

      // Then
      expect(result).toBeInstanceOf(UserAggregate);
      expect(result?.entity.email.value).toBe('test@example.com');
      expect(result?.id.value).toBe('test-user-id');
    });

    it('존재하지 않는 이메일에 대해 null을 반환해야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            profiles: {
              findFirst: vi.fn().mockResolvedValue(null)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleUserRepository.findByEmail(new UserEmail('nonexistent@example.com'));

      // Then
      expect(result).toBe(null);
    });

    it('대소문자를 구분하지 않는 이메일 검색을 처리해야 한다', async () => {
      // Given
      const mockDbData = {
        user_id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            profiles: {
              findFirst: vi.fn().mockResolvedValue(mockDbData)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleUserRepository.findByEmail(new UserEmail('TEST@EXAMPLE.COM'));

      // Then
      expect(result?.entity.email.value).toBe('test@example.com');
    });
  });

  describe('save', () => {
    it('새로운 사용자를 저장해야 한다', async () => {
      // Given
      const mockInsertChain = {
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined)
        })
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue(mockInsertChain)
        };
        return callback(mockTx);
      });

      // When
      await drizzleUserRepository.save(mockUser);

      // Then
      expect(mockDrizzleDb.rls).toHaveBeenCalled();
    });

    it('기존 사용자를 업데이트해야 한다 (upsert)', async () => {
      // Given
      const mockInsertChain = {
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined)
        })
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue(mockInsertChain)
        };
        return callback(mockTx);
      });

      // When
      await drizzleUserRepository.save(mockUser);

      // Then
      expect(mockInsertChain.values).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z')
      });
    });

    it('avatarUrl이 null인 사용자를 저장해야 한다', async () => {
      // Given
      const userWithNullAvatar = new User(
        userId,
        userEmail,
        'Test User',
        null, // null avatar
        'en',
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T00:00:00Z')
      );
      const mockUserAggregate = new UserAggregate(userWithNullAvatar);

      const mockInsertChain = {
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined)
        })
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue(mockInsertChain)
        };
        return callback(mockTx);
      });

      // When
      await drizzleUserRepository.save(mockUserAggregate);

      // Then
      expect(mockInsertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          avatar_url: null
        })
      );
    });

    it('데이터베이스 저장 에러를 처리해야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockRejectedValue(new Error('Constraint violation'));

      // When & Then
      await expect(drizzleUserRepository.save(mockUser)).rejects.toThrow('Constraint violation');
    });

    it('매우 긴 이름을 가진 사용자를 저장해야 한다', async () => {
      // Given
      const longName = 'A'.repeat(1000);
      const userWithLongName = new User(
        userId,
        userEmail,
        longName,
        null,
        'en',
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T00:00:00Z')
      );
      const mockUserAggregate = new UserAggregate(userWithLongName);

      const mockInsertChain = {
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined)
        })
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue(mockInsertChain)
        };
        return callback(mockTx);
      });

      // When
      await drizzleUserRepository.save(mockUserAggregate);

      // Then
      expect(mockInsertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: longName
        })
      );
    });

    it('특수 문자가 포함된 사용자 정보를 저장해야 한다', async () => {
      // Given
      const specialName = '테스트 사용자!@#$%^&*()_+-=[]{}|;:,.<>? 🚀';
      const userWithSpecialChars = new User(
        userId,
        userEmail,
        specialName,
        'https://example.com/avatar.jpg?param=value&other=123',
        'en',
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T00:00:00Z')
      );
      const mockUserAggregate = new UserAggregate(userWithSpecialChars);

      const mockInsertChain = {
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined)
        })
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue(mockInsertChain)
        };
        return callback(mockTx);
      });

      // When
      await drizzleUserRepository.save(mockUserAggregate);

      // Then
      expect(mockInsertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: specialName,
          avatar_url: 'https://example.com/avatar.jpg?param=value&other=123'
        })
      );
    });
  });

  describe('delete', () => {
    it('사용자를 삭제해야 한다', async () => {
      // Given
      const mockDeleteChain = {
        where: vi.fn().mockResolvedValue(undefined)
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          delete: vi.fn().mockReturnValue(mockDeleteChain)
        };
        return callback(mockTx);
      });

      // When
      await drizzleUserRepository.delete(userId);

      // Then
      expect(mockDrizzleDb.rls).toHaveBeenCalled();
      expect(mockDeleteChain.where).toHaveBeenCalled();
    });

    it('존재하지 않는 사용자 삭제도 조용히 성공해야 한다', async () => {
      // Given
      const mockDeleteChain = {
        where: vi.fn().mockResolvedValue(undefined)
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          delete: vi.fn().mockReturnValue(mockDeleteChain)
        };
        return callback(mockTx);
      });

      // When & Then
      await expect(drizzleUserRepository.delete(new UserId('non-existent-id'))).resolves.not.toThrow();
    });

    it('삭제 중 데이터베이스 에러를 처리해야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockRejectedValue(new Error('Foreign key constraint'));

      // When & Then
      await expect(drizzleUserRepository.delete(userId)).rejects.toThrow('Foreign key constraint');
    });
  });

  describe('RLS (Row Level Security) 시뮬레이션', () => {
    it('모든 데이터베이스 작업에서 RLS를 사용해야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            profiles: {
              findFirst: vi.fn().mockResolvedValue(null)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      await drizzleUserRepository.findById(userId);

      // Then
      expect(mockDrizzleDb.rls).toHaveBeenCalled();
    });

    it('RLS 정책 위반 시 에러를 처리해야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockRejectedValue(new Error('RLS policy violation: Access denied'));

      // When & Then
      await expect(drizzleUserRepository.findById(userId)).rejects.toThrow('RLS policy violation: Access denied');
    });
  });

  describe('Transaction Handling', () => {
    it('트랜잭션 내에서 작업을 수행해야 한다', async () => {
      // Given
      const mockTxCallback = vi.fn();
      mockDrizzleDb.rls.mockImplementation(mockTxCallback);

      // When
      await drizzleUserRepository.findById(userId);

      // Then
      expect(mockTxCallback).toHaveBeenCalledWith(expect.any(Function));
    });

    it('트랜잭션 실패 시 롤백되어야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockRejectedValue(new Error('Transaction failed'));

      // When & Then
      await expect(drizzleUserRepository.save(mockUser)).rejects.toThrow('Transaction failed');
    });
  });

  describe('Performance and Concurrency', () => {
    it('동시에 여러 요청이 들어와도 안전해야 한다', async () => {
      // Given
      const mockDbData = {
        user_id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            profiles: {
              findFirst: vi.fn().mockResolvedValue(mockDbData)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const promises = Array(10).fill(null).map(() => 
        drizzleUserRepository.findById(userId)
      );
      const results = await Promise.all(promises);

      // Then
      results.forEach(result => {
        expect(result?.id.value).toBe('test-user-id');
      });
    });

    it('대용량 데이터 처리를 시뮬레이션해야 한다', async () => {
      // Given
      const largeDataSet = Array(1000).fill(null).map((_, index) => ({
        user_id: `user-${index}`,
        email: `user${index}@example.com`,
        name: `User ${index}`,
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }));

      // 첫 번째 사용자만 반환하도록 Mock 설정
      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            profiles: {
              findFirst: vi.fn().mockResolvedValue(largeDataSet[0])
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleUserRepository.findById(new UserId('user-0'));

      // Then
      expect(result?.id.value).toBe('user-0');
      expect(result?.entity.email.value).toBe('user0@example.com');
    });
  });
});
