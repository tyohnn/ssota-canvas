/**
 * Public schema – workspaces, pages, workspace_members, page_favorites, workspace_invitations.
 * pagesRelations (references blockMounts, edges, viewports, eventLogs) is defined in index.ts.
 */
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { invitationStatusEnum } from './enums';
import { organizations } from './organization-schema';
import { profiles } from './profiles-schema';

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon'),
    is_default: boolean('is_default').notNull().default(false),
    is_personal: boolean('is_personal').notNull().default(false),
    owner_id: uuid('owner_id').references(() => profiles.id, {
      onDelete: 'cascade',
    }),
    deletable: boolean('deletable').notNull().default(true),
    created_by: uuid('created_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
  },
  table => ({
    nameLengthCheck: check(
      'workspaces_name_length',
      sql`LENGTH(TRIM(${table.name})) BETWEEN 1 AND 100`
    ),
    descriptionLengthCheck: check(
      'workspaces_description_length',
      sql`${table.description} IS NULL OR LENGTH(${table.description}) <= 500`
    ),
    defaultNotDeletableCheck: check(
      'workspaces_default_not_deletable',
      sql`NOT (${table.is_default} = true AND ${table.deletable} = true)`
    ),
    personalOwnerRequiredCheck: check(
      'workspaces_personal_owner_required',
      sql`${table.is_personal} = false OR ${table.owner_id} IS NOT NULL`
    ),
    defaultPersonalMutuallyExclusiveCheck: check(
      'workspaces_default_personal_mutually_exclusive',
      sql`NOT (${table.is_default} = true AND ${table.is_personal} = true)`
    ),
    orgIdIdx: index('idx_workspaces_organization_id')
      .on(table.organization_id)
      .where(sql`deleted_at IS NULL`),
    personalIdx: index('idx_workspaces_personal')
      .on(table.organization_id, table.is_personal)
      .where(sql`is_personal = true AND deleted_at IS NULL`),
    personalOwnerIdx: index('idx_workspaces_personal_owner')
      .on(table.owner_id)
      .where(sql`is_personal = true AND deleted_at IS NULL`),
    defaultIdx: index('idx_workspaces_default')
      .on(table.organization_id, table.is_default)
      .where(sql`is_default = true`),
    ownerIdIdx: index('idx_workspaces_owner_id')
      .on(table.owner_id)
      .where(sql`deleted_at IS NULL AND owner_id IS NOT NULL`),
    orgGroupAggSortIdx: index('idx_workspaces_org_group_agg_sort')
      .on(table.organization_id, table.is_default, table.created_at)
      .where(sql`deleted_at IS NULL`),
    selectPolicy: pgPolicy('Enable read for creator', {
      for: 'select',
      to: authenticatedRole,
      using: sql`created_by = (select auth.uid())`,
    }),
    insertPolicy: pgPolicy('Enable insert for creator', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`created_by = (select auth.uid())`,
    }),
    updatePolicy: pgPolicy('Enable update for creator', {
      for: 'update',
      to: authenticatedRole,
      using: sql`created_by = (select auth.uid())`,
    }),
    deletePolicy: pgPolicy('Enable delete for creator', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`created_by = (select auth.uid())`,
    }),
  })
).enableRLS();

