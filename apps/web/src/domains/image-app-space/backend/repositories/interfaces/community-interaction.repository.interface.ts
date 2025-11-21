/**
 * CommunityInteraction Repository Interface
 *
 * Technical Specification 참조: 04-technical-specification.md
 * 커뮤니티 상호작용 (좋아요, 북마크, 팔로우, 조회) 데이터 액세스 계약
 */

import type {
  ImageLike,
  NewImageLike,
  ImageBookmark,
  NewImageBookmark,
  UserFollow,
  NewUserFollow,
  ImageView,
  NewImageView,
} from '@/db/schemas/image-app-space-schema';

/**
 * CommunityInteraction Repository Interface
 *
 * 커뮤니티 상호작용 데이터 액세스 계약
 */
export interface ICommunityInteractionRepository {
  // ============================================
  // Likes (좋아요)
  // ============================================

  /**
   * 좋아요 생성
   */
  createLike(data: NewImageLike): Promise<ImageLike>;

  /**
   * 좋아요 삭제
   */
  deleteLike(userId: string, imageAssetId: string): Promise<void>;

  /**
   * 좋아요 조회
   */
  findLike(userId: string, imageAssetId: string): Promise<ImageLike | null>;

  /**
   * 좋아요 여부 확인
   */
  isLiked(userId: string, imageAssetId: string): Promise<boolean>;

  // ============================================
  // Bookmarks (북마크)
  // ============================================

  /**
   * 북마크 생성
   */
  createBookmark(data: NewImageBookmark): Promise<ImageBookmark>;

  /**
   * 북마크 삭제
   */
  deleteBookmark(userId: string, imageAssetId: string): Promise<void>;

  /**
   * 북마크 조회
   */
  findBookmark(
    userId: string,
    imageAssetId: string
  ): Promise<ImageBookmark | null>;

  /**
   * 북마크 여부 확인
   */
  isBookmarked(userId: string, imageAssetId: string): Promise<boolean>;

  // ============================================
  // Follows (팔로우)
  // ============================================

  /**
   * 팔로우 생성
   */
  createFollow(data: NewUserFollow): Promise<UserFollow>;

  /**
   * 팔로우 삭제 (언팔로우)
   */
  deleteFollow(followerId: string, followeeId: string): Promise<void>;

  /**
   * 팔로우 조회
   */
  findFollow(
    followerId: string,
    followeeId: string
  ): Promise<UserFollow | null>;

  /**
   * 팔로우 여부 확인
   */
  isFollowing(followerId: string, followeeId: string): Promise<boolean>;

  /**
   * 팔로워 수 조회
   */
  getFollowerCount(userId: string): Promise<number>;

  /**
   * 팔로잉 수 조회
   */
  getFollowingCount(userId: string): Promise<number>;

  // ============================================
  // Views (조회수)
  // ============================================

  /**
   * 조회 기록 생성
   */
  createView(data: NewImageView): Promise<ImageView>;

  /**
   * 최근 조회 여부 확인 (중복 방지)
   *
   * @param userId 사용자 ID (null이면 session_id로 확인)
   * @param imageAssetId 이미지 ID
   * @param withinMinutes 몇 분 이내 조회했는지 (기본 30분)
   */
  hasViewedRecently(
    userId: string | null,
    imageAssetId: string,
    sessionId?: string,
    withinMinutes?: number
  ): Promise<boolean>;
}
