/**
 * Community Interaction Commands
 *
 * Technical Specification 참조: 04-technical-specification.md
 * 커뮤니티 상호작용 관련 Command 패턴
 */

/**
 * 이미지 좋아요 Command
 *
 * Process Model: Scenario 3 - Community Feed 상호작용
 */
export interface LikeImageCommand {
  imageAssetId: string;
}

/**
 * 이미지 북마크 Command
 *
 * Process Model: Scenario 2 - Unsplash 이미지 북마크
 */
export interface BookmarkImageCommand {
  imageAssetId: string;
}

/**
 * 사용자 팔로우 Command
 *
 * Process Model: Scenario 3 - 크리에이터 팔로우
 */
export interface FollowUserCommand {
  followeeId: string;
}
