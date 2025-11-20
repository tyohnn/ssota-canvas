/**
 * Image App Space Schema
 *
 * 이미지 블록 앱스페이스를 위한 커스텀 스키마
 *
 * 이 스키마는 이미지 블록과 관련된 확장 기능들을 포함합니다:
 * - 이미지 크리에이터 (AI 이미지 생성)
 * - 커뮤니티 기능 (좋아요, 조회수, 북마크)
 * - 이미지 데이터 관리 및 검색
 *
 * Supabase에서 이 스키마를 노출하려면:
 * 1. Settings → API → Exposed schemas에 'image_app_space' 추가
 * 2. 마이그레이션에서 권한 설정 (GRANT USAGE 등)
 */

import {
  pgSchema,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  check,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { anonRole, authenticatedRole } from 'drizzle-orm/supabase';

// Import public schema tables for FK references
import { profiles, workspaces, blocks, pages } from '../schema';

/**
 * Image App Space Schema
 */
export const imageAppSpaceSchema = pgSchema('image_app_space');

// ============================================
// Enums (image_app_space 스키마 내)
// ============================================

/**
 * Image Asset Type
 * - ai-generated: AI로 생성된 이미지
 * - unsplash: Unsplash에서 가져온 이미지 (북마크/좋아요 시에만 저장)
 * - user-upload: 사용자가 직접 업로드한 이미지
 */
export const imageAssetTypeEnum = imageAppSpaceSchema.enum('image_asset_type', [
  'ai-generated',
  'unsplash',
  'user-upload',
]);

/**
 * Image Category
 * 이미지 분류를 위한 카테고리
 */
export const imageCategoryEnum = imageAppSpaceSchema.enum('image_category', [
  'art',
  'photo',
  'illustration',
  'design',
  'abstract',
  'nature',
  'architecture',
  'portrait',
  'landscape',
  'other',
]);

// ============================================
// Tables
// ============================================

/**
 * Image Assets Table
 *
 * 통합 이미지 에셋 관리 테이블
 * - AI 생성 이미지
 * - Unsplash 이미지 (북마크/좋아요 시에만 저장)
 * - 사용자 업로드 이미지
 */
export const imageAssets = imageAppSpaceSchema
  .table(
    'image_assets',
    {
      // Primary Key
      id: uuid('id').primaryKey().defaultRandom(),

      // Asset Type
      asset_type: imageAssetTypeEnum('asset_type').notNull(),

      // Image Data
      image_url: text('image_url').notNull(),
      thumbnail_url: text('thumbnail_url'),
      width: integer('width'),
      height: integer('height'),
      file_size: integer('file_size'), // bytes
      mime_type: text('mime_type'), // 'image/png', 'image/jpeg', etc.

      // Prompt Information (AI 생성 이미지만)
      prompt: text('prompt'),
      negative_prompt: text('negative_prompt'),
      // TODO: prompt_embedding vector(1536) - pgvector 확장 필요

      // Metadata (JSONB로 통합)
      // AI: { modelId, seed, aspectRatio, quality, style, generationMetadata }
      // Unsplash: { photoId, authorName, authorUsername, authorLink }
      // User Upload: { originalFilename, uploadedFrom }
      metadata: jsonb('metadata').default({}),

      // Classification
      title: text('title'),
      description: text('description'),
      tags: text('tags').array(), // PostgreSQL text array
      category: imageCategoryEnum('category'),

      // Ownership & Visibility
      created_by: uuid('created_by')
        .notNull()
        .references(() => profiles.id, { onDelete: 'cascade' }),
      workspace_id: uuid('workspace_id')
        .notNull()
        .references(() => workspaces.id, { onDelete: 'cascade' }),
      is_public: boolean('is_public').notNull().default(false),
      is_deleted: boolean('is_deleted').notNull().default(false),

      // Statistics (비정규화)
      view_count: integer('view_count').notNull().default(0),
      bookmark_count: integer('bookmark_count').notNull().default(0),
      like_count: integer('like_count').notNull().default(0),
      use_count: integer('use_count').notNull().default(0),

      // Timestamps
      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
      updated_at: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
      deleted_at: timestamp('deleted_at', { withTimezone: true }),
    },
    table => ({
      // Indexes
      creatorIdx: index('idx_image_assets_creator')
        .on(table.created_by)
        .where(sql`${table.is_deleted} = false`),
      workspaceIdx: index('idx_image_assets_workspace')
        .on(table.workspace_id)
        .where(sql`${table.is_deleted} = false`),
      publicIdx: index('idx_image_assets_public')
        .on(table.is_public, table.created_at)
        .where(sql`${table.is_deleted} = false`),
      typeIdx: index('idx_image_assets_type').on(
        table.asset_type,
        table.created_at
      ),
      categoryIdx: index('idx_image_assets_category')
        .on(table.category, table.created_at)
        .where(sql`${table.is_deleted} = false`),
      tagsIdx: index('idx_image_assets_tags').using('gin', sql`${table.tags}`),

      // RLS Policies
      selectPolicy: pgPolicy('image_assets_select_policy', {
        for: 'select',
        to: authenticatedRole,
        using: sql`(${table.created_by} = auth.uid()) OR (${table.is_public} = true AND ${table.is_deleted} = false)`,
      }),
      insertPolicy: pgPolicy('image_assets_insert_policy', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql`${table.created_by} = auth.uid()`,
      }),
      updatePolicy: pgPolicy('image_assets_update_policy', {
        for: 'update',
        to: authenticatedRole,
        using: sql`${table.created_by} = auth.uid()`,
      }),
      deletePolicy: pgPolicy('image_assets_delete_policy', {
        for: 'delete',
        to: authenticatedRole,
        using: sql`${table.created_by} = auth.uid()`,
      }),
    })
  )
  .enableRLS();

