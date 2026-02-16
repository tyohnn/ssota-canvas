/**
 * Public schema – blocks, block_mounts, edges, viewports (canvas domain).
 */
import { relations, sql } from 'drizzle-orm';
import {
  check,
  decimal,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { users } from '../../external-schema';
import { sources } from './source-management-schema';
import {
  blockTypeEnum,
  blockViewModeEnum,
  canvasEdgeShapeEnum,
  edgeMarkerEnum,
} from './enums';
import { profiles } from './profiles-schema';
import { pages, workspaces } from './workspace-schema';

export const blocks = pgTable(
  'blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspace_id: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    block_type: blockTypeEnum('block_type').notNull().default('text'),
    title: text('title').notNull().default('새 블럭'),
    metadata: jsonb('metadata').default({}),
    properties: jsonb('properties').default({}),
    content: jsonb('content'),
    content_raw: text('content_raw'),
    content_version: integer('content_version').notNull().default(0),
    custom_properties: jsonb('custom_properties').default([]),
    created_by: uuid('created_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    source_id: uuid('source_id').references(() => sources.id, {
      onDelete: 'set null',
    }),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
  },
  table => ({
    workspaceIdIdx: index('idx_blocks_workspace_id')
      .on(table.workspace_id)
      .where(sql`deleted_at IS NULL`),
    typeIdx: index('idx_blocks_type')
      .on(table.block_type)
      .where(sql`deleted_at IS NULL`),
    createdAtIndex: index('idx_blocks_created_at')
      .on(table.created_at)
      .where(sql`deleted_at IS NULL`),
    idActiveIdx: index('idx_blocks_id_active')
      .on(table.id)
      .where(sql`deleted_at IS NULL`),
    selectPolicy: pgPolicy('Enable read for authenticated users', {
      for: 'select',
      to: authenticatedRole,
      using: sql`true`,
    }),
    insertPolicy: pgPolicy('Enable insert for authenticated users', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`true`,
    }),
    updatePolicy: pgPolicy('Enable update for authenticated users', {
      for: 'update',
      to: authenticatedRole,
      using: sql`true`,
    }),
    deletePolicy: pgPolicy('Enable delete for authenticated users', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`true`,
    }),
  })
).enableRLS();

export const blockMounts = pgTable(
  'block_mounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    page_id: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    block_id: uuid('block_id')
      .notNull()
      .references(() => blocks.id, { onDelete: 'cascade' }),
    parent_block_mount_id: uuid('parent_block_mount_id').references(
      (): any => blockMounts.id,
      { onDelete: 'set null' }
    ),
    position_x: decimal('position_x', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    position_y: decimal('position_y', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    size_width: decimal('size_width', { precision: 8, scale: 2 })
      .notNull()
      .default('100'),
    size_height: decimal('size_height', { precision: 8, scale: 2 })
      .notNull()
      .default('100'),
    z_order: integer('z_order').notNull().default(0),
    view_mode: blockViewModeEnum('view_mode').notNull().default('original'),
    view_mode_sizes: jsonb('view_mode_sizes').default(null),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
  },
  table => ({
    positionXCheck: check(
      'block_mounts_position_x_range',
      sql`${table.position_x} >= -999999 AND ${table.position_x} <= 999999`
    ),
    positionYCheck: check(
      'block_mounts_position_y_range',
      sql`${table.position_y} >= -999999 AND ${table.position_y} <= 999999`
    ),
    sizeWidthCheck: check(
      'block_mounts_size_width_range',
      sql`${table.size_width} >= 1 AND ${table.size_width} <= 10000`
    ),
    sizeHeightCheck: check(
      'block_mounts_size_height_range',
      sql`${table.size_height} >= 1 AND ${table.size_height} <= 10000`
    ),
    zOrderCheck: check(
      'block_mounts_z_order_range',
      sql`${table.z_order} >= 0 AND ${table.z_order} <= 2147483647`
    ),
    uniquePageBlockCheck: unique('block_mounts_unique_page_block').on(
      table.page_id,
      table.block_id
    ),
    pageIdIdx: index('idx_block_mounts_page_id')
      .on(table.page_id)
      .where(sql`deleted_at IS NULL`),
    blockIdIdx: index('idx_block_mounts_block_id')
      .on(table.block_id)
      .where(sql`deleted_at IS NULL`),
    pageZOrderIdx: index('idx_block_mounts_page_z_order')
      .on(table.page_id, table.z_order)
      .where(sql`deleted_at IS NULL`),
    viewModeIdx: index('idx_block_mounts_view_mode')
      .on(table.view_mode)
      .where(sql`deleted_at IS NULL`),
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
      )`,
    }),
    updatePolicy: pgPolicy('Enable update for page creator', {
      for: 'update',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      )`,
    }),
    deletePolicy: pgPolicy('Enable delete for page creator', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      )`,
    }),
  })
).enableRLS();

export const edges = pgTable(
  'edges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    page_id: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    source_block_mount_id: uuid('source_block_mount_id')
      .notNull()
      .references(() => blockMounts.id, { onDelete: 'cascade' }),
    target_block_mount_id: uuid('target_block_mount_id')
      .notNull()
      .references(() => blockMounts.id, { onDelete: 'cascade' }),
    source_handle: text('source_handle').notNull().default('right'),
    target_handle: text('target_handle').notNull().default('left'),
    edge_shape: canvasEdgeShapeEnum('edge_shape').notNull().default('default'),
    edge_label: text('edge_label').default(''),
    edge_style_color: text('edge_style_color').default('#9ca3af'),
    edge_style_thickness: integer('edge_style_thickness').default(2),
    marker_end: edgeMarkerEnum('marker_end').notNull().default('arrow'),
    marker_start: edgeMarkerEnum('marker_start'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
  },
  table => ({
    thicknessCheck: check(
      'edges_thickness_range',
      sql`${table.edge_style_thickness} >= 1 AND ${table.edge_style_thickness} <= 10`
    ),
    pageIdIdx: index('idx_edges_page_id')
      .on(table.page_id)
      .where(sql`deleted_at IS NULL`),
    sourceBlockMountIdIdx: index('idx_edges_source_block_mount_id')
      .on(table.source_block_mount_id)
      .where(sql`deleted_at IS NULL`),
    targetBlockMountIdIdx: index('idx_edges_target_block_mount_id')
      .on(table.target_block_mount_id)
      .where(sql`deleted_at IS NULL`),
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
      )`,
    }),
    updatePolicy: pgPolicy('Enable update for page creator', {
      for: 'update',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      )`,
    }),
    deletePolicy: pgPolicy('Enable delete for page creator', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      )`,
    }),
  })
).enableRLS();

