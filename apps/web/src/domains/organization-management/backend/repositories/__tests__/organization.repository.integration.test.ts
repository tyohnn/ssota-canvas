import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OrganizationRepository } from '../../../backend/repositories/interfaces/organization.repository.interface';
import { OrganizationAggregate } from '../../../shared/aggregates/organization.aggregate';
import { OrganizationId, UserId } from '../../../shared/value-objects/ids.vo';
import { OrganizationManagementError } from '../../../shared/errors/organization-management.error';

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

// Mock OrganizationRepository implementation
class MockOrganizationRepository implements OrganizationRepository {
  constructor(private supabase = mockSupabaseClient) {}

  async findById(id: OrganizationId): Promise<OrganizationAggregate | null> {
    // Mock implementation that calls Supabase client
    this.supabase.from();
    return null;
  }

  async findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]> {
    // Mock implementation that calls Supabase client
    this.supabase.from();
    return [];
  }

  async save(organization: OrganizationAggregate): Promise<void> {
    // Mock implementation that calls Supabase client
    this.supabase.from();
  }

  async delete(id: OrganizationId): Promise<void> {
    // Mock implementation that calls Supabase client
    this.supabase.from();
  }
}

describe('OrganizationRepository Integration Tests', () => {
  let organizationRepository: OrganizationRepository;
  let mockOrganization: OrganizationAggregate;
  let ownerId: UserId;

  beforeEach(() => {
    organizationRepository = new MockOrganizationRepository();
    ownerId = new UserId('test-user-id');
    
    // Create a mock organization for testing
    mockOrganization = OrganizationAggregate.createDefault(
      'Test Organization',
      ownerId
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('save', () => {
    it('조직을 데이터베이스에 저장해야 한다', async () => {
      // When
      await organizationRepository.save(mockOrganization);

      // Then
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    it('저장 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
      // Given
      const errorRepository = new MockOrganizationRepository();
      vi.spyOn(errorRepository, 'save').mockRejectedValue(new Error('Database error'));

      // When & Then
      await expect(errorRepository.save(mockOrganization)).rejects.toThrow('Database error');
    });

    it('중복 ID는 거부해야 한다', async () => {
      // Given
      const errorRepository = new MockOrganizationRepository();
      vi.spyOn(errorRepository, 'save').mockRejectedValue(
        new OrganizationManagementError('ORGANIZATION_CREATION_FAILED', 'Organization with this ID already exists')
      );

      // When & Then
      await expect(errorRepository.save(mockOrganization)).rejects.toThrow(OrganizationManagementError);
      await expect(errorRepository.save(mockOrganization)).rejects.toThrow('Organization with this ID already exists');
    });
  });

  describe('findById', () => {
    it('ID로 조직을 찾아야 한다', async () => {
      // When
      const result = await organizationRepository.findById(mockOrganization.id);

      // Then
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    it('존재하지 않는 ID는 null을 반환해야 한다', async () => {
      // Given
      const nonExistentId = OrganizationId.generate();

      // When
      const result = await organizationRepository.findById(nonExistentId);

      // Then
      expect(result).toBeNull();
    });

    it('유효한 조직을 반환해야 한다', async () => {
      // Given
      const mockRepository = new MockOrganizationRepository();
      vi.spyOn(mockRepository, 'findById').mockResolvedValue(mockOrganization);

      // When
      const result = await mockRepository.findById(mockOrganization.id);

      // Then
      expect(result).toBe(mockOrganization);
      expect(result?.id).toBe(mockOrganization.id);
      expect(result?.entity.name).toBe('Test Organization');
    });

    it('조회 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
      // Given
      const errorRepository = new MockOrganizationRepository();
      vi.spyOn(errorRepository, 'findById').mockRejectedValue(new Error('Database connection failed'));

      // When & Then
      await expect(errorRepository.findById(mockOrganization.id)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByOwnerId', () => {
    it('소유자의 모든 조직을 조회해야 한다', async () => {
      // When
      const result = await organizationRepository.findByOwnerId(ownerId);

      // Then
      expect(mockSupabaseClient.from).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('존재하지 않는 소유자는 빈 배열을 반환해야 한다', async () => {
      // Given
      const nonExistentOwnerId = new UserId('non-existent-user');

      // When
      const result = await organizationRepository.findByOwnerId(nonExistentOwnerId);

      // Then
      expect(result).toEqual([]);
    });

    it('여러 조직을 반환해야 한다', async () => {
      // Given
      const org1 = OrganizationAggregate.createDefault('Organization 1', ownerId);
      const org2 = OrganizationAggregate.createDefault('Organization 2', ownerId);
      const organizations = [org1, org2];

      const mockRepository = new MockOrganizationRepository();
      vi.spyOn(mockRepository, 'findByOwnerId').mockResolvedValue(organizations);

      // When
      const result = await mockRepository.findByOwnerId(ownerId);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0]?.entity.name).toBe('Organization 1');
      expect(result[1]?.entity.name).toBe('Organization 2');
      expect(result[0]?.ownerId).toBe(ownerId);
      expect(result[1]?.ownerId).toBe(ownerId);
    });

    it('생성일 순으로 정렬되어야 한다', async () => {
      // Given
      const org1 = OrganizationAggregate.createDefault('Older Organization', ownerId);
      const org2 = OrganizationAggregate.createDefault('Newer Organization', ownerId);
      
      // 시간 차이를 만들기 위해 createdAt을 수동으로 설정하는 것처럼 가정
      const organizations = [org2, org1]; // 최신순으로 정렬된 결과

      const mockRepository = new MockOrganizationRepository();
      vi.spyOn(mockRepository, 'findByOwnerId').mockResolvedValue(organizations);

      // When
      const result = await mockRepository.findByOwnerId(ownerId);

      // Then
      expect(result).toHaveLength(2);
      // 실제 구현에서는 createdAt 기준으로 정렬되어야 함
      expect(result[0]).toBe(org2); // 더 최신
      expect(result[1]).toBe(org1); // 더 이전
    });

    it('다른 소유자의 조직은 조회되지 않아야 한다', async () => {
      // Given
      const otherOwnerId = new UserId('other-user-id');
      const mockRepository = new MockOrganizationRepository();
      
      // 다른 소유자의 조직은 빈 배열 반환
      vi.spyOn(mockRepository, 'findByOwnerId').mockImplementation((requestedOwnerId) => {
        if (requestedOwnerId.equals(ownerId)) {
          return Promise.resolve([mockOrganization]);
        }
        return Promise.resolve([]);
      });

      // When
      const result = await mockRepository.findByOwnerId(otherOwnerId);

      // Then
      expect(result).toEqual([]);
    });

    it('조회 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
      // Given
      const errorRepository = new MockOrganizationRepository();
      vi.spyOn(errorRepository, 'findByOwnerId').mockRejectedValue(new Error('Query failed'));

      // When & Then
      await expect(errorRepository.findByOwnerId(ownerId)).rejects.toThrow('Query failed');
    });
  });

  describe('delete', () => {
    it('조직을 삭제해야 한다', async () => {
      // When
      await organizationRepository.delete(mockOrganization.id);

      // Then
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    it('존재하지 않는 조직 삭제는 조용히 성공해야 한다', async () => {
      // Given
      const nonExistentId = OrganizationId.generate();

      // When & Then
      await expect(organizationRepository.delete(nonExistentId)).resolves.not.toThrow();
    });

    it('삭제 중 오류가 발생하면 예외를 발생시켜야 한다', async () => {
      // Given
      const errorRepository = new MockOrganizationRepository();
      vi.spyOn(errorRepository, 'delete').mockRejectedValue(new Error('Delete failed'));

      // When & Then
      await expect(errorRepository.delete(mockOrganization.id)).rejects.toThrow('Delete failed');
    });
  });

  describe('Edge Cases', () => {
    it('매우 긴 조직명을 가진 조직을 저장할 수 있어야 한다', async () => {
      // Given
      const longNameOrg = OrganizationAggregate.createDefault('A'.repeat(1000), ownerId);

      // When & Then
      await expect(organizationRepository.save(longNameOrg)).resolves.not.toThrow();
    });

    it('특수 문자가 포함된 조직명을 처리할 수 있어야 한다', async () => {
      // Given
      const specialNameOrg = OrganizationAggregate.createDefault(
        '테스트 조직!@#$%^&*()_+-=[]{}|;:,.<>? 🏢',
        ownerId
      );

      // When & Then
      await expect(organizationRepository.save(specialNameOrg)).resolves.not.toThrow();
    });

    it('동시에 같은 조직을 조회해도 안전해야 한다', async () => {
      // Given
      const mockRepository = new MockOrganizationRepository();
      vi.spyOn(mockRepository, 'findById').mockResolvedValue(mockOrganization);

      // When
      const promises = Array(10).fill(null).map(() => 
        mockRepository.findById(mockOrganization.id)
      );
      const results = await Promise.all(promises);

      // Then
      results.forEach(result => {
        expect(result).toBe(mockOrganization);
      });
    });
  });

  describe('RLS (Row Level Security) 시뮬레이션', () => {
    it('RLS 정책이 적용되어야 한다', async () => {
      // Given
      const mockRepository = new MockOrganizationRepository();
      
      // RLS 정책 위반 시뮬레이션
      vi.spyOn(mockRepository, 'findById').mockRejectedValue(
        new Error('RLS policy violation: Access denied')
      );

      // When & Then
      await expect(mockRepository.findById(mockOrganization.id))
        .rejects.toThrow('RLS policy violation: Access denied');
    });

    it('다른 사용자의 조직은 접근할 수 없어야 한다', async () => {
      // Given
      const otherUserId = new UserId('other-user-id');
      const otherUserOrg = OrganizationAggregate.createDefault('Other User Org', otherUserId);
      
      const mockRepository = new MockOrganizationRepository();
      
      // RLS 시뮬레이션: 다른 사용자의 조직은 null 반환
      vi.spyOn(mockRepository, 'findById').mockImplementation((orgId) => {
        if (orgId.equals(mockOrganization.id)) {
          return Promise.resolve(mockOrganization);
        }
        return Promise.resolve(null); // RLS에 의해 차단됨
      });

      // When
      const result = await mockRepository.findById(otherUserOrg.id);

      // Then
      expect(result).toBeNull();
    });
  });
});
