/**
 * X App Space Schema
 *
 * X 블록 앱스페이스를 위한 커스텀 스키마
 *
 * 이 스키마는 X 블록과 관련된 확장 기능들을 포함합니다:
 * - X 프로필(트위터 계정) 관리
 * - X 포스트 메타데이터 관리
 * (raw_content는 sources.raw_content 사용)
 *
 * 접근: Drizzle(서버)로만 사용. PostgREST에 노출하지 않음.
 */
import { relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgPolicy,
  pgSchema,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

/**
 * X App Space Schema
 */
export const xAppSpaceSchema = pgSchema('x_app_space');

// ============================================
// Tables
// ============================================

/**
 * Profiles Table (X 트위터 프로필)
 *
 * public.profiles와 구분하기 위해 xProfiles로 export
 */
export const xProfiles = xAppSpaceSchema
  .table(
    'profiles',
    {
      id: uuid('id').primaryKey().defaultRandom(),

      // X User ID (unique)
      user_id: text('user_id').notNull().unique(),

      // Profile information
      username: text('username').notNull(),
      name: text('name'),
      profile_image_url: text('profile_image_url'),
      description: text('description'),

      // Statistics (X API user.public_metrics)
      followers_count: integer('followers_count'),
      following_count: integer('following_count'),
      tweet_count: integer('tweet_count'),

      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
      updated_at: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    table => ({
      userIdIdx: index('idx_profiles_user_id').on(table.user_id),
      blockDirectAccessPolicy: pgPolicy('profiles_block_direct_access', {
        for: 'all',
        to: authenticatedRole,
        using: sql`false`,
        withCheck: sql`false`,
      }),
    })
  )
  .enableRLS();

/**
 * Posts Table
 *
 * X 포스트 메타데이터 관리
 * 같은 post_id는 한 번만 저장하여 재사용
 */
export const posts = xAppSpaceSchema.table(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // X Post ID (unique, e.g. "1460323737035677698")
    post_id: text('post_id').notNull().unique(),

    // Post content
    text: text('text').notNull(),
    article_url: text('article_url'),
    attachment_urls: jsonb('attachment_urls').$type<string[]>().default([]),

    // Author (FK to profiles)
    profile_id: uuid('profile_id').references(() => xProfiles.id, {
      onDelete: 'set null',
    }),

    // Timestamps
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    posted_at: timestamp('posted_at', { withTimezone: true }),

    // Metrics
    like_count: integer('like_count').default(0),
    retweet_count: integer('retweet_count').default(0),
    reply_count: integer('reply_count').default(0),
    quote_count: integer('quote_count').default(0),
  },
  table => ({
    postIdIdx: index('idx_posts_post_id').on(table.post_id),
    profileIdIdx: index('idx_posts_profile_id').on(table.profile_id),
    blockDirectAccessPolicy: pgPolicy('posts_block_direct_access', {
      for: 'all',
      to: authenticatedRole,
      using: sql`false`,
      withCheck: sql`false`,
    }),
  })
).enableRLS();

// ============================================
// Relations
// ============================================

export const xProfilesRelations = relations(xProfiles, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  profile: one(xProfiles, {
    fields: [posts.profile_id],
    references: [xProfiles.id],
  }),
}));

// ============================================
// TypeScript Types
// ============================================

export type XProfile = typeof xProfiles.$inferSelect;
export type NewXProfile = typeof xProfiles.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