export const viewports = pgTable(
  'viewports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    page_id: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    zoom_level: decimal('zoom_level', { precision: 4, scale: 2 })
      .notNull()
      .default('1.0'),
    center_x: decimal('center_x', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    center_y: decimal('center_y', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    last_saved: timestamp('last_saved', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    zoomLevelCheck: check(
      'viewports_zoom_level_range',
      sql`${table.zoom_level} >= 0.1 AND ${table.zoom_level} <= 5.0`
    ),
    centerXCheck: check(
      'viewports_center_x_range',
      sql`${table.center_x} >= -999999 AND ${table.center_x} <= 999999`
    ),
    centerYCheck: check(
      'viewports_center_y_range',
      sql`${table.center_y} >= -999999 AND ${table.center_y} <= 999999`
    ),
    uniquePageUserCheck: unique('viewports_unique_page_user').on(
      table.page_id,
      table.user_id
    ),
    pageUserIdIdx: index('idx_viewports_page_user').on(
      table.page_id,
      table.user_id
    ),
    userIdIdx: index('idx_viewports_user_id').on(table.user_id),
    selectPolicy: pgPolicy('Enable read for own viewport', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.user_id} = (SELECT auth.uid())`,
    }),
    insertPolicy: pgPolicy('Enable insert for own viewport', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.user_id} = (SELECT auth.uid())`,
    }),
    updatePolicy: pgPolicy('Enable update for own viewport', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.user_id} = (SELECT auth.uid())`,
    }),
    deletePolicy: pgPolicy('Enable delete for own viewport', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.user_id} = (SELECT auth.uid())`,
    }),
  })
).enableRLS();

export const blocksRelations = relations(blocks, ({ one, many }) => ({
  blockMounts: many(blockMounts),
  createdByProfile: one(profiles, {
    fields: [blocks.created_by],
    references: [profiles.id],
  }),
  source: one(sources, {
    fields: [blocks.source_id],
    references: [sources.id],
  }),
}));

export const blockMountsRelations = relations(blockMounts, ({ one, many }) => ({
  page: one(pages, {
    fields: [blockMounts.page_id],
    references: [pages.id],
  }),
  block: one(blocks, {
    fields: [blockMounts.block_id],
    references: [blocks.id],
  }),
  parentBlockMount: one(blockMounts, {
    fields: [blockMounts.parent_block_mount_id],
    references: [blockMounts.id],
    relationName: 'parentBlockMount',
  }),
  childBlockMounts: many(blockMounts, { relationName: 'parentBlockMount' }),
  sourceEdges: many(edges, { relationName: 'sourceBlockMount' }),
  targetEdges: many(edges, { relationName: 'targetBlockMount' }),
}));

export const edgesRelations = relations(edges, ({ one }) => ({
  page: one(pages, {
    fields: [edges.page_id],
    references: [pages.id],
  }),
  sourceBlockMount: one(blockMounts, {
    fields: [edges.source_block_mount_id],
    references: [blockMounts.id],
    relationName: 'sourceBlockMount',
  }),
  targetBlockMount: one(blockMounts, {
    fields: [edges.target_block_mount_id],
    references: [blockMounts.id],
    relationName: 'targetBlockMount',
  }),
}));

export const viewportsRelations = relations(viewports, ({ one }) => ({
  page: one(pages, {
    fields: [viewports.page_id],
    references: [pages.id],
  }),
  user: one(users, {
    fields: [viewports.user_id],
    references: [users.id],
  }),
}));
