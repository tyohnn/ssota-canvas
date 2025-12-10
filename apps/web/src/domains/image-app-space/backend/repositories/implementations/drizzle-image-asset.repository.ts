/**
 * Drizzle ImageAsset Repository Implementation
 *
 * Technical Specification 참조: 04-technical-specification.md
 * Drizzle ORM을 사용한 ImageAsset Repository 구현
 *
 * ⚠️ adminDb 사용: Service Layer에서 권한 체크 완료 후 호출
 */

import { eq, and, sql, desc } from 'drizzle-orm';
import { adminDb } from '@/db';
import {
  imageAssets,
  userFollows,
  type ImageAsset,
  type NewImageAsset,
  type ImageCategory,
  type ImageAssetType,
} from '@/db/schemas/image-app-space-schema';
import { profiles } from '@/db/schema';
import type {
  IImageAssetRepository,
  FindPublicImagesParams,
  FindFollowingImagesParams,
  FindWorkspaceImagesParams,
  ImageAssetWithCreator,
  ImageAssetWithStats,
  UpdateMetadataParams,
} from '../interfaces/image-asset.repository.interface';

/**
 * Drizzle ORM 기반 ImageAsset Repository 구현체
 */
export class DrizzleImageAssetRepository implements IImageAssetRepository {
  /**
   * 이미지 생성
   */
  async create(data: NewImageAsset): Promise<ImageAsset> {
    const result = await adminDb.insert(imageAssets).values(data).returning();

    return result[0]!;
  }

  /**
   * ID로 조회
   */
  async findById(id: string): Promise<ImageAsset | null> {
    const result = await adminDb.query.imageAssets.findFirst({
      where: eq(imageAssets.id, id),
    });

    return result ?? null;
  }

