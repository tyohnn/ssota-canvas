/**
 * Public schema – event_logs (AI management domain).
 */
import { relations, sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { eventTypeEnum, eventActionEnum } from './enums';
import { profiles } from './profiles-schema';
import { pages } from './workspace-schema';

export const eventLogs = pgTable(
  'event_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    page_id: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'set null' }),
    event_type: eventTypeEnum('event_type').notNull(),
    action: eventActionEnum('action'),
    payload: jsonb('payload').notNull().default('{}'),
    search_content: text('search_content'),
    agent_execution_id: text('agent_execution_id'),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    pageTimestampIdx: index('idx_event_logs_page_timestamp')
      .on(table.page_id, table.timestamp)
      .where(sql`${table.page_id} IS NOT NULL`),
    pageTypeIdx: index('idx_event_logs_page_type')
      .on(table.page_id, table.event_type)
      .where(sql`${table.page_id} IS NOT NULL`),
    agentExecutionIdx: index('idx_event_logs_agent_execution')
      .on(table.agent_execution_id)
      .where(sql`${table.agent_execution_id} IS NOT NULL`),
    recentIdx: index('idx_event_logs_recent').on(
      table.page_id,
      table.timestamp
    ),
    typeActionIdx: index('idx_event_logs_type_action')
      .on(table.page_id, table.event_type, table.action)
      .where(sql`${table.action} IS NOT NULL`),
    selectPolicy: pgPolicy('Enable read for page creator', {
      for: 'select',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      )`,
    }),
    insertPolicy: pgPolicy('Enable insert for page creator', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      ) AND ${table.user_id} = (SELECT auth.uid())`,
    }),
  })
).enableRLS();

export const eventLogsRelations = relations(eventLogs, ({ one }) => ({
  page: one(pages, {
    fields: [eventLogs.page_id],
    references: [pages.id],
  }),
  user: one(profiles, {
    fields: [eventLogs.user_id],
    references: [profiles.id],
  }),
}));
