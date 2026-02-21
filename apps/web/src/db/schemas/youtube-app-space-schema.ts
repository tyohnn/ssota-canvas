/**
 * YouTube App Space Schema
 *
 * YouTube 블록 앱스페이스를 위한 커스텀 스키마
 *
 * 이 스키마는 YouTube 블록과 관련된 확장 기능들을 포함합니다:
 * - YouTube 영상 메타데이터 관리
 * - 채널 정보 관리
 * (스크립트는 sources.raw_content 사용)
 *
 * 접근: Drizzle(서버)로만 사용. PostgREST에 노출하지 않음 (config.toml schemas에 포함하지 않음).
 */
import { relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
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

// ============================================
// TypeScript Types
// ============================================

export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
