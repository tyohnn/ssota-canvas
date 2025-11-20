/**
 * CommunityInteraction Service
 *
 * Technical Specification 참조: 04-technical-specification.md
 * 커뮤니티 상호작용 (좋아요, 북마크, 팔로우, 조회) 비즈니스 로직 처리
 */

import { Result } from '@/utils/result';
import type { ICommunityInteractionRepository } from '../repositories/interfaces/community-interaction.repository.interface';
import type { ICommunityInteractionService } from './interfaces/community-interaction.service.interface';
import type {
  LikeImageCommand,
  BookmarkImageCommand,
  FollowUserCommand,
} from '../../shared/commands/community-interaction.commands';

/**
 * Domain Error
 */
export class CommunityInteractionError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'CommunityInteractionError';
  }
}

/**
 * CommunityInteraction Service
 *
 * 커뮤니티 상호작용 비즈니스 로직 처리
 */
export class CommunityInteractionService
  implements ICommunityInteractionService
{
  constructor(private readonly repository: ICommunityInteractionRepository) {}

  /**
   * 좋아요 토글
   *
   * Process Model: Scenario 3 - Community Feed 상호작용
   */
  async toggleLike(
    command: LikeImageCommand,
    currentUserId: string
  ): Promise<Result<{ liked: boolean }, CommunityInteractionError>> {
    try {
      // 1. 기존 좋아요 조회
      const existingLike = await this.repository.findLike(
        currentUserId,
        command.imageAssetId
      );

      // 2. Toggle 로직
      if (existingLike) {
        // 좋아요가 있으면 제거 (Unlike)
        await this.repository.deleteLike(currentUserId, command.imageAssetId);
        return Result.success({ liked: false });
      } else {
        // 좋아요가 없으면 추가
        await this.repository.createLike({
          user_id: currentUserId,
          image_asset_id: command.imageAssetId,
        });
        return Result.success({ liked: true });
      }
    } catch (error) {
      return Result.error(
        new CommunityInteractionError(
          'TOGGLE_LIKE_FAILED',
          error instanceof Error ? error.message : 'Failed to toggle like'
        )
      );
    }
  }

  /**
   * 북마크 토글
   *
   * Process Model: Scenario 2 - Unsplash 이미지 북마크
   */
  async toggleBookmark(
    command: BookmarkImageCommand,
    currentUserId: string
  ): Promise<Result<{ bookmarked: boolean }, CommunityInteractionError>> {
    try {
      // 1. 기존 북마크 조회
      const existingBookmark = await this.repository.findBookmark(
        currentUserId,
        command.imageAssetId
      );

      // 2. Toggle 로직
      if (existingBookmark) {
        // 북마크가 있으면 제거
        await this.repository.deleteBookmark(
          currentUserId,
          command.imageAssetId
        );
        return Result.success({ bookmarked: false });
      } else {
        // 북마크가 없으면 추가
        await this.repository.createBookmark({
          user_id: currentUserId,
          image_asset_id: command.imageAssetId,
        });
        return Result.success({ bookmarked: true });
      }
    } catch (error) {
      return Result.error(
        new CommunityInteractionError(
          'TOGGLE_BOOKMARK_FAILED',
          error instanceof Error ? error.message : 'Failed to toggle bookmark'
        )
      );
    }
  }

  /**
   * 팔로우 토글
   *
   * Process Model: Scenario 3 - 크리에이터 팔로우
   */
  async toggleFollow(
    command: FollowUserCommand,
    currentUserId: string
  ): Promise<Result<{ following: boolean }, CommunityInteractionError>> {
    try {
      // 1. 자기 자신 팔로우 방지
      if (command.followeeId === currentUserId) {
        return Result.error(
          new CommunityInteractionError(
            'SELF_FOLLOW_NOT_ALLOWED',
            'Cannot follow yourself'
          )
        );
      }

      // 2. 기존 팔로우 조회
      const existingFollow = await this.repository.findFollow(
        currentUserId,
        command.followeeId
      );

      // 3. Toggle 로직
      if (existingFollow) {
        // 팔로우가 있으면 제거 (Unfollow)
        await this.repository.deleteFollow(currentUserId, command.followeeId);
        return Result.success({ following: false });
      } else {
        // 팔로우가 없으면 추가
        await this.repository.createFollow({
          follower_id: currentUserId,
          followee_id: command.followeeId,
        });
        return Result.success({ following: true });
      }
    } catch (error) {
      return Result.error(
        new CommunityInteractionError(
          'TOGGLE_FOLLOW_FAILED',
          error instanceof Error ? error.message : 'Failed to toggle follow'
        )
      );
    }
  }

  /**
   * 조회수 기록
   *
   * 30분 중복 방지 로직 포함
   */
  async recordView(
    imageAssetId: string,
    userId: string | null,
    sessionId?: string
  ): Promise<Result<void, CommunityInteractionError>> {
    try {
      // 1. 30분 이내 중복 조회 체크
      const hasViewedRecently = await this.repository.hasViewedRecently(
        userId,
        imageAssetId,
        sessionId,
        30
      );

      if (hasViewedRecently) {
        // 중복 조회는 기록하지 않음 (성공으로 처리)
        return Result.success(undefined);
      }

      // 2. 조회 기록 생성
      await this.repository.createView({
        user_id: userId ?? null,
        image_asset_id: imageAssetId,
        session_id: sessionId ?? null,
      });

      return Result.success(undefined);
    } catch (error) {
      // 조회수 기록 실패는 중요하지 않으므로 Silent Fail
      // 에러를 반환하지 않고 성공으로 처리
      console.warn('Failed to record view:', error);
      return Result.success(undefined);
    }
  }
}