  /**
   * ID로 조회 (Creator Profile 포함)
   */
  async findByIdWithCreator(id: string): Promise<ImageAssetWithCreator | null> {
    const result = await adminDb
      .select({
        // ImageAsset 필드들
        id: imageAssets.id,
        asset_type: imageAssets.asset_type,
        image_url: imageAssets.image_url,
        thumbnail_url: imageAssets.thumbnail_url,
        width: imageAssets.width,
        height: imageAssets.height,
        file_size: imageAssets.file_size,
        mime_type: imageAssets.mime_type,
        signed_url: imageAssets.signed_url,
        signed_url_expires_at: imageAssets.signed_url_expires_at,
        prompt: imageAssets.prompt,
        negative_prompt: imageAssets.negative_prompt,
        metadata: imageAssets.metadata,
        title: imageAssets.title,
        description: imageAssets.description,
        tags: imageAssets.tags,
        category: imageAssets.category,
        created_by: imageAssets.created_by,
        workspace_id: imageAssets.workspace_id,
        is_public: imageAssets.is_public,
        is_deleted: imageAssets.is_deleted,
        view_count: imageAssets.view_count,
        bookmark_count: imageAssets.bookmark_count,
        like_count: imageAssets.like_count,
        use_count: imageAssets.use_count,
        created_at: imageAssets.created_at,
        updated_at: imageAssets.updated_at,
        deleted_at: imageAssets.deleted_at,

        // Creator Profile
        creatorId: profiles.id,
        creatorName: profiles.name,
        creatorAvatarUrl: profiles.avatar_url,
      })
      .from(imageAssets)
      .leftJoin(profiles, eq(imageAssets.created_by, profiles.id))
      .where(eq(imageAssets.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;

    // 결과 변환
    const imageAsset: ImageAssetWithCreator = {
      id: row.id,
      asset_type: row.asset_type,
      image_url: row.image_url,
      thumbnail_url: row.thumbnail_url,
      width: row.width,
      height: row.height,
      file_size: row.file_size,
      mime_type: row.mime_type,
      signed_url: row.signed_url,
      signed_url_expires_at: row.signed_url_expires_at,
      prompt: row.prompt,
      negative_prompt: row.negative_prompt,
      metadata: row.metadata,
      title: row.title,
      description: row.description,
      tags: row.tags,
      category: row.category,
      created_by: row.created_by,
      workspace_id: row.workspace_id,
      is_public: row.is_public,
      is_deleted: row.is_deleted,
      view_count: row.view_count,
      bookmark_count: row.bookmark_count,
      like_count: row.like_count,
      use_count: row.use_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      creatorProfile: row.creatorId
        ? {
            id: row.creatorId,
            name: row.creatorName || 'Unknown',
            avatarUrl: row.creatorAvatarUrl,
          }
        : undefined,
    };

    return imageAsset;
  }

  /**
   * ID로 조회 (Stats 포함)
   */
  async findByIdWithStats(
    id: string,
    currentUserId: string
  ): Promise<ImageAssetWithStats | null> {
    const result = await adminDb
      .select({
        // ImageAsset 필드들
        id: imageAssets.id,
        asset_type: imageAssets.asset_type,
        image_url: imageAssets.image_url,
        thumbnail_url: imageAssets.thumbnail_url,
        width: imageAssets.width,
        height: imageAssets.height,
        file_size: imageAssets.file_size,
        mime_type: imageAssets.mime_type,
        signed_url: imageAssets.signed_url,
        signed_url_expires_at: imageAssets.signed_url_expires_at,
        prompt: imageAssets.prompt,
        negative_prompt: imageAssets.negative_prompt,
        metadata: imageAssets.metadata,
        title: imageAssets.title,
        description: imageAssets.description,
        tags: imageAssets.tags,
        category: imageAssets.category,
        created_by: imageAssets.created_by,
        workspace_id: imageAssets.workspace_id,
        is_public: imageAssets.is_public,
        is_deleted: imageAssets.is_deleted,
        view_count: imageAssets.view_count,
        bookmark_count: imageAssets.bookmark_count,
        like_count: imageAssets.like_count,
        use_count: imageAssets.use_count,
        created_at: imageAssets.created_at,
        updated_at: imageAssets.updated_at,
        deleted_at: imageAssets.deleted_at,

        // Creator Profile
        creatorId: profiles.id,
        creatorName: profiles.name,
        creatorAvatarUrl: profiles.avatar_url,

        // Stats
        isLiked: sql<boolean>`EXISTS(
          SELECT 1 FROM image_app_space.image_likes
          WHERE image_asset_id = ${imageAssets.id}
          AND user_id = ${currentUserId}
        )`,
        isBookmarked: sql<boolean>`EXISTS(
          SELECT 1 FROM image_app_space.image_bookmarks
          WHERE image_asset_id = ${imageAssets.id}
          AND user_id = ${currentUserId}
        )`,
      })
      .from(imageAssets)
      .leftJoin(profiles, eq(imageAssets.created_by, profiles.id))
      .where(eq(imageAssets.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;

    // 결과 변환
    const imageAssetWithStats: ImageAssetWithStats = {
      id: row.id,
      asset_type: row.asset_type,
      image_url: row.image_url,
      thumbnail_url: row.thumbnail_url,
      width: row.width,
      height: row.height,
      file_size: row.file_size,
      mime_type: row.mime_type,
      signed_url: row.signed_url,
      signed_url_expires_at: row.signed_url_expires_at,
      prompt: row.prompt,
      negative_prompt: row.negative_prompt,
      metadata: row.metadata,
      title: row.title,
      description: row.description,
      tags: row.tags,
      category: row.category,
      created_by: row.created_by,
      workspace_id: row.workspace_id,
      is_public: row.is_public,
      is_deleted: row.is_deleted,
      view_count: row.view_count,
      bookmark_count: row.bookmark_count,
      like_count: row.like_count,
      use_count: row.use_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      creatorProfile: row.creatorId
        ? {
            id: row.creatorId,
            name: row.creatorName || 'Unknown',
            avatarUrl: row.creatorAvatarUrl,
          }
        : undefined,
      isLiked: row.isLiked,
      isBookmarked: row.isBookmarked,
    };

    return imageAssetWithStats;
  }

  /**
   * Public 이미지 조회 (Community Feed)
   *
   * Process Model: Scenario 3 - Community Feed
   */
  async findPublicImages(
    params: FindPublicImagesParams
  ): Promise<ImageAssetWithStats[]> {
    const { sort, category, page, perPage, currentUserId } = params;

    // 정렬 로직
    let orderByClause: any;
    if (sort === 'trending') {
      // Popularity Score = view_count + like_count * 2 + bookmark_count * 3
      orderByClause = desc(
        sql`${imageAssets.view_count} + ${imageAssets.like_count} * 2 + ${imageAssets.bookmark_count} * 3`
      );
    } else if (sort === 'views') {
      orderByClause = desc(imageAssets.view_count);
    } else {
      // 'recent'
      orderByClause = desc(imageAssets.created_at);
    }

    // WHERE 조건
    const whereConditions = and(
      eq(imageAssets.is_public, true),
      eq(imageAssets.is_deleted, false),
      sql`${imageAssets.created_at} > NOW() - INTERVAL '30 days'`,
      category ? eq(imageAssets.category, category as ImageCategory) : undefined
    );

    const offset = (page - 1) * perPage;

    const results = await adminDb
      .select({
        // ImageAsset 필드들
        id: imageAssets.id,
        asset_type: imageAssets.asset_type,
        image_url: imageAssets.image_url,
        thumbnail_url: imageAssets.thumbnail_url,
        width: imageAssets.width,
        height: imageAssets.height,
        file_size: imageAssets.file_size,
        mime_type: imageAssets.mime_type,
        signed_url: imageAssets.signed_url,
        signed_url_expires_at: imageAssets.signed_url_expires_at,
        prompt: imageAssets.prompt,
        negative_prompt: imageAssets.negative_prompt,
        metadata: imageAssets.metadata,
        title: imageAssets.title,
        description: imageAssets.description,
        tags: imageAssets.tags,
        category: imageAssets.category,
        created_by: imageAssets.created_by,
        workspace_id: imageAssets.workspace_id,
        is_public: imageAssets.is_public,
        is_deleted: imageAssets.is_deleted,
        view_count: imageAssets.view_count,
        bookmark_count: imageAssets.bookmark_count,
        like_count: imageAssets.like_count,
        use_count: imageAssets.use_count,
        created_at: imageAssets.created_at,
        updated_at: imageAssets.updated_at,
        deleted_at: imageAssets.deleted_at,

        // Creator Profile
        creatorId: profiles.id,
        creatorName: profiles.name,
        creatorAvatarUrl: profiles.avatar_url,

        // Stats
        isLiked: currentUserId
          ? sql<boolean>`EXISTS(
              SELECT 1 FROM image_app_space.image_likes
              WHERE image_asset_id = ${imageAssets.id}
              AND user_id = ${currentUserId}
            )`
          : sql<boolean>`false`,
        isBookmarked: currentUserId
          ? sql<boolean>`EXISTS(
              SELECT 1 FROM image_app_space.image_bookmarks
              WHERE image_asset_id = ${imageAssets.id}
              AND user_id = ${currentUserId}
            )`
          : sql<boolean>`false`,
      })
      .from(imageAssets)
      .leftJoin(profiles, eq(imageAssets.created_by, profiles.id))
      .where(whereConditions)
      .orderBy(orderByClause)
      .limit(perPage)
      .offset(offset);

    return results.map((row: any) => ({
      id: row.id,
      asset_type: row.asset_type,
      image_url: row.image_url,
      thumbnail_url: row.thumbnail_url,
      width: row.width,
      height: row.height,
      file_size: row.file_size,
      mime_type: row.mime_type,
      signed_url: row.signed_url,
      signed_url_expires_at: row.signed_url_expires_at,
      prompt: row.prompt,
      negative_prompt: row.negative_prompt,
      metadata: row.metadata,
      title: row.title,
      description: row.description,
      tags: row.tags,
      category: row.category,
      created_by: row.created_by,
      workspace_id: row.workspace_id,
      is_public: row.is_public,
      is_deleted: row.is_deleted,
      view_count: row.view_count,
      bookmark_count: row.bookmark_count,
      like_count: row.like_count,
      use_count: row.use_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      creatorProfile: row.creatorId
        ? {
            id: row.creatorId,
            name: row.creatorName || 'Unknown',
            avatarUrl: row.creatorAvatarUrl,
          }
        : undefined,
      isLiked: row.isLiked,
      isBookmarked: row.isBookmarked,
    }));
  }

  /**
   * Following 사용자 이미지 조회 (Following Feed)
   *
   * Process Model: Scenario 5 - Following Feed
   */
  async findFollowingUserImages(
    params: FindFollowingImagesParams
  ): Promise<ImageAssetWithStats[]> {
    const { userId, page, perPage } = params;
    const offset = (page - 1) * perPage;

    const results = await adminDb
      .select({
        // ImageAsset 필드들
        id: imageAssets.id,
        asset_type: imageAssets.asset_type,
        image_url: imageAssets.image_url,
        thumbnail_url: imageAssets.thumbnail_url,
        width: imageAssets.width,
        height: imageAssets.height,
        file_size: imageAssets.file_size,
        mime_type: imageAssets.mime_type,
        signed_url: imageAssets.signed_url,
        signed_url_expires_at: imageAssets.signed_url_expires_at,
        prompt: imageAssets.prompt,
        negative_prompt: imageAssets.negative_prompt,
        metadata: imageAssets.metadata,
        title: imageAssets.title,
        description: imageAssets.description,
        tags: imageAssets.tags,
        category: imageAssets.category,
        created_by: imageAssets.created_by,
        workspace_id: imageAssets.workspace_id,
        is_public: imageAssets.is_public,
        is_deleted: imageAssets.is_deleted,
        view_count: imageAssets.view_count,
        bookmark_count: imageAssets.bookmark_count,
        like_count: imageAssets.like_count,
        use_count: imageAssets.use_count,
        created_at: imageAssets.created_at,
        updated_at: imageAssets.updated_at,
        deleted_at: imageAssets.deleted_at,

        // Creator Profile
        creatorId: profiles.id,
        creatorName: profiles.name,
        creatorAvatarUrl: profiles.avatar_url,

        // Stats
        isLiked: sql<boolean>`EXISTS(
          SELECT 1 FROM image_app_space.image_likes
          WHERE image_asset_id = ${imageAssets.id}
          AND user_id = ${userId}
        )`,
        isBookmarked: sql<boolean>`EXISTS(
          SELECT 1 FROM image_app_space.image_bookmarks
          WHERE image_asset_id = ${imageAssets.id}
          AND user_id = ${userId}
        )`,
      })
      .from(imageAssets)
      .innerJoin(
        userFollows,
        eq(imageAssets.created_by, userFollows.followee_id)
      )
      .leftJoin(profiles, eq(imageAssets.created_by, profiles.id))
      .where(
        and(
          eq(userFollows.follower_id, userId),
          eq(imageAssets.is_public, true),
          eq(imageAssets.is_deleted, false)
        )
      )
      .orderBy(desc(imageAssets.created_at))
      .limit(perPage)
      .offset(offset);

    return results.map((row: any) => ({
      id: row.id,
      asset_type: row.asset_type,
      image_url: row.image_url,
      thumbnail_url: row.thumbnail_url,
      width: row.width,
      height: row.height,
      file_size: row.file_size,
      mime_type: row.mime_type,
      signed_url: row.signed_url,
      signed_url_expires_at: row.signed_url_expires_at,
      prompt: row.prompt,
      negative_prompt: row.negative_prompt,
      metadata: row.metadata,
      title: row.title,
      description: row.description,
      tags: row.tags,
      category: row.category,
      created_by: row.created_by,
      workspace_id: row.workspace_id,
      is_public: row.is_public,
      is_deleted: row.is_deleted,
      view_count: row.view_count,
      bookmark_count: row.bookmark_count,
      like_count: row.like_count,
      use_count: row.use_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      creatorProfile: row.creatorId
        ? {
            id: row.creatorId,
            name: row.creatorName || 'Unknown',
            avatarUrl: row.creatorAvatarUrl,
          }
        : undefined,
      isLiked: row.isLiked,
      isBookmarked: row.isBookmarked,
    }));
  }

  /**
   * Workspace 이미지 조회 (협업용)
   *
   * 워크스페이스의 모든 멤버가 업로드한 이미지 조회
   * created_by 체크하지 않음 (팀 협업)
   */
  async findWorkspaceImages(
    params: FindWorkspaceImagesParams
  ): Promise<ImageAsset[]> {
    const { workspaceId, filterType, page, perPage } = params;

    const whereConditions = and(
      eq(imageAssets.workspace_id, workspaceId),
      eq(imageAssets.is_deleted, false),
      filterType !== 'all'
        ? eq(imageAssets.asset_type, filterType as ImageAssetType)
        : undefined
    );

    const result = await adminDb
      .select()
      .from(imageAssets)
      .where(whereConditions)
      .orderBy(desc(imageAssets.created_at))
      .limit(perPage)
      .offset((page - 1) * perPage);

    return result;
  }

  /**
   * 메타데이터 업데이트
   *
   * Process Model: Scenario 6 - 메타데이터 편집
   */
  async updateMetadata(
    id: string,
    data: UpdateMetadataParams
  ): Promise<ImageAsset> {
    const result = await adminDb
      .update(imageAssets)
      .set({
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.category !== undefined && {
          category: data.category as ImageCategory,
        }),
        updated_at: sql`NOW()`,
      })
      .where(eq(imageAssets.id, id))
      .returning();

    return result[0]!;
  }

  /**
   * 공개 설정 변경
   *
   * Process Model: Scenario 7 - Public 전환
   */
  async updateVisibility(id: string, isPublic: boolean): Promise<ImageAsset> {
    const result = await adminDb
      .update(imageAssets)
      .set({
        is_public: isPublic,
        updated_at: sql`NOW()`,
      })
      .where(eq(imageAssets.id, id))
      .returning();

    return result[0]!;
  }

  /**
   * Soft Delete
   */
  async softDelete(id: string): Promise<void> {
    await adminDb
      .update(imageAssets)
      .set({
        is_deleted: true,
        deleted_at: sql`NOW()`,
      })
      .where(eq(imageAssets.id, id));
  }

  /**
   * 복원
   */
  async restore(id: string): Promise<void> {
    await adminDb
      .update(imageAssets)
      .set({
        is_deleted: false,
        deleted_at: null,
      })
      .where(eq(imageAssets.id, id));
  }

  /**
   * Signed URL 캐시 업데이트
   *
   * @param id - 이미지 자산 ID
   * @param signedUrl - 새로 생성된 signed URL
   * @param expiresAt - 만료 시간
   */
  async updateSignedUrl(
    id: string,
    signedUrl: string,
    expiresAt: Date
  ): Promise<void> {
    await adminDb
      .update(imageAssets)
      .set({
        signed_url: signedUrl,
        signed_url_expires_at: expiresAt,
        updated_at: new Date(),
      })
      .where(eq(imageAssets.id, id));
  }

  /**
   * Unsplash photoId로 조회
   */
  async findByUnsplashPhotoId(photoId: string): Promise<ImageAsset | null> {
    const results = await adminDb
      .select()
      .from(imageAssets)
      .where(
        and(
          eq(imageAssets.asset_type, 'unsplash'),
          sql`${imageAssets.metadata}->>'photoId' = ${photoId}`,
          eq(imageAssets.is_deleted, false)
        )
      )
      .limit(1);

    return results[0] || null;
  }

  /**
   * use_count 증가
   */
  async incrementUseCount(id: string): Promise<void> {
    await adminDb
      .update(imageAssets)
      .set({
        use_count: sql`${imageAssets.use_count} + 1`,
        updated_at: new Date(),
      })
      .where(eq(imageAssets.id, id));
  }
}
