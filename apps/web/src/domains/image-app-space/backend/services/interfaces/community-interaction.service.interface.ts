/**
 * CommunityInteraction Service Interface
 *
 * Technical Specification 참조: 04-technical-specification.md
 * Service Layer 계약 정의 (테스트 용이성 및 의존성 역전)
 */

import { Result } from '@/utils/result';
import { CommunityInteractionError } from '../community-interaction.service';
import type {
  LikeImageCommand,
  BookmarkImageCommand,
  FollowUserCommand,
} from '../../../shared/commands/community-interaction.commands';

/**
 * CommunityInteraction Service Interface
 *
 * 커뮤니티 상호작용 비즈니스 로직 계약
 */
export interface ICommunityInteractionService {
  /**
   * 좋아요 토글
   *
   * Process Model: Scenario 3 - Community Feed 상호작용
   */
  toggleLike(
    command: LikeImageCommand,
    currentUserId: string
  ): Promise<Result<{ liked: boolean }, CommunityInteractionError>>;

  /**
   * 북마크 토글
   *
   * Process Model: Scenario 2 - Unsplash 이미지 북마크
   */
  toggleBookmark(
    command: BookmarkImageCommand,
    currentUserId: string
  ): Promise<Result<{ bookmarked: boolean }, CommunityInteractionError>>;

  /**
   * 팔로우 토글
   *
   * Process Model: Scenario 3 - 크리에이터 팔로우
   */
  toggleFollow(
    command: FollowUserCommand,
    currentUserId: string
  ): Promise<Result<{ following: boolean }, CommunityInteractionError>>;

  /**
   * 조회수 기록
   *
   * 30분 중복 방지 로직 포함
   */
  recordView(
    imageAssetId: string,
    userId: string | null,
    sessionId?: string
  ): Promise<Result<void, CommunityInteractionError>>;
}
