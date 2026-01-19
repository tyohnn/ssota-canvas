/**
 * YouTube App Space Schema
 *
 * YouTube 블록 앱스페이스를 위한 커스텀 스키마
 *
 * 이 스키마는 YouTube 블록과 관련된 확장 기능들을 포함합니다:
 * - YouTube 영상 메타데이터 관리
 * - 스크립트 데이터 저장 및 재사용
 * - 채널 정보 관리
 *
 * Supabase에서 이 스키마를 노출하려면:
 * 1. Settings → API → Exposed schemas에 'youtube_app_space' 추가
 * 2. 마이그레이션에서 권한 설정 (GRANT USAGE 등)
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
 * YouTube App Space Schema
 */
export const youtubeAppSpaceSchema = pgSchema('youtube_app_space');

// ============================================
// Tables
// ============================================

/**
 * Channels Table
 *
 * YouTube 채널 정보 관리
 */
export const channels = youtubeAppSpaceSchema
  .table(
    'channels',
    {
      // Primary Key
      id: uuid('id').primaryKey().defaultRandom(),

      // Channel ID (YouTube Channel ID - unique)
      channel_id: text('channel_id').notNull().unique(),

      // Channel Information
      channel_name: text('channel_name').notNull(),
      channel_description: text('channel_description'),
      channel_thumbnail_url: text('channel_thumbnail_url'), // YouTube CDN

      // Statistics (Cron으로 주기적 업데이트 예정)
      subscriber_count: integer('subscriber_count'),
      video_count: integer('video_count'),

      // Metadata
      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
      updated_at: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    table => ({
      // Indexes
      channelIdIdx: index('idx_channels_channel_id').on(table.channel_id),

      // RLS: 최후의 방어선 (Defense in Depth)
      // 모든 직접 접근 차단 - 서버를 통하지 않은 DB 직접 접근 방지
      // 서버에서 권한 검증 후 admin client (RLS 우회)로만 접근 가능
      blockDirectAccessPolicy: pgPolicy('channels_block_direct_access', {
        for: 'all',
        to: authenticatedRole,
        using: sql`false`,
        withCheck: sql`false`,
      }),
    })
  )
  .enableRLS();

/**
 * Videos Table
 *
 * YouTube 영상 정보 및 스크립트 관리
 * 핵심 테이블: 같은 slug는 한 번만 저장하여 재사용
 */
export const videos = youtubeAppSpaceSchema
  .table(
    'videos',
    {
      // Primary Key (VideoId value object - UUID)
      id: uuid('id').primaryKey().defaultRandom(),

      // Slug (YouTube Video ID - unique, e.g., "dQw4w9WgXcQ")
      slug: text('slug').notNull().unique(),

      // Metadata
      title: text('title').notNull(),
      description: text('description'),
      channel_id: uuid('channel_id').references(() => channels.id, {
        onDelete: 'cascade',
      }),
      published_at: timestamp('published_at', { withTimezone: true }),
      duration_seconds: integer('duration_seconds'),

      // Thumbnail (YouTube CDN URL - Storage 절약)
      thumbnail_url: text('thumbnail_url'),
      thumbnail_high_url: text('thumbnail_high_url'),

      // Script (JSONB - 최대 ~300KB, 대부분 100KB 이하)
      script: jsonb('script'), // { transcript: [...], metadata: {...} }
      script_language: text('script_language'), // 'en', 'ko', etc.
      script_extracted_at: timestamp('script_extracted_at', {
        withTimezone: true,
      }),

      // YouTube Statistics (Cron 업데이트 예정)
      view_count: integer('view_count').default(0),
      like_count: integer('like_count').default(0),
      comment_count: integer('comment_count').default(0),

      // Metadata
      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
      updated_at: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    table => ({
      // Indexes
      slugIdx: index('idx_videos_slug').on(table.slug),
      channelIdIdx: index('idx_videos_channel_id').on(table.channel_id),
      scriptIdx: index('idx_videos_script').using('gin', sql`${table.script}`), // GIN index for JSONB

      // RLS: 최후의 방어선 (Defense in Depth)
      // 모든 직접 접근 차단 - 서버를 통하지 않은 DB 직접 접근 방지
      // 서버에서 권한 검증 후 admin client (RLS 우회)로만 접근 가능
      blockDirectAccessPolicy: pgPolicy('videos_block_direct_access', {
        for: 'all',
        to: authenticatedRole,
        using: sql`false`,
        withCheck: sql`false`,
      }),
    })
  )
  .enableRLS();

// ============================================
// Relations
// ============================================

export const channelsRelations = relations(channels, ({ many }) => ({
  videos: many(videos),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  channel: one(channels, {
    fields: [videos.channel_id],
    references: [channels.id],
  }),
}));

/**
 * Action Transactions Table
 *
 * YouTube 블록의 유료 액션 추적 (Org 기반)
 * - org_id + video_id로 org 단위 권한 관리
 * - 같은 org 내 워크스페이스 간 자동 공유
 * - 크레딧 정책과 일치 (org 단위)
 */
export const actionTransactions = youtubeAppSpaceSchema
  .table(
    'action_transactions',
    {
      // Primary Key
      id: uuid('id').primaryKey().defaultRandom(),

      // Org & Video (Resource)
      org_id: uuid('org_id').notNull(), // Organization ID (org 단위 권한 관리)
      video_id: uuid('video_id')
        .notNull()
        .references(() => videos.id, { onDelete: 'cascade' }),

      // Action Type (모든 유료 액션)
      action_type: text('action_type').notNull(), // 'extract_script', 'smart_summary', ...

      // Timestamps
      created_at: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
      completed_at: timestamp('completed_at', { withTimezone: true }), // null = pending
    },
    table => ({
      // Indexes
      orgVideoIdx: index('idx_action_transactions_org_video').on(
        table.org_id,
        table.video_id,
        table.action_type
      ),
      videoIdIdx: index('idx_action_transactions_video_id').on(table.video_id),
      actionTypeIdx: index('idx_action_transactions_action_type').on(
        table.action_type
      ),

      // RLS: 최후의 방어선 (Defense in Depth)
      // 모든 직접 접근 차단 - 서버를 통하지 않은 DB 직접 접근 방지
      // 서버에서 권한 검증 후 admin client (RLS 우회)로만 접근 가능
      blockDirectAccessPolicy: pgPolicy(
        'action_transactions_block_direct_access',
        {
          for: 'all',
          to: authenticatedRole,
          using: sql`false`,
          withCheck: sql`false`,
        }
      ),
    })
  )
  .enableRLS();

// ============================================
// TypeScript Types
// ============================================

export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export type ActionTransaction = typeof actionTransactions.$inferSelect;
export type NewActionTransaction = typeof actionTransactions.$inferInsert;
