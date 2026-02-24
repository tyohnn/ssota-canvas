/**
 * Public schema – published_pages (share domain).
 */
import { sql } from 'drizzle-orm';
import {
  index,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { publishedPageStatusEnum } from './enums';
import { profiles } from './profiles-schema';
import { pages } from './workspace-schema';

export const publishedPages = pgTable(
  'published_pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    page_id: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    publisher_id: uuid('publisher_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    publish_token: text('publish_token').notNull().unique(),
    status: publishedPageStatusEnum('status')
      .notNull()
      .default('published'),
    published_at: timestamp('published_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    pageIdIdx: index('idx_published_pages_page_id').on(table.page_id),
    publisherIdIdx: index('idx_published_pages_publisher_id').on(table.publisher_id),
    publishTokenIdx: index('idx_published_pages_publish_token').on(
      table.publish_token
    ),
    selectPolicy: pgPolicy('Enable read for publisher only', {
      for: 'select',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = publisher_id`,
    }),
    insertPolicy: pgPolicy('Enable insert for page publisher', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`publisher_id = auth.uid()`,
    }),
    updatePolicy: pgPolicy('Enable update for page publisher', {
      for: 'update',
      to: authenticatedRole,
      using: sql`publisher_id = auth.uid()`,
    }),
    deletePolicy: pgPolicy('Enable delete for page publisher', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`publisher_id = auth.uid()`,
    }),
  })
).enableRLS();
