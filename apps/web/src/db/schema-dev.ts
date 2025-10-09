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
export const memberRoleEnum = pgEnum('member_role', [
  'owner',
  'admin',
  'member',
]);
export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'rejected',
  'expired',
]);
export const notificationTypeEnum = pgEnum('notification_type', [
  'invitation',
  'system',
  'announcement',
]);

// Profiles Table
// 🔐 RLS Strategy: Minimal permissions
// - SELECT: Public (all users can read profiles for collaboration)
// - INSERT/UPDATE/DELETE: Self only
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    name: text('name'),
    avatar_url: text('avatar_url'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }), // Soft delete (30-day retention policy)
    user_id: uuid('user_id')
      .references(() => users.id)
      .notNull()
      .unique(),
    user_type: userTypeEnum('user_type').default('GENERAL').notNull(),
  },
  table => [
    // SELECT: Public (for displaying member names, avatars, etc.)
    pgPolicy('Enable read access for all users', {
      for: 'select',
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    // INSERT: Self only
    pgPolicy('Enable insert for self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = user_id`,
    }),
    // UPDATE: Self only
    pgPolicy('Enable update for self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = user_id`,
      withCheck: sql`(select auth.uid()) = user_id`,
    }),
    // DELETE: Self only
    pgPolicy('Enable delete for self', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = user_id`,
    }),
  ]
).enableRLS();

// Organizations Table
// 🔐 RLS Strategy: Minimal permissions
// - SELECT: Public (for displaying organization names, etc.)
// - INSERT: Self as owner
// - UPDATE/DELETE: Owner only
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
      .references(() => profiles.user_id, { onDelete: 'cascade' }),
    is_default: boolean('is_default').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    unique('organizations_unique_default_per_owner').on(
      table.owner_id,
      table.is_default
    ),
    // SELECT: Public (for displaying organization info)
    pgPolicy('Enable read access for owner', {
      for: 'select',
      to: [anonRole, authenticatedRole],
      using: sql`(select auth.uid()) = owner_id`,
    }),
    // INSERT: Self as owner
    pgPolicy('Enable insert for owner', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = owner_id`,
    }),
    // UPDATE: Owner only
    pgPolicy('Enable update for owner', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = owner_id`,
      withCheck: sql`(select auth.uid()) = owner_id`,
    }),
    // DELETE: Owner only
    pgPolicy('Enable delete for owner', {
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

// Organization Members Table
// 🔐 RLS Strategy: Minimal permissions (Simple safety net)
// - SELECT: Self only
// - INSERT/UPDATE/DELETE: Self only
// - Complex permissions (Owner/Admin viewing all members) handled in Application layer with adminDb
export const organizationMembers = pgTable(
  'organization_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.user_id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').notNull().default('member'),
    joined_at: timestamp('joined_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(), // Audit trail
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(), // Audit trail
  },
  table => [
    unique('organization_members_unique').on(
      table.organization_id,
      table.user_id
    ),
    // SELECT: Self only (Application uses adminDb for Owner/Admin to view all members)
    pgPolicy('Enable read access for self', {
      for: 'select',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
    // INSERT: Self only (Service checks Owner/Admin permission before calling)
    pgPolicy('Enable insert for self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`user_id = (select auth.uid())`,
    }),
    // UPDATE: Self only (Service checks Owner permission before calling)
    pgPolicy('Enable update for self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
    // DELETE: Self only (Service checks Owner permission before calling)
    pgPolicy('Enable delete for self', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
  ]
).enableRLS();

// Invitations Table
// 🔐 RLS Strategy: Minimal permissions (Simple safety net)
// - SELECT: Inviter or invitee
// - INSERT: Inviter only (Service checks Owner/Admin permission)
// - UPDATE: Invitee only (for accepting/rejecting)
// - Note: Admin check would cause recursion, so handled in Application layer
export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    inviter_user_id: uuid('inviter_user_id')
      .notNull()
      .references(() => profiles.user_id, { onDelete: 'cascade' }),
    invitee_email: text('invitee_email').notNull(),
    invitee_user_id: uuid('invitee_user_id').references(
      () => profiles.user_id,
      {
        onDelete: 'cascade',
      }
    ),
    role: memberRoleEnum('role').notNull().default('member'),
    status: invitationStatusEnum('status').notNull().default('pending'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    responded_at: timestamp('responded_at', { withTimezone: true }),
    expires_at: timestamp('expires_at', { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
  },
  table => [
    unique('invitations_unique_pending_per_email').on(
      table.organization_id,
      table.invitee_email,
      table.status
    ),
    // SELECT: Inviter or invitee
    pgPolicy('Enable read for inviter and invitee', {
      for: 'select',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = inviter_user_id OR (select auth.uid()) = invitee_user_id`,
    }),
    // INSERT: Inviter only (Service checks if inviter is Owner/Admin before calling)
    pgPolicy('Enable insert for inviter', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = inviter_user_id`,
    }),
    // UPDATE: Invitee only (for accepting/rejecting invitations)
    pgPolicy('Enable update for invitee', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = invitee_user_id`,
    }),
  ]
).enableRLS();

// Notifications Table
// 🔐 RLS Strategy: Minimal permissions (Simple safety net)
// - SELECT: Self only
// - INSERT: Self only
// - UPDATE: Self only (for marking as read)
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.user_id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    related_id: uuid('related_id'), // UUID (for invitation IDs, etc.)
    is_read: boolean('is_read').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    read_at: timestamp('read_at', { withTimezone: true }),
  },
  table => [
    // SELECT: Self only
    pgPolicy('Enable read for self', {
      for: 'select',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = user_id`,
    }),
    // INSERT: Self only
    pgPolicy('Enable insert for self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = user_id`,
    }),
    // UPDATE: Self only (for marking notifications as read)
    pgPolicy('Enable update for self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = user_id`,
    }),
  ]
).enableRLS();

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    owner: one(profiles, {
      fields: [organizations.owner_id],
      references: [profiles.id],
    }),
    members: many(organizationMembers),
    invitations: many(invitations),
  })
);

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organization_id],
      references: [organizations.id],
    }),
    user: one(profiles, {
      fields: [organizationMembers.user_id],
      references: [profiles.user_id],
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
    references: [profiles.user_id],
  }),
  invitee: one(profiles, {
    fields: [invitations.invitee_user_id],
    references: [profiles.user_id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.user_id],
    references: [profiles.user_id],
  }),
}));

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Enum Types
export type OrganizationType = (typeof organizationTypeEnum.enumValues)[number];
export type MemberRole = (typeof memberRoleEnum.enumValues)[number];
export type InvitationStatus = (typeof invitationStatusEnum.enumValues)[number];
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
