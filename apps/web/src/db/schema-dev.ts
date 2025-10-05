import {
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { anonRole, authenticatedRole } from 'drizzle-orm/supabase';
import { users } from './external-schema';

// Enums
export const userTypeEnum = pgEnum('user_type', ['ADMIN', 'GENERAL']);
export const organizationTypeEnum = pgEnum('organization_type', [
  'personal',
  'education',
  'startup',
  'agency',
  'company',
  'n/a',
]);

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    name: text('name'),
    avatar_url: text('avatar_url'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
    user_id: uuid('user_id')
      .references(() => users.id)
      .notNull()
      .unique(),
    user_type: userTypeEnum('user_type').default('GENERAL').notNull(),
  },
  table => [
    pgPolicy('Enable read access for all users', {
      for: 'select',
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    pgPolicy('Enable insert for authenticated users only', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = user_id`,
    }),
    pgPolicy('Enable update for users based on user_id', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = user_id`,
      withCheck: sql`(select auth.uid()) = user_id`,
    }),
    pgPolicy('Enable delete for users based on user_id', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = user_id`,
    }),
  ]
).enableRLS();

export const organizations = pgTable(
  'organizations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(
        () => `org_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`
      ),
    name: text('name').notNull(),
    organization_type: organizationTypeEnum('organization_type')
      .notNull()
      .default('n/a'),
    owner_id: uuid('owner_id')
      .notNull()
      .references(() => profiles.user_id, { onDelete: 'cascade' }),
    is_default: boolean('is_default').notNull().default(false),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  table => [
    unique('organizations_unique_default_per_owner').on(
      table.owner_id,
      table.is_default
    ),
    pgPolicy('Enable read access for all users', {
      for: 'select',
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    pgPolicy('Enable insert for authenticated users only', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = owner_id`,
    }),
    pgPolicy('Enable update for users based on owner_id', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = owner_id`,
      withCheck: sql`(select auth.uid()) = owner_id`,
    }),
    pgPolicy('Enable delete for users based on owner_id', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = owner_id`,
    }),
  ]
).enableRLS();

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.user_id],
    references: [users.id],
  }),
  ownedOrganizations: many(organizations),
}));

export const organizationsRelations = relations(organizations, ({ one }) => ({
  owner: one(profiles, {
    fields: [organizations.owner_id],
    references: [profiles.id],
  }),
}));

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

// Organization Type 추론
export type OrganizationType = (typeof organizationTypeEnum.enumValues)[number];
