/**
 * DrizzleImageAssetRepository Integration Tests
 *
 * ⚠️ 주의: 실제 데이터베이스 사용, 기존 데이터 수정하지 않음!
 * - 테스트용 데이터만 생성
 * - 테스트 완료 후 생성한 데이터 정리
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DrizzleImageAssetRepository } from '../implementations/drizzle-image-asset.repository';
import type { NewImageAsset } from '@/db/schemas/image-app-space-schema';
import { adminDb } from '@/db';
import { imageAssets } from '@/db/schemas/image-app-space-schema';
import { eq } from 'drizzle-orm';

describe('DrizzleImageAssetRepository Integration Tests', () => {
  const repository = new DrizzleImageAssetRepository();

  // 실제 사용자 및 워크스페이스 ID
  const TEST_USER_ID = '6be636e7-9934-4fc2-bd8a-a9c9c5cbe909';
  const TEST_WORKSPACE_ID = '6e1b9365-3021-451a-92d0-234a31f6176a';

  // 테스트에서 생성한 ID들 (cleanup용)
  const createdIds: string[] = [];

  // 테스트 후 생성한 데이터 정리
  afterAll(async () => {
    if (createdIds.length > 0) {
      console.log('🧹 Cleaning up test data:', createdIds);
      // 각 ID를 개별적으로 삭제
      for (const id of createdIds) {
        try {
          await adminDb.delete(imageAssets).where(eq(imageAssets.id, id));
        } catch (error) {
          console.warn('Failed to cleanup:', id, error);
        }
      }
    }
  });

  describe('create()', () => {
    it('should create a new image asset', async () => {
      // Given
      const newImageAsset: NewImageAsset = {
        asset_type: 'ai-generated',
        image_url: 'https://test.example.com/test-image.jpg',
        thumbnail_url: null,
        width: 1024,
        height: 768,
        file_size: 204800,
        mime_type: 'image/jpeg',
        prompt: 'test integration prompt',
        negative_prompt: null,
        metadata: { test: true, provider: 'test' },
        title: 'Test Integration Image',
        description: 'Created by integration test',
        tags: ['test', 'integration'],
        category: 'art',
        created_by: TEST_USER_ID,
        workspace_id: TEST_WORKSPACE_ID,
        is_public: false,
        is_deleted: false,
        view_count: 0,
        bookmark_count: 0,
        like_count: 0,
        use_count: 0,
      };

      // When
      const result = await repository.create(newImageAsset);

      // Then
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.asset_type).toBe('ai-generated');
      expect(result.image_url).toBe(newImageAsset.image_url);
      expect(result.title).toBe('Test Integration Image');
      expect(result.created_by).toBe(TEST_USER_ID);

      // Cleanup을 위해 ID 저장
      createdIds.push(result.id);

      console.log('✅ Created test image asset:', result.id);
    });
  });

  describe('findById()', () => {
    it('should find an image asset by id', async () => {
      // Given: 먼저 이미지 생성
      const newImageAsset: NewImageAsset = {
        asset_type: 'unsplash',
        image_url: 'https://test.example.com/find-test.jpg',
        thumbnail_url: null,
        width: null,
        height: null,
        file_size: null,
        mime_type: null,
        prompt: null,
        negative_prompt: null,
        metadata: {},
        title: 'Find Test Image',
        description: null,
        tags: [],
        category: null,
        created_by: TEST_USER_ID,
        workspace_id: TEST_WORKSPACE_ID,
        is_public: false,
        is_deleted: false,
        view_count: 0,
        bookmark_count: 0,
        like_count: 0,
        use_count: 0,
      };

      const created = await repository.create(newImageAsset);
      createdIds.push(created.id);

      // When
      const found = await repository.findById(created.id);

      // Then
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('Find Test Image');

      console.log('✅ Found image asset by ID:', found?.id);
    });

    it('should return null for non-existent id', async () => {
      // Given: 유효한 UUID 형식이지만 존재하지 않는 ID
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // When
      const found = await repository.findById(nonExistentId);

      // Then
      expect(found).toBeNull();
    });
  });

  describe('updateMetadata()', () => {
    it('should update image metadata', async () => {
      // Given: 이미지 생성
      const newImageAsset: NewImageAsset = {
        asset_type: 'ai-generated',
        image_url: 'https://test.example.com/update-test.jpg',
        thumbnail_url: null,
        width: null,
        height: null,
        file_size: null,
        mime_type: null,
        prompt: null,
        negative_prompt: null,
        metadata: {},
        title: 'Original Title',
        description: null,
        tags: [],
        category: null,
        created_by: TEST_USER_ID,
        workspace_id: TEST_WORKSPACE_ID,
        is_public: false,
        is_deleted: false,
        view_count: 0,
        bookmark_count: 0,
        like_count: 0,
        use_count: 0,
      };

      const created = await repository.create(newImageAsset);
      createdIds.push(created.id);

      // When
      const updated = await repository.updateMetadata(created.id, {
        title: 'Updated Title',
        description: 'Updated description',
        tags: ['updated', 'test'],
        category: 'photo',
      });

      // Then
      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Updated description');
      expect(updated.tags).toEqual(['updated', 'test']);
      expect(updated.category).toBe('photo');

      console.log('✅ Updated metadata for:', updated.id);
    });
  });

  describe('updateVisibility()', () => {
    it('should change visibility to public', async () => {
      // Given
      const newImageAsset: NewImageAsset = {
        asset_type: 'ai-generated',
        image_url: 'https://test.example.com/visibility-test.jpg',
        thumbnail_url: null,
        width: null,
        height: null,
        file_size: null,
        mime_type: null,
        prompt: null,
        negative_prompt: null,
        metadata: {},
        title: 'Visibility Test',
        description: null,
        tags: [],
        category: 'art',
        created_by: TEST_USER_ID,
        workspace_id: TEST_WORKSPACE_ID,
        is_public: false,
        is_deleted: false,
        view_count: 0,
        bookmark_count: 0,
        like_count: 0,
        use_count: 0,
      };

      const created = await repository.create(newImageAsset);
      createdIds.push(created.id);

      // When
      const updated = await repository.updateVisibility(created.id, true);

      // Then
      expect(updated.is_public).toBe(true);

      console.log('✅ Changed visibility to public:', updated.id);
    });
  });

  describe('softDelete() and restore()', () => {
    it('should soft delete and restore an image', async () => {
      // Given
      const newImageAsset: NewImageAsset = {
        asset_type: 'user-upload',
        image_url: 'https://test.example.com/delete-test.jpg',
        thumbnail_url: null,
        width: null,
        height: null,
        file_size: null,
        mime_type: null,
        prompt: null,
        negative_prompt: null,
        metadata: {},
        title: 'Delete Test',
        description: null,
        tags: [],
        category: null,
        created_by: TEST_USER_ID,
        workspace_id: TEST_WORKSPACE_ID,
        is_public: false,
        is_deleted: false,
        view_count: 0,
        bookmark_count: 0,
        like_count: 0,
        use_count: 0,
      };

      const created = await repository.create(newImageAsset);
      createdIds.push(created.id);

      // When: Soft delete
      await repository.softDelete(created.id);

      // Then: 삭제 확인
      const deletedImage = await repository.findById(created.id);
      expect(deletedImage?.is_deleted).toBe(true);
      expect(deletedImage?.deleted_at).toBeDefined();

      // When: Restore
      await repository.restore(created.id);

      // Then: 복원 확인
      const restoredImage = await repository.findById(created.id);
      expect(restoredImage?.is_deleted).toBe(false);
      expect(restoredImage?.deleted_at).toBeNull();

      console.log('✅ Soft delete and restore test passed:', created.id);
    });
  });
});

