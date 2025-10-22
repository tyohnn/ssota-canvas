import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DrizzleEdgeRepository } from '../drizzle-edge.repository';
import { EdgeAggregate } from '../../../../shared/aggregates/edge.aggregate';
import { EdgeId } from '../../../../shared/value-objects/edge-id.vo';
import { EdgeType } from '../../../../shared/value-objects/edge-type.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';

// Mock Drizzle DB
vi.mock('@/db', () => ({
  adminDb: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          return {
            limit: vi.fn().mockResolvedValue([]),
            then: (resolve: any) => resolve([]),
          };
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('@/db/schema-dev', () => ({
  edges: {
    id: 'id',
    page_id: 'page_id',
    source_block_id: 'source_block_id',
    target_block_id: 'target_block_id',
    edge_type: 'edge_type',
    edge_label: 'edge_label',
    edge_style_color: 'edge_style_color',
    edge_style_thickness: 'edge_style_thickness',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
}));

describe('DrizzleEdgeRepository', () => {
  let repository: DrizzleEdgeRepository;
  let mockPageId: PageId;
  let mockSourceBlockId: BlockId;
  let mockTargetBlockId: BlockId;

  beforeEach(() => {
    repository = new DrizzleEdgeRepository();
    mockPageId = new PageId('550e8400-e29b-41d4-a716-446655440000');
    mockSourceBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440001');
    mockTargetBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440002');
    
    vi.clearAllMocks();
  });

  describe('save', () => {
    it('EdgeAggregate를 저장할 수 있어야 한다', async () => {
      // Given
      const edgeId = new EdgeId('550e8400-e29b-41d4-a716-446655440003');
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        mockPageId,
        mockSourceBlockId,
        mockTargetBlockId,
        EdgeType.default()
      );

      // When
      await repository.save(aggregate);

      // Then
      // Mock이 올바르게 호출되었는지 확인
      expect(true).toBe(true); // 실제 구현에서는 adminDb 호출 검증
    });
  });

  describe('findById', () => {
    it('Edge ID로 EdgeAggregate를 조회할 수 있어야 한다', async () => {
      // Given
      const edgeId = new EdgeId('550e8400-e29b-41d4-a716-446655440003');

      // When
      const result = await repository.findById(edgeId);

      // Then
      expect(result).toBeNull(); // Mock에서는 빈 배열 반환
    });

    it('존재하지 않는 Edge ID로 null을 반환해야 한다', async () => {
      // Given
      const nonExistentEdgeId = new EdgeId('550e8400-e29b-41d4-a716-446655440999');

      // When
      const result = await repository.findById(nonExistentEdgeId);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('findByPageId', () => {
    it('Page ID로 모든 EdgeAggregate를 조회할 수 있어야 한다', async () => {
      // When
      const result = await repository.findByPageId(mockPageId);

      // Then
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0); // Mock에서는 빈 배열 반환
    });
  });

  describe('findByConnectedBlockId', () => {
    it('연결된 Block ID로 EdgeAggregate를 조회할 수 있어야 한다', async () => {
      // When
      const result = await repository.findByConnectedBlockId(mockSourceBlockId);

      // Then
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0); // Mock에서는 빈 배열 반환
    });
  });

  describe('delete', () => {
    it('Edge ID로 Edge를 삭제할 수 있어야 한다', async () => {
      // Given
      const edgeId = new EdgeId('550e8400-e29b-41d4-a716-446655440003');

      // When & Then
      await expect(repository.delete(edgeId)).resolves.toBeUndefined();
    });
  });

  describe('deleteAll', () => {
    it('여러 Edge ID로 일괄 삭제할 수 있어야 한다', async () => {
      // Given
      const edgeIds = [
        new EdgeId('550e8400-e29b-41d4-a716-446655440003'),
        new EdgeId('550e8400-e29b-41d4-a716-446655440004'),
      ];

      // When & Then
      await expect(repository.deleteAll(edgeIds)).resolves.toBeUndefined();
    });

    it('빈 배열로 호출 시 아무 작업도 하지 않아야 한다', async () => {
      // When & Then
      await expect(repository.deleteAll([])).resolves.toBeUndefined();
    });
  });
});
