/**
 * CommunityInteractionService Unit Tests
 *
 * Testing Strategy 참조: 05-testing-strategy.md
 * TDD RED-GREEN 방식으로 구현
 *
 * ⚠️ Mock Repository 사용 (Unit Test)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommunityInteractionService } from '../community-interaction.service';
import type { ICommunityInteractionRepository } from '../../repositories/interfaces/community-interaction.repository.interface';
import type {
  ImageLike,
  ImageBookmark,
  UserFollow,
} from '@/db/schemas/image-app-space-schema';

describe('CommunityInteractionService', () => {
  let service: CommunityInteractionService;
  let mockRepository: ICommunityInteractionRepository;

  // Test Data
  const TEST_USER_ID = '6be636e7-9934-4fc2-bd8a-a9c9c5cbe909';
  const TEST_IMAGE_ID = 'test-image-id';
  const TEST_FOLLOWEE_ID = 'followee-user-id';

  const mockLike: ImageLike = {
    user_id: TEST_USER_ID,
    image_asset_id: TEST_IMAGE_ID,
    created_at: new Date(),
  };

  const mockBookmark: ImageBookmark = {
    user_id: TEST_USER_ID,
    image_asset_id: TEST_IMAGE_ID,
    created_at: new Date(),
  };

  const mockFollow: UserFollow = {
    follower_id: TEST_USER_ID,
    followee_id: TEST_FOLLOWEE_ID,
    created_at: new Date(),
  };

  beforeEach(() => {
    // Mock Repository 생성
    mockRepository = {
      createLike: vi.fn(),
      deleteLike: vi.fn(),
      findLike: vi.fn(),
      isLiked: vi.fn(),
      createBookmark: vi.fn(),
      deleteBookmark: vi.fn(),
      findBookmark: vi.fn(),
      isBookmarked: vi.fn(),
      createFollow: vi.fn(),
      deleteFollow: vi.fn(),
      findFollow: vi.fn(),
      isFollowing: vi.fn(),
      getFollowerCount: vi.fn(),
      getFollowingCount: vi.fn(),
      createView: vi.fn(),
      hasViewedRecently: vi.fn(),
    };

    service = new CommunityInteractionService(mockRepository);
  });

  describe('toggleLike()', () => {
    it('🔴 RED: 좋아요가 없으면 추가해야 한다', async () => {
      // Given
      const command = { imageAssetId: TEST_IMAGE_ID };
      vi.mocked(mockRepository.findLike).mockResolvedValue(null);
      vi.mocked(mockRepository.createLike).mockResolvedValue(mockLike);

      // When
      const result = await service.toggleLike(command, TEST_USER_ID);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.liked).toBe(true);
      expect(mockRepository.createLike).toHaveBeenCalledWith({
        user_id: TEST_USER_ID,
        image_asset_id: TEST_IMAGE_ID,
      });

      console.log('✅ GREEN: toggleLike() 추가 테스트 통과');
    });

    it('좋아요가 있으면 제거해야 한다', async () => {
      // Given
      const command = { imageAssetId: TEST_IMAGE_ID };
      vi.mocked(mockRepository.findLike).mockResolvedValue(mockLike);

      // When
      const result = await service.toggleLike(command, TEST_USER_ID);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.liked).toBe(false);
      expect(mockRepository.deleteLike).toHaveBeenCalledWith(
        TEST_USER_ID,
        TEST_IMAGE_ID
      );
    });

    it('Repository 실패 시 에러를 반환해야 한다', async () => {
      // Given
      const command = { imageAssetId: TEST_IMAGE_ID };
      vi.mocked(mockRepository.findLike).mockRejectedValue(
        new Error('Database error')
      );

      // When
      const result = await service.toggleLike(command, TEST_USER_ID);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('TOGGLE_LIKE_FAILED');
    });
  });

  describe('toggleBookmark()', () => {
    it('🔴 RED: 북마크가 없으면 추가해야 한다', async () => {
      // Given
      const command = { imageAssetId: TEST_IMAGE_ID };
      vi.mocked(mockRepository.findBookmark).mockResolvedValue(null);
      vi.mocked(mockRepository.createBookmark).mockResolvedValue(mockBookmark);

      // When
      const result = await service.toggleBookmark(command, TEST_USER_ID);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.bookmarked).toBe(true);
      expect(mockRepository.createBookmark).toHaveBeenCalledWith({
        user_id: TEST_USER_ID,
        image_asset_id: TEST_IMAGE_ID,
      });

      console.log('✅ GREEN: toggleBookmark() 추가 테스트 통과');
    });

    it('북마크가 있으면 제거해야 한다', async () => {
      // Given
      const command = { imageAssetId: TEST_IMAGE_ID };
      vi.mocked(mockRepository.findBookmark).mockResolvedValue(mockBookmark);

      // When
      const result = await service.toggleBookmark(command, TEST_USER_ID);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.bookmarked).toBe(false);
      expect(mockRepository.deleteBookmark).toHaveBeenCalledWith(
        TEST_USER_ID,
        TEST_IMAGE_ID
      );
    });
  });

  describe('toggleFollow()', () => {
    it('🔴 RED: 팔로우가 없으면 추가해야 한다', async () => {
      // Given
      const command = { followeeId: TEST_FOLLOWEE_ID };
      vi.mocked(mockRepository.findFollow).mockResolvedValue(null);
      vi.mocked(mockRepository.createFollow).mockResolvedValue(mockFollow);

      // When
      const result = await service.toggleFollow(command, TEST_USER_ID);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.following).toBe(true);
      expect(mockRepository.createFollow).toHaveBeenCalledWith({
        follower_id: TEST_USER_ID,
        followee_id: TEST_FOLLOWEE_ID,
      });

      console.log('✅ GREEN: toggleFollow() 추가 테스트 통과');
    });

    it('팔로우가 있으면 제거해야 한다', async () => {
      // Given
      const command = { followeeId: TEST_FOLLOWEE_ID };
      vi.mocked(mockRepository.findFollow).mockResolvedValue(mockFollow);

      // When
      const result = await service.toggleFollow(command, TEST_USER_ID);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.following).toBe(false);
      expect(mockRepository.deleteFollow).toHaveBeenCalledWith(
        TEST_USER_ID,
        TEST_FOLLOWEE_ID
      );
    });

    it('자기 자신을 팔로우하려 하면 에러를 반환해야 한다', async () => {
      // Given
      const command = { followeeId: TEST_USER_ID }; // 자기 자신

      // When
      const result = await service.toggleFollow(command, TEST_USER_ID);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('SELF_FOLLOW_NOT_ALLOWED');
      expect(mockRepository.findFollow).not.toHaveBeenCalled();
    });
  });

  describe('recordView()', () => {
    it('🔴 RED: 30분 이내 중복 조회는 기록하지 않아야 한다', async () => {
      // Given
      vi.mocked(mockRepository.hasViewedRecently).mockResolvedValue(true);

      // When
      const result = await service.recordView(TEST_IMAGE_ID, TEST_USER_ID);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.createView).not.toHaveBeenCalled();

      console.log('✅ GREEN: recordView() 중복 방지 테스트 통과');
    });

    it('30분 이후 조회는 기록해야 한다', async () => {
      // Given
      vi.mocked(mockRepository.hasViewedRecently).mockResolvedValue(false);
      vi.mocked(mockRepository.createView).mockResolvedValue({
        id: 'view-id',
        user_id: TEST_USER_ID,
        image_asset_id: TEST_IMAGE_ID,
        session_id: null,
        viewed_at: new Date(),
      });

      // When
      const result = await service.recordView(TEST_IMAGE_ID, TEST_USER_ID);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.createView).toHaveBeenCalledWith({
        user_id: TEST_USER_ID,
        image_asset_id: TEST_IMAGE_ID,
        session_id: null,
      });
    });

    it('익명 사용자 조회도 기록해야 한다', async () => {
      // Given
      const sessionId = 'anonymous-session-123';
      vi.mocked(mockRepository.hasViewedRecently).mockResolvedValue(false);
      vi.mocked(mockRepository.createView).mockResolvedValue({
        id: 'view-id',
        user_id: null,
        image_asset_id: TEST_IMAGE_ID,
        session_id: sessionId,
        viewed_at: new Date(),
      });

      // When
      const result = await service.recordView(TEST_IMAGE_ID, null, sessionId);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.createView).toHaveBeenCalledWith({
        user_id: null,
        image_asset_id: TEST_IMAGE_ID,
        session_id: sessionId,
      });
    });

    it('조회수 기록 실패는 Silent Fail 처리해야 한다', async () => {
      // Given
      vi.mocked(mockRepository.hasViewedRecently).mockResolvedValue(false);
      vi.mocked(mockRepository.createView).mockRejectedValue(
        new Error('Database error')
      );

      // When
      const result = await service.recordView(TEST_IMAGE_ID, TEST_USER_ID);

      // Then: Silent Fail - 에러 대신 성공 반환
      expect(result.isSuccess()).toBe(true);
    });
  });
});

