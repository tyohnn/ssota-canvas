/**
 * ImageAssetService Unit Tests
 *
 * Testing Strategy 참조: 05-testing-strategy.md
 * TDD RED-GREEN 방식으로 구현
 *
 * ⚠️ Mock Repository 사용 (Unit Test)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageAssetService } from '../image-asset.service';
import type { IImageAssetRepository } from '../../repositories/interfaces/image-asset.repository.interface';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';

describe('ImageAssetService', () => {
  let service: ImageAssetService;
  let mockRepository: IImageAssetRepository;

  // Test Data
  const TEST_USER_ID = '6be636e7-9934-4fc2-bd8a-a9c9c5cbe909';
  const TEST_WORKSPACE_ID = '6e1b9365-3021-451a-92d0-234a31f6176a';

  const mockImageAsset: ImageAsset = {
    id: 'test-image-id',
    asset_type: 'ai-generated',
    image_url: 'https://example.com/image.jpg',
    thumbnail_url: null,
    width: 1024,
    height: 768,
    file_size: 204800,
    mime_type: 'image/jpeg',
    prompt: 'test prompt',
    negative_prompt: null,
    metadata: {},
    title: 'Test Image',
    description: 'Test description',
    tags: ['test'],
    category: 'art',
    created_by: TEST_USER_ID,
    workspace_id: TEST_WORKSPACE_ID,
    is_public: false,
    is_deleted: false,
    view_count: 10,
    bookmark_count: 5,
    like_count: 3,
    use_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(() => {
    // Mock Repository 생성
    mockRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByIdWithCreator: vi.fn(),
      findByIdWithStats: vi.fn(),
      findPublicImages: vi.fn(),
      findFollowingUserImages: vi.fn(),
      updateMetadata: vi.fn(),
      updateVisibility: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn(),
    };

    service = new ImageAssetService(mockRepository);
  });

  describe('createImageAsset()', () => {
    it('🔴 RED: 유효한 Command로 ImageAsset을 생성해야 한다', async () => {
      // Given
      const command = {
        assetType: 'ai-generated' as const,
        imageUrl: 'https://example.com/new-image.jpg',
        title: 'New Image',
        createdBy: TEST_USER_ID,
        workspaceId: TEST_WORKSPACE_ID,
      };

      vi.mocked(mockRepository.create).mockResolvedValue(mockImageAsset);

      // When
      const result = await service.createImageAsset(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.id).toBe('test-image-id');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          asset_type: 'ai-generated',
          image_url: 'https://example.com/new-image.jpg',
          is_public: false, // 기본값
          view_count: 0,
          bookmark_count: 0,
          like_count: 0,
          use_count: 0,
        })
      );

      console.log('✅ GREEN: createImageAsset() 테스트 통과');
    });

    it('생성 시 is_public이 false여야 한다', async () => {
      // Given
      const command = {
        assetType: 'unsplash' as const,
        imageUrl: 'https://example.com/image.jpg',
        createdBy: TEST_USER_ID,
        workspaceId: TEST_WORKSPACE_ID,
      };

      vi.mocked(mockRepository.create).mockResolvedValue(mockImageAsset);

      // When
      const result = await service.createImageAsset(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          is_public: false,
        })
      );
    });

    it('통계가 모두 0으로 초기화되어야 한다', async () => {
      // Given
      const command = {
        assetType: 'user-upload' as const,
        imageUrl: 'https://example.com/image.jpg',
        createdBy: TEST_USER_ID,
        workspaceId: TEST_WORKSPACE_ID,
      };

      vi.mocked(mockRepository.create).mockResolvedValue(mockImageAsset);

      // When
      const result = await service.createImageAsset(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          view_count: 0,
          bookmark_count: 0,
          like_count: 0,
          use_count: 0,
        })
      );
    });

    it('Repository 실패 시 Result.err를 반환해야 한다', async () => {
      // Given
      const command = {
        assetType: 'ai-generated' as const,
        imageUrl: 'https://example.com/image.jpg',
        createdBy: TEST_USER_ID,
        workspaceId: TEST_WORKSPACE_ID,
      };

      vi.mocked(mockRepository.create).mockRejectedValue(
        new Error('Database error')
      );

      // When
      const result = await service.createImageAsset(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('CREATE_FAILED');
    });
  });

  describe('updateMetadata()', () => {
    it('🔴 RED: 권한이 있는 사용자는 메타데이터를 수정할 수 있어야 한다', async () => {
      // Given
      const command = {
        imageAssetId: 'test-image-id',
        title: 'Updated Title',
        tags: ['updated', 'test'],
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(mockImageAsset);
      vi.mocked(mockRepository.updateMetadata).mockResolvedValue({
        ...mockImageAsset,
        title: 'Updated Title',
        tags: ['updated', 'test'],
      });

      // When
      const result = await service.updateMetadata(command, TEST_USER_ID);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.title).toBe('Updated Title');

      console.log('✅ GREEN: updateMetadata() with permission 테스트 통과');
    });

    it('권한이 없는 사용자는 Permission denied 에러를 반환해야 한다', async () => {
      // Given
      const command = {
        imageAssetId: 'test-image-id',
        title: 'Updated Title',
      };

      const otherUserId = 'other-user-id';
      vi.mocked(mockRepository.findById).mockResolvedValue(mockImageAsset);

      // When
      const result = await service.updateMetadata(command, otherUserId);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('PERMISSION_DENIED');
      expect(mockRepository.updateMetadata).not.toHaveBeenCalled();
    });

    it('태그가 10개를 초과하면 에러를 반환해야 한다', async () => {
      // Given
      const command = {
        imageAssetId: 'test-image-id',
        tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(mockImageAsset);

      // When
      const result = await service.updateMetadata(command, TEST_USER_ID);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('TAG_LIMIT_EXCEEDED');
      expect(mockRepository.updateMetadata).not.toHaveBeenCalled();
    });

    it('ImageAsset이 없으면 Not found 에러를 반환해야 한다', async () => {
      // Given
      const command = {
        imageAssetId: 'non-existent-id',
        title: 'Updated Title',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      // When
      const result = await service.updateMetadata(command, TEST_USER_ID);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('changeVisibility()', () => {
    it('🔴 RED: 권한이 있는 사용자는 공개 설정을 변경할 수 있어야 한다', async () => {
      // Given
      const command = {
        imageAssetId: 'test-image-id',
        isPublic: true,
      };

      const imageWithTitleAndCategory = {
        ...mockImageAsset,
        title: 'Complete Image',
        category: 'art' as const,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(
        imageWithTitleAndCategory
      );
      vi.mocked(mockRepository.updateVisibility).mockResolvedValue({
        ...imageWithTitleAndCategory,
        is_public: true,
      });

      // When
      const result = await service.changeVisibility(command, TEST_USER_ID);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.is_public).toBe(true);

      console.log('✅ GREEN: changeVisibility() 테스트 통과');
    });

    it('Public 전환 시 제목이 없으면 에러를 반환해야 한다', async () => {
      // Given
      const command = {
        imageAssetId: 'test-image-id',
        isPublic: true,
      };

      const imageWithoutTitle = {
        ...mockImageAsset,
        title: null,
        category: 'art' as const,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(imageWithoutTitle);

      // When
      const result = await service.changeVisibility(command, TEST_USER_ID);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('VALIDATION_FAILED');
      expect(result.error.message).toContain('Title is required');
    });

    it('Public 전환 시 카테고리가 없으면 에러를 반환해야 한다', async () => {
      // Given
      const command = {
        imageAssetId: 'test-image-id',
        isPublic: true,
      };

      const imageWithoutCategory = {
        ...mockImageAsset,
        title: 'Test Image',
        category: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(
        imageWithoutCategory
      );

      // When
      const result = await service.changeVisibility(command, TEST_USER_ID);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('VALIDATION_FAILED');
      expect(result.error.message).toContain('Category is required');
    });

    it('Command에 title/category가 있으면 함께 업데이트해야 한다', async () => {
      // Given
      const command = {
        imageAssetId: 'test-image-id',
        isPublic: true,
        title: 'New Title',
        category: 'photo' as const,
      };

      const imageWithoutMetadata = {
        ...mockImageAsset,
        title: null,
        category: null,
      };

      vi.mocked(mockRepository.findById)
        .mockResolvedValueOnce(imageWithoutMetadata)
        .mockResolvedValueOnce({
          ...imageWithoutMetadata,
          title: 'New Title',
          category: 'photo',
        });

      vi.mocked(mockRepository.updateMetadata).mockResolvedValue({
        ...imageWithoutMetadata,
        title: 'New Title',
        category: 'photo',
      });

      vi.mocked(mockRepository.updateVisibility).mockResolvedValue({
        ...mockImageAsset,
        title: 'New Title',
        category: 'photo',
        is_public: true,
      });

      // When
      const result = await service.changeVisibility(command, TEST_USER_ID);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.updateMetadata).toHaveBeenCalledWith(
        'test-image-id',
        {
          title: 'New Title',
          category: 'photo',
        }
      );
    });

    it('Private로 변경은 항상 가능해야 한다', async () => {
      // Given
      const command = {
        imageAssetId: 'test-image-id',
        isPublic: false,
      };

      const imageWithoutMetadata = {
        ...mockImageAsset,
        title: null,
        category: null,
        is_public: true,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(
        imageWithoutMetadata
      );
      vi.mocked(mockRepository.updateVisibility).mockResolvedValue({
        ...imageWithoutMetadata,
        is_public: false,
      });

      // When
      const result = await service.changeVisibility(command, TEST_USER_ID);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.is_public).toBe(false);
    });
  });

  describe('getImageAsset()', () => {
    it('🔴 RED: 본인 이미지는 조회할 수 있어야 한다', async () => {
      // Given
      vi.mocked(mockRepository.findById).mockResolvedValue(mockImageAsset);

      // When
      const result = await service.getImageAsset('test-image-id', TEST_USER_ID);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.id).toBe('test-image-id');

      console.log('✅ GREEN: getImageAsset() 본인 조회 테스트 통과');
    });

    it('Public 이미지는 조회할 수 있어야 한다', async () => {
      // Given
      const publicImage = {
        ...mockImageAsset,
        is_public: true,
        created_by: 'other-user-id',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(publicImage);

      // When
      const result = await service.getImageAsset('test-image-id', TEST_USER_ID);

      // Then
      expect(result.isSuccess()).toBe(true);
    });

    it('Private이고 타인 이미지는 Permission denied 에러를 반환해야 한다', async () => {
      // Given
      const privateOtherImage = {
        ...mockImageAsset,
        is_public: false,
        created_by: 'other-user-id',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(privateOtherImage);

      // When
      const result = await service.getImageAsset('test-image-id', TEST_USER_ID);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('PERMISSION_DENIED');
    });

    it('삭제된 이미지는 에러를 반환해야 한다', async () => {
      // Given
      const deletedImage = {
        ...mockImageAsset,
        is_deleted: true,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(deletedImage);

      // When
      const result = await service.getImageAsset('test-image-id', TEST_USER_ID);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('PERMISSION_DENIED');
    });
  });
});

