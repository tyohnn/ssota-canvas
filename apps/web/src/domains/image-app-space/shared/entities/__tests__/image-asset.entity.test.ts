/**
 * ImageAssetEntity Tests
 *
 * Testing Strategy 참조: 07-testing-strategy.md
 * Technical Specification 참조: 06-technical-specification.md
 */

import { describe, it, expect } from 'vitest';
import { ImageAssetEntity } from '../image-asset.entity';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';

describe('ImageAssetEntity', () => {
  // Test Data Factory
  const createMockImageAsset = (overrides?: Partial<ImageAsset>): ImageAsset => ({
    id: 'test-id',
    asset_type: 'ai-generated',
    image_url: 'https://example.com/image.jpg',
    thumbnail_url: null,
    width: null,
    height: null,
    file_size: null,
    mime_type: null,
    prompt: 'test prompt',
    negative_prompt: null,
    metadata: {},
    title: 'Test Image',
    description: null,
    tags: [],
    category: 'art',
    created_by: 'user-1',
    workspace_id: 'workspace-1',
    is_public: false,
    is_deleted: false,
    view_count: 10,
    bookmark_count: 5,
    like_count: 3,
    use_count: 2,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  });

  describe('canSetPublic()', () => {
    it('제목과 카테고리가 있으면 Public 전환 가능해야 한다', () => {
      // Given
      const mockData = createMockImageAsset({
        title: 'My Image',
        category: 'art',
      });
      const entity = ImageAssetEntity.fromDatabase(mockData);

      // When
      const result = entity.canSetPublic();

      // Then
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('제목이 없으면 Public 전환 불가해야 한다', () => {
      // Given
      const mockData = createMockImageAsset({
        title: null,
        category: 'art',
      });
      const entity = ImageAssetEntity.fromDatabase(mockData);

      // When
      const result = entity.canSetPublic();

      // Then
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Title is required for public images');
    });

    it('카테고리가 없으면 Public 전환 불가해야 한다', () => {
      // Given
      const mockData = createMockImageAsset({
        title: 'My Image',
        category: null,
      });
      const entity = ImageAssetEntity.fromDatabase(mockData);

      // When
      const result = entity.canSetPublic();

      // Then
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Category is required for public images');
    });

    it('제목과 카테고리가 모두 없으면 제목 에러를 먼저 반환해야 한다', () => {
      // Given
      const mockData = createMockImageAsset({
        title: null,
        category: null,
      });
      const entity = ImageAssetEntity.fromDatabase(mockData);

      // When
      const result = entity.canSetPublic();

      // Then
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Title is required for public images');
    });
  });

  describe('canEdit()', () => {
    it('created_by와 userId가 같으면 편집 가능해야 한다', () => {
      // Given
      const mockData = createMockImageAsset({ created_by: 'user-1' });
      const entity = ImageAssetEntity.fromDatabase(mockData);

      // When
      const result = entity.canEdit('user-1');

      // Then
      expect(result).toBe(true);
    });

    it('created_by와 userId가 다르면 편집 불가해야 한다', () => {
      // Given
      const mockData = createMockImageAsset({ created_by: 'user-1' });
      const entity = ImageAssetEntity.fromDatabase(mockData);

      // When
      const result = entity.canEdit('user-2');

      // Then
      expect(result).toBe(false);
    });
  });

  describe('canView()', () => {
    it('본인이 생성한 이미지는 항상 볼 수 있어야 한다', () => {
      // Given: Private 이미지
      const mockData = createMockImageAsset({
        created_by: 'user-1',
        is_public: false,
      });
      const entity = ImageAssetEntity.fromDatabase(mockData);

      // When
      const result = entity.canView('user-1');

      // Then
      expect(result).toBe(true);
    });

    it('Public이고 삭제되지 않은 이미지는 볼 수 있어야 한다', () => {
      // Given
      const mockData = createMockImageAsset({
        created_by: 'user-1',
        is_public: true,
        is_deleted: false,
      });
      const entity = ImageAssetEntity.fromDatabase(mockData);

      // When
      const result = entity.canView('user-2');

      // Then
      expect(result).toBe(true);
    });

    it('Private이고 타인 이미지는 볼 수 없어야 한다', () => {
      // Given
      const mockData = createMockImageAsset({
        created_by: 'user-1',
        is_public: false,
      });
      const entity = ImageAssetEntity.fromDatabase(mockData);

      // When
      const result = entity.canView('user-2');

      // Then
      expect(result).toBe(false);
    });

    it('삭제된 이미지는 본인도 볼 수 없어야 한다', () => {
      // Given
      const mockData = createMockImageAsset({
        created_by: 'user-1',
        is_deleted: true,
      });
      const entity = ImageAssetEntity.fromDatabase(mockData);

      // When
      const result = entity.canView('user-1');

      // Then
      expect(result).toBe(false);
    });
  });

  describe('getPopularityScore()', () => {
    it('view_count + like_count * 2 + bookmark_count * 3으로 계산되어야 한다', () => {
      // Given
      const mockData = createMockImageAsset({
        view_count: 10,
        like_count: 5,
        bookmark_count: 3,
      });
      const entity = ImageAssetEntity.fromDatabase(mockData);

      // When
      const score = entity.getPopularityScore();

      // Then: 10 + (5 * 2) + (3 * 3) = 10 + 10 + 9 = 29
      expect(score).toBe(29);
    });

    it('통계가 0일 때 0을 반환해야 한다', () => {
      // Given
      const mockData = createMockImageAsset({
        view_count: 0,
        like_count: 0,
        bookmark_count: 0,
      });
      const entity = ImageAssetEntity.fromDatabase(mockData);

      // When
      const score = entity.getPopularityScore();

      // Then
      expect(score).toBe(0);
    });
  });
});

