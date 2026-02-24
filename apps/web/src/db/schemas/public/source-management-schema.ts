/**
 * Source Management Schema
 *
 * URL 기준 추출 캐시(sources), 소스별 요약(source_summaries), 과금 추적(source_action_transactions).
 * blocks.source_id가 이 스키마의 sources를 참조한다.
 *
 * 접근: Drizzle(서버)로만 사용.
 */
import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  index,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

// ============================================
// Enums
// ============================================

export const sourceTypeEnum = pgEnum('source_type', [
  'youtube',
  'pdf',
  'x',
  'thread',
  'audio',
  'link',
]);

export const sourceJobStatusEnum = pgEnum('source_job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

export const sourceJobCurrentStepEnum = pgEnum('source_job_current_step', [
  'extracting',
  'summarizing',
]);

// ============================================
// Tables (public schema)
// ============================================

/**
 * Sources Table
 * URL 기준 추출 캐시. 블록 시스템이 소비하는 raw_content, metadata 보관.
 */
export const sources = pgTable(
  'sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    url: text('url').notNull(),
    url_hash: text('url_hash').notNull(), // Server SSOT: computed in SourceUrl VO (SHA-256 hex of canonical URL)
    source_type: sourceTypeEnum('source_type').notNull(),
    raw_content: text('raw_content'),
    metadata: jsonb('metadata').default({}),
    content_language: text('content_language'),
    extracted_at: timestamp('extracted_at', { withTimezone: true }),
    expires_at: timestamp('expires_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    urlHashIdx: index('idx_sources_url_hash').on(table.url_hash),
    sourceTypeIdx: index('idx_sources_source_type').on(table.source_type),
    blockDirectAccessPolicy: pgPolicy('sources_block_direct_access', {
      for: 'all',
      to: authenticatedRole,
      using: sql`false`,
      withCheck: sql`false`,
    }),
  })
).enableRLS();

/**
 * Source Summaries Table
 * 소스별 다국어 요약. (source_id, language) 당 하나.
 */
export const sourceSummaries = pgTable(
  'source_summaries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    source_id: uuid('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'cascade' }),
    language: text('language').notNull(),
    summary: text('summary').notNull(),
    keywords: text('keywords').array(),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    sourceIdLanguageUnique: unique(
      'source_summaries_source_id_language_unique'
    ).on(table.source_id, table.language),
    blockDirectAccessPolicy: pgPolicy(
      'source_summaries_block_direct_access',
      {
        for: 'all',
        to: authenticatedRole,
        using: sql`false`,
        withCheck: sql`false`,
      }
    ),
  })
).enableRLS();

/**
 * Source Action Transactions Table
 * Org 기반 과금 추적. (org_id, source_id, action_type, language) 당 하나 (NULLS NOT DISTINCT는 마이그레이션 SQL에서 처리).
 */
export const sourceActionTransactions = pgTable(
  'source_action_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull(),
    source_id: uuid('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'cascade' }),
    action_type: text('action_type').notNull(),
    language: text('language'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    completed_at: timestamp('completed_at', { withTimezone: true }),
  },
  table => ({
    orgSourceActionLangUnique: unique(
      'source_action_transactions_org_source_action_lang_unique'
    ).on(table.org_id, table.source_id, table.action_type, table.language),
    blockDirectAccessPolicy: pgPolicy(
      'source_action_transactions_block_direct_access',
      {
        for: 'all',
        to: authenticatedRole,
        using: sql`false`,
        withCheck: sql`false`,
      }
    ),
  })
).enableRLS();

// ============================================
// Source Jobs (queue state / Realtime)
// ============================================

/**
 * Source Jobs Table
 *
 * Source extract+summary pipeline queue state (Realtime).
 * One row per (block_id, language). status + current_step for UI progress.
 */
export const sourceJobs = pgTable(
  'source_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    source_id: uuid('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'cascade' }),
    block_id: uuid('block_id').notNull(),
    org_id: uuid('org_id').notNull(),
    language: text('language').notNull().default('en'),
    pgmq_msg_id: bigint('pgmq_msg_id', { mode: 'number' }),
    status: sourceJobStatusEnum('status').notNull().default('pending'),
    current_step: sourceJobCurrentStepEnum('current_step'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    started_at: timestamp('started_at', { withTimezone: true }),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    error_message: text('error_message'),
  },
  table => ({
    blockIdLanguageUnique: unique(
      'source_jobs_block_id_language_unique'
    ).on(table.block_id, table.language),
    blockIdIdx: index('idx_source_jobs_block_id').on(table.block_id),
    statusIdx: index('idx_source_jobs_status').on(table.status),
    blockDirectAccessPolicy: pgPolicy('source_jobs_block_direct_access', {
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

export const sourcesRelations = relations(sources, ({ many }) => ({
  sourceSummaries: many(sourceSummaries),
  sourceActionTransactions: many(sourceActionTransactions),
  sourceJobs: many(sourceJobs),
}));

export const sourceSummariesRelations = relations(
  sourceSummaries,
  ({ one }) => ({
    source: one(sources, {
      fields: [sourceSummaries.source_id],
      references: [sources.id],
    }),
  })
);

export const sourceActionTransactionsRelations = relations(
  sourceActionTransactions,
  ({ one }) => ({
    source: one(sources, {
      fields: [sourceActionTransactions.source_id],
      references: [sources.id],
    }),
  })
);

export const sourceJobsRelations = relations(sourceJobs, ({ one }) => ({
  source: one(sources, {
    fields: [sourceJobs.source_id],
    references: [sources.id],
  }),
}));
