/**
 * AI Management schema – chat_sessions and chat_messages tables.
 * event_logs table has been moved to event-management-schema.ts.
 */
import { relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { profiles } from './profiles-schema';
import { workspaces } from './workspace-schema';

export const chatSessions = pgTable(
  'chat_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspace_id: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull().default('New Chat'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    workspaceUserIdx: index('idx_chat_sessions_workspace_user').on(
      table.workspace_id,
      table.user_id
    ),
    updatedAtIdx: index('idx_chat_sessions_updated_at').on(
      table.workspace_id,
      table.user_id,
      table.updated_at
    ),
    selectPolicy: pgPolicy('chat_sessions_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.user_id} = (SELECT auth.uid())`,
    }),
    insertPolicy: pgPolicy('chat_sessions_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.user_id} = (SELECT auth.uid())`,
    }),
    updatePolicy: pgPolicy('chat_sessions_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.user_id} = (SELECT auth.uid())`,
    }),
    deletePolicy: pgPolicy('chat_sessions_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.user_id} = (SELECT auth.uid())`,
    }),
  })
).enableRLS();

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    session_id: uuid('session_id')
      .notNull()
      .references(() => chatSessions.id, { onDelete: 'cascade' }),
    index: integer('index').notNull(),
    role: text('role').notNull(),
    parts: jsonb('parts').notNull().default([]),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    sessionIndexIdx: index('idx_chat_messages_session_index').on(
      table.session_id,
      table.index
    ),
  })
);

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [chatSessions.workspace_id],
    references: [workspaces.id],
  }),
  user: one(profiles, {
    fields: [chatSessions.user_id],
    references: [profiles.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.session_id],
    references: [chatSessions.id],
  }),
}));