/**
 * Image Asset Usage Table
 *
 * 이미지가 어떤 블록에서 사용되는지 추적
 */
export const imageAssetUsage = imageAppSpaceSchema
  .table(
    'image_asset_usage',
    {
      id: uuid('id').primaryKey().defaultRandom(),
      image_asset_id: uuid('image_asset_id')
        .notNull()
        .references(() => imageAssets.id, { onDelete: 'cascade' }),
      block_id: uuid('block_id')
        .notNull()
        .references(() => blocks.id, { onDelete: 'cascade' }),
      page_id: uuid('page_id')
        .notNull()
        .references(() => pages.id, { onDelete: 'cascade' }),

      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    table => ({
      // Unique constraint: 같은 블록에 같은 이미지는 한 번만
      uniqueUsage: index('idx_image_asset_usage_unique').on(
        table.image_asset_id,
        table.block_id
      ),
      // Indexes
      imageIdx: index('idx_image_asset_usage_image').on(table.image_asset_id),
      blockIdx: index('idx_image_asset_usage_block').on(table.block_id),
      pageIdx: index('idx_image_asset_usage_page').on(table.page_id),

      // RLS: Block과 동일한 권한
      selectPolicy: pgPolicy('image_asset_usage_select_policy', {
        for: 'select',
        to: authenticatedRole,
        using: sql`EXISTS (
        SELECT 1 FROM public.pages 
        WHERE pages.id = ${table.page_id} 
        AND pages.created_by = auth.uid()
      )`,
      }),
      insertPolicy: pgPolicy('image_asset_usage_insert_policy', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql`EXISTS (
        SELECT 1 FROM public.pages 
        WHERE pages.id = ${table.page_id} 
        AND pages.created_by = auth.uid()
      )`,
      }),
      deletePolicy: pgPolicy('image_asset_usage_delete_policy', {
        for: 'delete',
        to: authenticatedRole,
        using: sql`EXISTS (
        SELECT 1 FROM public.pages 
        WHERE pages.id = ${table.page_id} 
        AND pages.created_by = auth.uid()
      )`,
      }),
    })
  )
  .enableRLS();

/**
 * User Follows Table
 *
 * 사용자 간 팔로우 관계
 */
