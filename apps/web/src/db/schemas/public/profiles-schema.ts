/**
 * Public schema – profiles table.
 * profilesRelations (includes ownedOrganizations) is defined in index.ts to avoid circular dependency.
 */
import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { anonRole, authenticatedRole } from 'drizzle-orm/supabase';

import { users } from '../../external-schema';
import { userTypeEnum, betaStatusEnum } from './enums';

// Profiles Table
// 🔐 RLS Strategy: Minimal permissions
// - SELECT: Public (all users can read profiles for collaboration)
// - INSERT/UPDATE/DELETE: Self only
//
// ⚠️ Design Decision: profiles.id = users.id (auth.users.id)
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'set null' }),
    email: text('email').notNull().unique(),
    name: text('name'),
    avatar_url: text('avatar_url'),
    language: text('language').notNull().default('en'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    user_type: userTypeEnum('user_type').default('GENERAL').notNull(),
    beta_status: betaStatusEnum('beta_status').default('pending').notNull(),
    beta_application: jsonb('beta_application'),
    beta_applied_at: timestamp('beta_applied_at', { withTimezone: true }),
    beta_approved_at: timestamp('beta_approved_at', { withTimezone: true }),
    beta_approved_by: uuid('beta_approved_by'),
  },
  table => [
    index('idx_profiles_email').on(table.email),
    index('idx_profiles_beta_status')
      .on(table.beta_status)
      .where(sql`deleted_at IS NULL`),
    index('idx_profiles_beta_pending')
      .on(table.beta_status, table.beta_applied_at)
      .where(sql`beta_status = 'pending' AND deleted_at IS NULL`),
    pgPolicy('Enable read access for all users', {
      for: 'select',
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    pgPolicy('Enable insert for self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = id`,
    }),
    pgPolicy('Enable update for self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = id`,
      withCheck: sql`(select auth.uid()) = id`,
    }),
    pgPolicy('Enable delete for self', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = id`,
    }),
  ]
).enableRLS();
