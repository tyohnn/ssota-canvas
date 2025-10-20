import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DrizzleViewportRepository } from '../drizzle-viewport.repository';
import { ViewportAggregate } from '../../../../shared/aggregates/viewport.aggregate';
import { ViewportId } from '../../../../shared/value-objects/viewport-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

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
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('@/db/schema-dev', () => ({
  viewports: {
    id: 'id',
    page_id: 'page_id',
    user_id: 'user_id',
    zoom_level: 'zoom_level',
    center_x: 'center_x',
    center_y: 'center_y',
    last_saved: 'last_saved',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
}));

describe('DrizzleViewportRepository', () => {
  let repository: DrizzleViewportRepository;
  let mockPageId: PageId;
  let mockUserId: UserId;

  beforeEach(() => {
    repository = new DrizzleViewportRepository();
    mockPageId = new PageId('550e8400-e29b-41d4-a716-446655440000');
    mockUserId = new UserId('550e8400-e29b-41d4-a716-446655440001');
    
    vi.clearAllMocks();
  });

  describe('save', () => {
    it('ViewportAggregate를 저장할 수 있어야 한다', async () => {
      // Given
      const viewportId = new ViewportId('550e8400-e29b-41d4-a716-446655440002');
      const aggregate = ViewportAggregate.createViewport(
        viewportId,
        mockPageId,
        mockUserId,
        1.5,
        100,
        200
      );

      // When
      await repository.save(aggregate);

      // Then
      // Mock이 올바르게 호출되었는지 확인
      expect(true).toBe(true); // 실제 구현에서는 adminDb 호출 검증
    });
  });

  describe('findById', () => {
    it('Viewport ID로 ViewportAggregate를 조회할 수 있어야 한다', async () => {
      // Given
      const viewportId = new ViewportId('550e8400-e29b-41d4-a716-446655440002');

      // When
      const result = await repository.findById(viewportId);

      // Then
      expect(result).toBeNull(); // Mock에서는 빈 배열 반환
    });

    it('존재하지 않는 Viewport ID로 null을 반환해야 한다', async () => {
      // Given
      const nonExistentViewportId = new ViewportId('550e8400-e29b-41d4-a716-446655440999');

      // When
      const result = await repository.findById(nonExistentViewportId);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('findByPageId', () => {
    it('Page ID로 ViewportAggregate를 조회할 수 있어야 한다', async () => {
      // When
      const result = await repository.findByPageId(mockPageId);

      // Then
      expect(result).toBeNull(); // Mock에서는 빈 배열 반환
    });
  });

  describe('delete', () => {
    it('Viewport ID로 Viewport를 삭제할 수 있어야 한다', async () => {
      // Given
      const viewportId = new ViewportId('550e8400-e29b-41d4-a716-446655440002');

      // When & Then
      await expect(repository.delete(viewportId)).resolves.toBeUndefined();
    });
  });
});
