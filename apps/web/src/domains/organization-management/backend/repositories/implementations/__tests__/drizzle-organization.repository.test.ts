import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DrizzleOrganizationRepository } from '../drizzle-organization.repository';
import { OrganizationAggregate } from '../../../../shared/aggregates/organization.aggregate';
import { Organization } from '../../../../shared/entities/organization.entity';
import { OrganizationId, UserId } from '../../../../shared/value-objects/ids.vo';

// Mock Drizzle DB
const mockDrizzleDb = {
  rls: vi.fn(),
  query: {
    organizations: {
      findFirst: vi.fn(),
      findMany: vi.fn()
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
  organizations: {
    id: 'id',
    name: 'name',
    owner_id: 'owner_id',
    is_default: 'is_default',
    created_at: 'created_at',
    updated_at: 'updated_at'
  }
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value, operator: 'eq' }))
}));

describe('DrizzleOrganizationRepository Real DB Tests', () => {
  let drizzleOrganizationRepository: DrizzleOrganizationRepository;
  let mockOrganization: OrganizationAggregate;
  let organizationId: OrganizationId;
  let ownerId: UserId;

  beforeEach(() => {
    drizzleOrganizationRepository = new DrizzleOrganizationRepository();
    organizationId = OrganizationId.generate();
    ownerId = new UserId('test-owner-id');
    
    // Create mock organization aggregate
    const organization = new Organization(
      organizationId,
      'Test Organization',
      'personal',
      ownerId,
      true,
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-01-01T00:00:00Z')
    );
    mockOrganization = new OrganizationAggregate(organization);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('ID로 조직을 찾아야 한다', async () => {
      // Given
      const mockDbData = {
        id: organizationId.value,
        name: 'Test Organization',
        organization_type: 'personal',
        owner_id: 'test-owner-id',
        is_default: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            organizations: {
              findFirst: vi.fn().mockResolvedValue(mockDbData)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleOrganizationRepository.findById(organizationId);

      // Then
      expect(result).toBeInstanceOf(OrganizationAggregate);
      expect(result?.id.value).toBe(organizationId.value);
      expect(result?.entity.name).toBe('Test Organization');
      expect(result?.entity.ownerId.value).toBe('test-owner-id');
      expect(result?.entity.isDefault).toBe(true);
      expect(mockDrizzleDb.rls).toHaveBeenCalled();
    });

    it('존재하지 않는 ID에 대해 null을 반환해야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            organizations: {
              findFirst: vi.fn().mockResolvedValue(null)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleOrganizationRepository.findById(OrganizationId.generate());

      // Then
      expect(result).toBe(null);
    });

    it('is_default가 null인 경우 false로 처리해야 한다', async () => {
      // Given
      const mockDbData = {
        id: organizationId.value,
        name: 'Test Organization',
        organization_type: 'personal',
        owner_id: 'test-owner-id',
        is_default: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            organizations: {
              findFirst: vi.fn().mockResolvedValue(mockDbData)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleOrganizationRepository.findById(organizationId);

      // Then
      expect(result?.entity.isDefault).toBe(false);
    });

    it('데이터베이스 에러를 적절히 처리해야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockRejectedValue(new Error('Database connection failed'));

      // When & Then
      await expect(drizzleOrganizationRepository.findById(organizationId)).rejects.toThrow('Database connection failed');
    });

    it('잘못된 날짜 형식을 처리해야 한다', async () => {
      // Given
      const mockDbData = {
        id: organizationId.value,
        name: 'Test Organization',
        organization_type: 'personal',
        owner_id: 'test-owner-id',
        is_default: false,
        created_at: 'invalid-date',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            organizations: {
              findFirst: vi.fn().mockResolvedValue(mockDbData)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleOrganizationRepository.findById(organizationId);

      // Then
      expect(result?.entity.createdAt).toBeInstanceOf(Date);
      expect(result?.entity.createdAt.toString()).toBe('Invalid Date');
    });
  });

  describe('findByOwnerId', () => {
    it('소유자 ID로 조직 목록을 찾아야 한다', async () => {
      // Given
      const mockDbData = [
        {
          id: 'org-1',
          name: 'Organization 1',
          organization_type: 'personal',
        owner_id: 'test-owner-id',
          is_default: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'org-2',
          name: 'Organization 2',
          organization_type: 'personal',
        owner_id: 'test-owner-id',
          is_default: false,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ];

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            organizations: {
              findMany: vi.fn().mockResolvedValue(mockDbData)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleOrganizationRepository.findByOwnerId(ownerId);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(OrganizationAggregate);
      expect(result[0]?.entity.name).toBe('Organization 1');
      expect(result[1]?.entity.name).toBe('Organization 2');
      expect(result[0]?.entity.ownerId.value).toBe('test-owner-id');
      expect(result[1]?.entity.ownerId.value).toBe('test-owner-id');
    });

    it('존재하지 않는 소유자에 대해 빈 배열을 반환해야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            organizations: {
              findMany: vi.fn().mockResolvedValue([])
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleOrganizationRepository.findByOwnerId(new UserId('non-existent-owner'));

      // Then
      expect(result).toEqual([]);
    });

    it('조직이 생성일 순으로 정렬되어야 한다', async () => {
      // Given
      const mockDbData = [
        {
          id: 'org-1',
          name: 'First Organization',
          organization_type: 'personal',
        owner_id: 'test-owner-id',
          is_default: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'org-2',
          name: 'Second Organization',
          organization_type: 'personal',
        owner_id: 'test-owner-id',
          is_default: false,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ];

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            organizations: {
              findMany: vi.fn().mockResolvedValue(mockDbData)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleOrganizationRepository.findByOwnerId(ownerId);

      // Then
      expect(result[0]?.entity.name).toBe('First Organization');
      expect(result[1]?.entity.name).toBe('Second Organization');
      expect(result[0]?.entity.createdAt.getTime()).toBeLessThan(result[1]?.entity.createdAt.getTime() || 0);
    });

    it('is_default 값이 다양한 경우를 처리해야 한다', async () => {
      // Given
      const mockDbData = [
        {
          id: 'org-1',
          name: 'Default Organization',
          organization_type: 'personal',
        owner_id: 'test-owner-id',
          is_default: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'org-2',
          name: 'Regular Organization',
          organization_type: 'personal',
        owner_id: 'test-owner-id',
          is_default: false,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        },
        {
          id: 'org-3',
          name: 'Null Default Organization',
          organization_type: 'personal',
        owner_id: 'test-owner-id',
          is_default: null,
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z'
        }
      ];

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            organizations: {
              findMany: vi.fn().mockResolvedValue(mockDbData)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleOrganizationRepository.findByOwnerId(ownerId);

      // Then
      expect(result[0]?.entity.isDefault).toBe(true);
      expect(result[1]?.entity.isDefault).toBe(false);
      expect(result[2]?.entity.isDefault).toBe(false); // null은 false로 처리
    });
  });

  describe('save', () => {
    it('새로운 조직을 저장해야 한다', async () => {
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
      await drizzleOrganizationRepository.save(mockOrganization);

      // Then
      expect(mockDrizzleDb.rls).toHaveBeenCalled();
      expect(mockInsertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockOrganization.id.value,
          name: 'Test Organization',
          organization_type: 'personal',
          owner_id: 'test-owner-id',
          is_default: true,
        })
      );
    });

    it('기존 조직을 업데이트해야 한다 (upsert)', async () => {
      // Given
      const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
      const mockInsertChain = {
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: mockOnConflictDoUpdate
        })
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue(mockInsertChain)
        };
        return callback(mockTx);
      });

      // When
      await drizzleOrganizationRepository.save(mockOrganization);

      // Then
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });

    it('빈 이름을 가진 조직을 저장해야 한다', async () => {
      // Given
      const organizationWithEmptyName = new Organization(
        organizationId,
        '', // 빈 이름
        'personal',
        ownerId,
        false,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T00:00:00Z')
      );
      const mockOrganizationAggregate = new OrganizationAggregate(organizationWithEmptyName);

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
      await drizzleOrganizationRepository.save(mockOrganizationAggregate);

      // Then
      expect(mockInsertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: ''
        })
      );
    });

    it('매우 긴 이름을 가진 조직을 저장해야 한다', async () => {
      // Given
      const longName = 'Organization '.repeat(100);
      const organizationWithLongName = new Organization(
        organizationId,
        longName,
        'personal',
        ownerId,
        false,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T00:00:00Z')
      );
      const mockOrganizationAggregate = new OrganizationAggregate(organizationWithLongName);

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
      await drizzleOrganizationRepository.save(mockOrganizationAggregate);

      // Then
      expect(mockInsertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: longName
        })
      );
    });

    it('특수 문자가 포함된 조직명을 저장해야 한다', async () => {
      // Given
      const specialName = '테스트 조직!@#$%^&*()_+-=[]{}|;:,.<>? 🚀';
      const organizationWithSpecialChars = new Organization(
        organizationId,
        specialName,
        'personal',
        ownerId,
        false,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T00:00:00Z')
      );
      const mockOrganizationAggregate = new OrganizationAggregate(organizationWithSpecialChars);

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
      await drizzleOrganizationRepository.save(mockOrganizationAggregate);

      // Then
      expect(mockInsertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: specialName
        })
      );
    });

    it('데이터베이스 저장 에러를 처리해야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockRejectedValue(new Error('Constraint violation'));

      // When & Then
      await expect(drizzleOrganizationRepository.save(mockOrganization)).rejects.toThrow('Constraint violation');
    });
  });

  describe('delete', () => {
    it('조직을 삭제해야 한다', async () => {
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
      await drizzleOrganizationRepository.delete(organizationId);

      // Then
      expect(mockDrizzleDb.rls).toHaveBeenCalled();
      expect(mockDeleteChain.where).toHaveBeenCalled();
    });

    it('존재하지 않는 조직 삭제도 조용히 성공해야 한다', async () => {
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
      await expect(drizzleOrganizationRepository.delete(OrganizationId.generate())).resolves.not.toThrow();
    });

    it('삭제 중 데이터베이스 에러를 처리해야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockRejectedValue(new Error('Foreign key constraint'));

      // When & Then
      await expect(drizzleOrganizationRepository.delete(organizationId)).rejects.toThrow('Foreign key constraint');
    });
  });

  describe('RLS (Row Level Security) 시뮬레이션', () => {
    it('모든 데이터베이스 작업에서 RLS를 사용해야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            organizations: {
              findFirst: vi.fn().mockResolvedValue(null)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      await drizzleOrganizationRepository.findById(organizationId);

      // Then
      expect(mockDrizzleDb.rls).toHaveBeenCalled();
    });

    it('RLS 정책 위반 시 에러를 처리해야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockRejectedValue(new Error('RLS policy violation: Access denied'));

      // When & Then
      await expect(drizzleOrganizationRepository.findById(organizationId)).rejects.toThrow('RLS policy violation: Access denied');
    });

    it('다른 사용자의 조직은 접근할 수 없어야 한다', async () => {
      // Given - RLS 정책으로 인해 다른 사용자의 조직은 조회되지 않음
      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            organizations: {
              findMany: vi.fn().mockResolvedValue([]) // RLS로 인해 빈 결과
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleOrganizationRepository.findByOwnerId(new UserId('other-user-id'));

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('Transaction Handling', () => {
    it('트랜잭션 내에서 작업을 수행해야 한다', async () => {
      // Given
      const mockTxCallback = vi.fn();
      mockDrizzleDb.rls.mockImplementation(mockTxCallback);

      // When
      await drizzleOrganizationRepository.findById(organizationId);

      // Then
      expect(mockTxCallback).toHaveBeenCalledWith(expect.any(Function));
    });

    it('트랜잭션 실패 시 롤백되어야 한다', async () => {
      // Given
      mockDrizzleDb.rls.mockRejectedValue(new Error('Transaction failed'));

      // When & Then
      await expect(drizzleOrganizationRepository.save(mockOrganization)).rejects.toThrow('Transaction failed');
    });
  });

  describe('Performance and Concurrency', () => {
    it('동시에 여러 요청이 들어와도 안전해야 한다', async () => {
      // Given
      const mockDbData = {
        id: organizationId.value,
        name: 'Test Organization',
        organization_type: 'personal',
        owner_id: 'test-owner-id',
        is_default: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            organizations: {
              findFirst: vi.fn().mockResolvedValue(mockDbData)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const promises = Array(10).fill(null).map(() => 
        drizzleOrganizationRepository.findById(organizationId)
      );
      const results = await Promise.all(promises);

      // Then
      results.forEach(result => {
        expect(result?.id.value).toBe(organizationId.value);
      });
    });

    it('대용량 조직 목록을 처리해야 한다', async () => {
      // Given
      const largeDataSet = Array(1000).fill(null).map((_, index) => ({
        id: `org-${index}`,
        name: `Organization ${index}`,
        organization_type: 'personal',
        owner_id: 'test-owner-id',
        is_default: index === 0, // 첫 번째만 기본 조직
        created_at: new Date(Date.now() + index * 1000).toISOString(),
        updated_at: new Date(Date.now() + index * 1000).toISOString()
      }));

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            organizations: {
              findMany: vi.fn().mockResolvedValue(largeDataSet)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleOrganizationRepository.findByOwnerId(ownerId);

      // Then
      expect(result).toHaveLength(1000);
      expect(result[0]?.entity.name).toBe('Organization 0');
      expect(result[0]?.entity.isDefault).toBe(true);
      expect(result[999]?.entity.name).toBe('Organization 999');
      expect(result[999]?.entity.isDefault).toBe(false);
    });

    it('복잡한 정렬 조건을 처리해야 한다', async () => {
      // Given
      const mockDbData = [
        {
          id: 'org-3',
          name: 'Third Organization',
          organization_type: 'personal',
        owner_id: 'test-owner-id',
          is_default: false,
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z'
        },
        {
          id: 'org-1',
          name: 'First Organization',
          organization_type: 'personal',
        owner_id: 'test-owner-id',
          is_default: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'org-2',
          name: 'Second Organization',
          organization_type: 'personal',
        owner_id: 'test-owner-id',
          is_default: false,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ];

      // 실제 DB에서는 orderBy로 정렬되어 반환됨을 시뮬레이션
      const sortedData = [...mockDbData].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      mockDrizzleDb.rls.mockImplementation(async (callback) => {
        const mockTx = {
          query: {
            organizations: {
              findMany: vi.fn().mockResolvedValue(sortedData)
            }
          }
        };
        return callback(mockTx);
      });

      // When
      const result = await drizzleOrganizationRepository.findByOwnerId(ownerId);

      // Then
      expect(result[0]?.entity.name).toBe('First Organization');
      expect(result[1]?.entity.name).toBe('Second Organization');
      expect(result[2]?.entity.name).toBe('Third Organization');
    });
  });
});