export const pages = pgTable(
  'pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspace_id: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    parent_id: uuid('parent_id'),
    title: text('title').notNull(),
    icon: text('icon'),
    order: text('order').notNull(),
    depth: integer('depth').notNull().default(0),
    created_by: uuid('created_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
  },
  table => ({
    parentIdFk: sql`ALTER TABLE pages ADD CONSTRAINT pages_parent_id_pages_id_fk FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE CASCADE`,
    titleLengthCheck: check(
      'pages_title_length',
      sql`LENGTH(TRIM(${table.title})) BETWEEN 1 AND 200`
    ),
    depthNonNegativeCheck: check(
      'pages_depth_non_negative',
      sql`${table.depth} >= 0`
    ),
    depthRootConsistencyCheck: check(
      'pages_depth_root_consistency',
      sql`(${table.parent_id} IS NULL AND ${table.depth} = 0) OR (${table.parent_id} IS NOT NULL AND ${table.depth} > 0)`
    ),
    orderValidFormatCheck: check(
      'pages_order_valid_format',
      sql`${table.order} ~ '^[a-zA-Z0-9]+$' AND LENGTH(${table.order}) <= 100`
    ),
    workspaceIdIdx: index('idx_pages_workspace_id')
      .on(table.workspace_id)
      .where(sql`deleted_at IS NULL`),
    parentIdIdx: index('idx_pages_parent_id')
      .on(table.parent_id)
      .where(sql`deleted_at IS NULL`),
    treeQueryIdx: index('idx_pages_tree_query')
      .on(table.workspace_id, table.depth, table.order)
      .where(sql`deleted_at IS NULL`),
    ancestorsIdx: index('idx_pages_ancestors')
      .on(table.id, table.parent_id)
      .where(sql`deleted_at IS NULL`),
    selectPolicy: pgPolicy('Enable read for creator', {
      for: 'select',
      to: authenticatedRole,
      using: sql`created_by = (select auth.uid())`,
    }),
    insertPolicy: pgPolicy('Enable insert for creator', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`created_by = (select auth.uid())`,
    }),
    updatePolicy: pgPolicy('Enable update for creator', {
      for: 'update',
      to: authenticatedRole,
      using: sql`created_by = (select auth.uid())`,
    }),
    deletePolicy: pgPolicy('Enable delete for creator', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`created_by = (select auth.uid())`,
    }),
  })
).enableRLS();

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspace_id: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    joined_at: timestamp('joined_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    pk: sql`ALTER TABLE workspace_members ADD PRIMARY KEY (workspace_id, user_id)`,
    userIdIdx: index('idx_workspace_members_user_id').on(table.user_id),
    workspaceIdIdx: index('idx_workspace_members_workspace_id').on(
      table.workspace_id
    ),
    selectPolicy: pgPolicy('Enable read for self', {
      for: 'select',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
    insertPolicy: pgPolicy('Enable insert for self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`user_id = (select auth.uid())`,
    }),
    updatePolicy: pgPolicy('Enable update for self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
    deletePolicy: pgPolicy('Enable delete for self', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
  })
).enableRLS();

export const pageFavorites = pgTable(
  'page_favorites',
  {
    page_id: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    favorited_at: timestamp('favorited_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    pk: sql`ALTER TABLE page_favorites ADD PRIMARY KEY (page_id, user_id)`,
    userIdIdx: index('idx_page_favorites_user_id').on(table.user_id),
    selectPolicy: pgPolicy('Enable read for self', {
      for: 'select',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
    insertPolicy: pgPolicy('Enable insert for self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`user_id = (select auth.uid())`,
    }),
    updatePolicy: pgPolicy('Enable update for self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
    deletePolicy: pgPolicy('Enable delete for self', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
  })
).enableRLS();

export const workspaceInvitations = pgTable(
  'workspace_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspace_id: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    invited_user_id: uuid('invited_user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    invited_by: uuid('invited_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    status: invitationStatusEnum('status').default('pending').notNull(),
    notification_id: uuid('notification_id'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    processed_at: timestamp('processed_at', { withTimezone: true }),
  },
  table => ({
    userStatusIdx: index('idx_workspace_invitations_user').on(
      table.invited_user_id,
      table.status
    ),
    workspaceStatusIdx: index('idx_workspace_invitations_workspace').on(
      table.workspace_id,
      table.status
    ),
    uniquePendingIdx: index('idx_workspace_invitations_unique_pending')
      .on(table.workspace_id, table.invited_user_id, table.status)
      .where(sql`status = 'pending'`),
    selectPolicy: pgPolicy('Enable read for invited user or inviter', {
      for: 'select',
      to: authenticatedRole,
      using: sql`invited_user_id = (select auth.uid()) OR invited_by = (select auth.uid())`,
    }),
    insertPolicy: pgPolicy('Enable insert for inviter', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`invited_by = (select auth.uid())`,
    }),
    updatePolicy: pgPolicy('Enable update for invited user', {
      for: 'update',
      to: authenticatedRole,
      using: sql`invited_user_id = (select auth.uid())`,
    }),
    deletePolicy: pgPolicy('Enable delete for inviter', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`invited_by = (select auth.uid())`,
    }),
  })
).enableRLS();

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [workspaces.organization_id],
    references: [organizations.id],
  }),
  creator: one(profiles, {
    fields: [workspaces.created_by],
    references: [profiles.id],
  }),
  pages: many(pages),
  members: many(workspaceMembers),
  invitations: many(workspaceInvitations),
}));

// pagesRelations is defined in index.ts (references blockMounts, edges, viewports, eventLogs)

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspace_id],
      references: [workspaces.id],
    }),
    user: one(profiles, {
      fields: [workspaceMembers.user_id],
      references: [profiles.id],
    }),
  })
);

export const pageFavoritesRelations = relations(pageFavorites, ({ one }) => ({
  page: one(pages, {
    fields: [pageFavorites.page_id],
    references: [pages.id],
  }),
  user: one(profiles, {
    fields: [pageFavorites.user_id],
    references: [profiles.id],
  }),
}));

export const workspaceInvitationsRelations = relations(
  workspaceInvitations,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceInvitations.workspace_id],
      references: [workspaces.id],
    }),
    invitedUser: one(profiles, {
      fields: [workspaceInvitations.invited_user_id],
      references: [profiles.id],
      relationName: 'workspaceInvitedUser',
    }),
    inviter: one(profiles, {
      fields: [workspaceInvitations.invited_by],
      references: [profiles.id],
      relationName: 'workspaceInviter',
    }),
  })
);