export const userFollows = imageAppSpaceSchema
  .table(
    'user_follows',
    {
      follower_id: uuid('follower_id')
        .notNull()
        .references(() => profiles.id, { onDelete: 'cascade' }),
      followee_id: uuid('followee_id')
        .notNull()
        .references(() => profiles.id, { onDelete: 'cascade' }),

      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    table => ({
      // Composite PK
      pk: sql`PRIMARY KEY (follower_id, followee_id)`,

      // Checks
      noSelfFollow: check(
        'user_follows_no_self_follow',
        sql`${table.follower_id} != ${table.followee_id}`
      ),

      // Indexes
      followerIdx: index('idx_user_follows_follower').on(table.follower_id),
      followeeIdx: index('idx_user_follows_followee').on(table.followee_id),

      // RLS
      selectPolicy: pgPolicy('user_follows_select_policy', {
        for: 'select',
        to: authenticatedRole,
        using: sql`true`, // 누구나 팔로우 관계 조회 가능
      }),
      insertPolicy: pgPolicy('user_follows_insert_policy', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql`${table.follower_id} = auth.uid()`, // 자신만 팔로우 가능
      }),
      deletePolicy: pgPolicy('user_follows_delete_policy', {
        for: 'delete',
        to: authenticatedRole,
        using: sql`${table.follower_id} = auth.uid()`, // 자신만 언팔로우 가능
      }),
    })
  )
  .enableRLS();

/**
 * Image Bookmarks Table
 *
 * 이미지 북마크 (찜하기)
 * Unsplash 이미지를 북마크하면 image_assets에도 저장됨
 */
export const imageBookmarks = imageAppSpaceSchema
  .table(
    'image_bookmarks',
    {
      user_id: uuid('user_id')
        .notNull()
        .references(() => profiles.id, { onDelete: 'cascade' }),
      image_asset_id: uuid('image_asset_id')
        .notNull()
        .references(() => imageAssets.id, { onDelete: 'cascade' }),

      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    table => ({
      // Composite PK
      pk: sql`PRIMARY KEY (user_id, image_asset_id)`,

      // Indexes
      userIdx: index('idx_image_bookmarks_user').on(table.user_id),
      imageIdx: index('idx_image_bookmarks_image').on(table.image_asset_id),

      // RLS
      selectPolicy: pgPolicy('image_bookmarks_select_policy', {
        for: 'select',
        to: authenticatedRole,
        using: sql`${table.user_id} = auth.uid()`, // 자신의 북마크만 조회
      }),
      insertPolicy: pgPolicy('image_bookmarks_insert_policy', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql`${table.user_id} = auth.uid()`,
      }),
      deletePolicy: pgPolicy('image_bookmarks_delete_policy', {
        for: 'delete',
        to: authenticatedRole,
        using: sql`${table.user_id} = auth.uid()`,
      }),
    })
  )
  .enableRLS();

/**
 * Image Likes Table
 *
 * 이미지 좋아요
 * Unsplash 이미지를 좋아요하면 image_assets에도 저장됨
 */
export const imageLikes = imageAppSpaceSchema
  .table(
    'image_likes',
    {
      user_id: uuid('user_id')
        .notNull()
        .references(() => profiles.id, { onDelete: 'cascade' }),
      image_asset_id: uuid('image_asset_id')
        .notNull()
        .references(() => imageAssets.id, { onDelete: 'cascade' }),

      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    table => ({
      // Composite PK
      pk: sql`PRIMARY KEY (user_id, image_asset_id)`,

      // Indexes
      userIdx: index('idx_image_likes_user').on(table.user_id),
      imageIdx: index('idx_image_likes_image').on(table.image_asset_id),

      // RLS
      selectPolicy: pgPolicy('image_likes_select_policy', {
        for: 'select',
        to: authenticatedRole,
        using: sql`true`, // 누구나 좋아요 조회 가능
      }),
      insertPolicy: pgPolicy('image_likes_insert_policy', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql`${table.user_id} = auth.uid()`,
      }),
      deletePolicy: pgPolicy('image_likes_delete_policy', {
        for: 'delete',
        to: authenticatedRole,
        using: sql`${table.user_id} = auth.uid()`,
      }),
    })
  )
  .enableRLS();

/**
 * Image Views Table
 *
 * 이미지 조회수 추적
 */
