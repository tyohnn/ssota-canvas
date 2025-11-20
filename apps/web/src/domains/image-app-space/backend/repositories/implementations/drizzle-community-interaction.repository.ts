/**
 * Drizzle CommunityInteraction Repository Implementation
 *
 * Technical Specification 참조: 04-technical-specification.md
 * 커뮤니티 상호작용 (좋아요, 북마크, 팔로우, 조회) Repository 구현
 */

import { eq, and, sql, count } from 'drizzle-orm';
import { createDrizzleSupabaseClient, adminDb } from '@/db';
import {
  imageLikes,
  imageBookmarks,
  userFollows,
  imageViews,
  type ImageLike,
  type NewImageLike,
  type ImageBookmark,
  type NewImageBookmark,
  type UserFollow,
  type NewUserFollow,
  type ImageView,
  type NewImageView,
} from '@/db/schemas/image-app-space-schema';
import type { ICommunityInteractionRepository } from '../interfaces/community-interaction.repository.interface';

/**
 * Drizzle ORM 기반 CommunityInteraction Repository 구현체
 */
export class DrizzleCommunityInteractionRepository
  implements ICommunityInteractionRepository
{
  // ============================================
  // Likes (좋아요)
  // ============================================

  /**
   * 좋아요 생성
   */
  async createLike(data: NewImageLike): Promise<ImageLike> {
    const db = await createDrizzleSupabaseClient();

    const result = await db.rls(tx =>
      tx.insert(imageLikes).values(data).returning()
    );

    return result[0];
  }

  /**
   * 좋아요 삭제
   */
  async deleteLike(userId: string, imageAssetId: string): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    await db.rls(tx =>
      tx
        .delete(imageLikes)
        .where(
          and(
            eq(imageLikes.user_id, userId),
            eq(imageLikes.image_asset_id, imageAssetId)
          )
        )
    );
  }

  /**
   * 좋아요 조회
   */
  async findLike(
    userId: string,
    imageAssetId: string
  ): Promise<ImageLike | null> {
    const db = await createDrizzleSupabaseClient();

    const result = await db.rls(tx =>
      tx.query.imageLikes.findFirst({
        where: and(
          eq(imageLikes.user_id, userId),
          eq(imageLikes.image_asset_id, imageAssetId)
        ),
      })
    );

    return result ?? null;
  }

  /**
   * 좋아요 여부 확인
   */
  async isLiked(userId: string, imageAssetId: string): Promise<boolean> {
    const like = await this.findLike(userId, imageAssetId);
    return like !== null;
  }

  // ============================================
  // Bookmarks (북마크)
  // ============================================

  /**
   * 북마크 생성
   */
  async createBookmark(data: NewImageBookmark): Promise<ImageBookmark> {
    const db = await createDrizzleSupabaseClient();

    const result = await db.rls(tx =>
      tx.insert(imageBookmarks).values(data).returning()
    );

    return result[0];
  }

  /**
   * 북마크 삭제
   */
  async deleteBookmark(userId: string, imageAssetId: string): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    await db.rls(tx =>
      tx
        .delete(imageBookmarks)
        .where(
          and(
            eq(imageBookmarks.user_id, userId),
            eq(imageBookmarks.image_asset_id, imageAssetId)
          )
        )
    );
  }

  /**
   * 북마크 조회
   */
  async findBookmark(
    userId: string,
    imageAssetId: string
  ): Promise<ImageBookmark | null> {
    const db = await createDrizzleSupabaseClient();

    const result = await db.rls(tx =>
      tx.query.imageBookmarks.findFirst({
        where: and(
          eq(imageBookmarks.user_id, userId),
          eq(imageBookmarks.image_asset_id, imageAssetId)
        ),
      })
    );

    return result ?? null;
  }

  /**
   * 북마크 여부 확인
   */
  async isBookmarked(userId: string, imageAssetId: string): Promise<boolean> {
    const bookmark = await this.findBookmark(userId, imageAssetId);
    return bookmark !== null;
  }

  // ============================================
  // Follows (팔로우)
  // ============================================

  /**
   * 팔로우 생성
   */
  async createFollow(data: NewUserFollow): Promise<UserFollow> {
    const db = await createDrizzleSupabaseClient();

    const result = await db.rls(tx =>
      tx.insert(userFollows).values(data).returning()
    );

    return result[0];
  }

  /**
   * 팔로우 삭제 (언팔로우)
   */
  async deleteFollow(followerId: string, followeeId: string): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    await db.rls(tx =>
      tx
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.follower_id, followerId),
            eq(userFollows.followee_id, followeeId)
          )
        )
    );
  }

  /**
   * 팔로우 조회
   */
  async findFollow(
    followerId: string,
    followeeId: string
  ): Promise<UserFollow | null> {
    const db = await createDrizzleSupabaseClient();

    const result = await db.rls(tx =>
      tx.query.userFollows.findFirst({
        where: and(
          eq(userFollows.follower_id, followerId),
          eq(userFollows.followee_id, followeeId)
        ),
      })
    );

    return result ?? null;
  }

  /**
   * 팔로우 여부 확인
   */
  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const follow = await this.findFollow(followerId, followeeId);
    return follow !== null;
  }

  /**
   * 팔로워 수 조회
   */
  async getFollowerCount(userId: string): Promise<number> {
    const db = await createDrizzleSupabaseClient();

    const result = await db.rls(tx =>
      tx
        .select({ count: count() })
        .from(userFollows)
        .where(eq(userFollows.followee_id, userId))
    );

    return result[0]?.count ?? 0;
  }

  /**
   * 팔로잉 수 조회
   */
  async getFollowingCount(userId: string): Promise<number> {
    const db = await createDrizzleSupabaseClient();

    const result = await db.rls(tx =>
      tx
        .select({ count: count() })
        .from(userFollows)
        .where(eq(userFollows.follower_id, userId))
    );

    return result[0]?.count ?? 0;
  }

  // ============================================
  // Views (조회수)
  // ============================================

  /**
   * 조회 기록 생성
   */
  async createView(data: NewImageView): Promise<ImageView> {
    // Views는 anon, authenticated 모두 허용
    const result = await adminDb.insert(imageViews).values(data).returning();

    return result[0]!;
  }

  /**
   * 최근 조회 여부 확인 (중복 방지)
   *
   * @param userId 사용자 ID (null이면 session_id로 확인)
   * @param imageAssetId 이미지 ID
   * @param sessionId 세션 ID (익명 사용자)
   * @param withinMinutes 몇 분 이내 조회했는지 (기본 30분)
   */
  async hasViewedRecently(
    userId: string | null,
    imageAssetId: string,
    sessionId?: string,
    withinMinutes: number = 30
  ): Promise<boolean> {
    // WHERE 조건: imageAssetId + (userId OR sessionId) + 시간 범위
    const whereConditions = and(
      eq(imageViews.image_asset_id, imageAssetId),
      sql`${imageViews.viewed_at} > NOW() - INTERVAL '${sql.raw(withinMinutes.toString())} minutes'`,
      userId
        ? eq(imageViews.user_id, userId)
        : sessionId
          ? eq(imageViews.session_id, sessionId)
          : sql`false` // userId도 sessionId도 없으면 false
    );

    const result = await adminDb
      .select({ count: count() })
      .from(imageViews)
      .where(whereConditions);

    return (result[0]?.count ?? 0) > 0;
  }
}
