/**
 * Public schema – organizations, organization_members, invitations, notifications.
 */
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { anonRole, authenticatedRole } from 'drizzle-orm/supabase';

import {
  organizationTypeEnum,
  memberRoleEnum,
  invitationStatusEnum,
  notificationTypeEnum,
} from './enums';
import { profiles } from './profiles-schema';

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    organization_type: organizationTypeEnum('organization_type')
      .notNull()
      .default('n/a'),
    owner_id: uuid('owner_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    is_default: boolean('is_default').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    icon_url: text('icon_url'),
  },
  table => [
    unique('organizations_unique_default_per_owner').on(
      table.owner_id,
      table.is_default
    ),
    pgPolicy('Enable read access for owner', {
      for: 'select',
      to: [anonRole, authenticatedRole],
      using: sql`(select auth.uid()) = owner_id`,
    }),
    pgPolicy('Enable insert for owner', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = owner_id`,
    }),
    pgPolicy('Enable update for owner', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = owner_id`,
      withCheck: sql`(select auth.uid()) = owner_id`,
    }),
    pgPolicy('Enable delete for owner', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = owner_id`,
    }),
  ]
).enableRLS();

export const organizationMembers = pgTable(
  'organization_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').notNull().default('member'),
    joined_at: timestamp('joined_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    unique('organization_members_unique').on(
      table.organization_id,
      table.user_id
    ),
    index('idx_org_members_org_id').on(table.organization_id),
    index('idx_org_members_user_id').on(table.user_id),
    pgPolicy('Enable read access for self', {
      for: 'select',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
    pgPolicy('Enable insert for self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`user_id = (select auth.uid())`,
    }),
    pgPolicy('Enable update for self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
    pgPolicy('Enable delete for self', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
  ]
).enableRLS();

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    inviter_user_id: uuid('inviter_user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    invitee_email: text('invitee_email').notNull(),
    invitee_user_id: uuid('invitee_user_id').references(() => profiles.id, {
      onDelete: 'cascade',
    }),
    role: memberRoleEnum('role').notNull().default('member'),
    status: invitationStatusEnum('status').notNull().default('pending'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    responded_at: timestamp('responded_at', { withTimezone: true }),
    expires_at: timestamp('expires_at', { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  },
  table => [
    unique('invitations_unique_pending_per_email').on(
      table.organization_id,
      table.invitee_email,
      table.status
    ),
    index('idx_invitations_org_status')
      .on(table.organization_id, table.status)
      .where(sql`status = 'pending'`),
    pgPolicy('Enable read for inviter and invitee', {
      for: 'select',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = inviter_user_id OR (select auth.uid()) = invitee_user_id`,
    }),
    pgPolicy('Enable insert for inviter', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = inviter_user_id`,
    }),
    pgPolicy('Enable update for invitee', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = invitee_user_id`,
    }),
  ]
).enableRLS();

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    related_id: uuid('related_id'),
    is_read: boolean('is_read').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    read_at: timestamp('read_at', { withTimezone: true }),
  },
  table => [
    pgPolicy('Enable read for self', {
      for: 'select',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = user_id`,
    }),
    pgPolicy('Enable insert for self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = user_id`,
    }),
    pgPolicy('Enable update for self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = user_id`,
    }),
  ]
).enableRLS();

// organizationsRelations (incl. workspaces) defined in index.ts to avoid circular dependency

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organization_id],
      references: [organizations.id],
    }),
    user: one(profiles, {
      fields: [organizationMembers.user_id],
      references: [profiles.id],
    }),
  })
);

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organization_id],
    references: [organizations.id],
  }),
  inviter: one(profiles, {
    fields: [invitations.inviter_user_id],
    references: [profiles.id],
  }),
  invitee: one(profiles, {
    fields: [invitations.invitee_user_id],
    references: [profiles.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.user_id],
    references: [profiles.id],
  }),
}));
