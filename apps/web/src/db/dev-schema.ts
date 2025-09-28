import {
  pgTable,
  text,
  timestamp,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';


// Users table (for Clerk integration)
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey().notNull(), // Clerk user ID
    clerk_id: text('clerk_id').unique().notNull(), // Clerk user ID (중복 필드지만 Story UM-001 요구사항)
    email: text('email').unique().notNull(),
    first_name: text('first_name'),
    last_name: text('last_name'),
    image_url: text('image_url'),
    status: text('status').notNull().default('active'), // 'active', 'soft_deleted', 'permanently_deleted'
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
  },
  table => [
    // Indexes (성능 최적화)
    sql`CREATE INDEX idx_users_clerk_id ON users (clerk_id)`,
    sql`CREATE INDEX idx_users_email ON users (email)`,
    sql`CREATE INDEX idx_users_status ON users (status)`,
    sql`CREATE INDEX idx_users_deleted_at ON users (deleted_at)`,

    // RLS (owner-only, optimized evaluation)
    pgPolicy('Enable read access for authenticated users', {
      for: 'select',
      to: 'authenticated',
      using: sql`(SELECT current_setting('app.user_id', true)) = id`,
    }),
    pgPolicy('Enable insert for authenticated users', {
      for: 'insert',
      to: 'authenticated',
      withCheck: sql`(SELECT current_setting('app.user_id', true)) = id`,
    }),
    pgPolicy('Enable update for users based on id', {
      for: 'update',
      to: 'authenticated',
      using: sql`(SELECT current_setting('app.user_id', true)) = id`,
    }),
    pgPolicy('Enable delete for users based on id', {
      for: 'delete',
      to: 'authenticated',
      using: sql`(SELECT current_setting('app.user_id', true)) = id`,
    }),
  ]
).enableRLS();