export const imageViews = imageAppSpaceSchema
  .table(
    'image_views',
    {
      id: uuid('id').primaryKey().defaultRandom(),
      user_id: uuid('user_id').references(() => profiles.id, {
        onDelete: 'set null',
      }), // nullable (비로그인 가능)
      image_asset_id: uuid('image_asset_id')
        .notNull()
        .references(() => imageAssets.id, { onDelete: 'cascade' }),

      session_id: text('session_id'), // 익명 사용자 추적
      viewed_at: timestamp('viewed_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    table => ({
      // Indexes
      imageViewedIdx: index('idx_image_views_image_viewed').on(
        table.image_asset_id,
        table.viewed_at
      ),
      userViewedIdx: index('idx_image_views_user_viewed').on(
        table.user_id,
        table.viewed_at
      ),

      // RLS - 삽입만 허용 (조회수 기록)
      insertPolicy: pgPolicy('image_views_insert_policy', {
        for: 'insert',
        to: [anonRole, authenticatedRole],
        withCheck: sql`true`, // 누구나 조회수 기록 가능
      }),
    })
  )
  .enableRLS();

/**
 * Test Deployments Table
 *
 * 배포 테스트용 테이블
 * - Supabase Branching 테스트
 * - 브랜치별 마이그레이션 적용 확인
 * - 이 테이블은 테스트 후 제거 예정
 */
export const testDeployments = imageAppSpaceSchema
  .table(
    'test_deployments',
    {
      id: uuid('id').primaryKey().defaultRandom(),
      branch_name: text('branch_name').notNull(),
      deployed_at: timestamp('deployed_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
      notes: text('notes'),
    },
    table => ({
      // Index
      branchIdx: index('idx_test_deployments_branch').on(table.branch_name),

      // RLS - 누구나 읽기 가능, 인증된 사용자만 작성
      selectPolicy: pgPolicy('test_deployments_select_policy', {
        for: 'select',
        to: [anonRole, authenticatedRole],
        using: sql`true`,
      }),
      insertPolicy: pgPolicy('test_deployments_insert_policy', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql`true`,
      }),
    })
  )
  .enableRLS();

// ============================================
// Relations
// ============================================

export const imageAssetsRelations = relations(imageAssets, ({ many }) => ({
  usage: many(imageAssetUsage),
  bookmarks: many(imageBookmarks),
  likes: many(imageLikes),
  views: many(imageViews),
}));

export const imageAssetUsageRelations = relations(
  imageAssetUsage,
  ({ one }) => ({
    imageAsset: one(imageAssets, {
      fields: [imageAssetUsage.image_asset_id],
      references: [imageAssets.id],
    }),
  })
);

export const imageBookmarksRelations = relations(imageBookmarks, ({ one }) => ({
  imageAsset: one(imageAssets, {
    fields: [imageBookmarks.image_asset_id],
    references: [imageAssets.id],
  }),
}));

export const imageLikesRelations = relations(imageLikes, ({ one }) => ({
  imageAsset: one(imageAssets, {
    fields: [imageLikes.image_asset_id],
    references: [imageAssets.id],
  }),
}));

export const imageViewsRelations = relations(imageViews, ({ one }) => ({
  imageAsset: one(imageAssets, {
    fields: [imageViews.image_asset_id],
    references: [imageAssets.id],
  }),
}));

// ============================================
// TypeScript Types
// ============================================

export type ImageAsset = typeof imageAssets.$inferSelect;
export type NewImageAsset = typeof imageAssets.$inferInsert;
export type ImageAssetUsage = typeof imageAssetUsage.$inferSelect;
export type NewImageAssetUsage = typeof imageAssetUsage.$inferInsert;
export type UserFollow = typeof userFollows.$inferSelect;
export type NewUserFollow = typeof userFollows.$inferInsert;
export type ImageBookmark = typeof imageBookmarks.$inferSelect;
export type NewImageBookmark = typeof imageBookmarks.$inferInsert;
export type ImageLike = typeof imageLikes.$inferSelect;
export type NewImageLike = typeof imageLikes.$inferInsert;
export type ImageView = typeof imageViews.$inferSelect;
export type NewImageView = typeof imageViews.$inferInsert;
export type TestDeployment = typeof testDeployments.$inferSelect;
export type NewTestDeployment = typeof testDeployments.$inferInsert;

// Enum types
export type ImageAssetType = (typeof imageAssetTypeEnum.enumValues)[number];
export type ImageCategory = (typeof imageCategoryEnum.enumValues)[number];
