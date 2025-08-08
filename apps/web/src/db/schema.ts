import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  integer,
  timestamp,
  pgEnum,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

// Roles for RLS policies
const anonRole = "anon";
const authenticatedRole = "authenticated";

// Enums
export const blockTypeEnum = pgEnum("block_type", [
  "agent",
  "task",
  "workflow",
  "artifact_template",
  "checklist",
  "data",
  "artifact_class",
  "block_definition",
  "edge_definition",
  "column_definition",
]);

export const edgeTypeEnum = pgEnum("edge_type", [
  "contains",
  "next",
  "input",
  "output",
  "accesses",
  "used_by",
]);

// Users table (for Clerk integration)
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 100 }).primaryKey().notNull(), // Clerk user ID
    email: varchar("email", { length: 255 }).notNull(),
    first_name: varchar("first_name", { length: 100 }),
    last_name: varchar("last_name", { length: 100 }),
    image_url: varchar("image_url", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // RLS Policies
    pgPolicy("Enable read access for authenticated users", {
      for: "select",
      to: authenticatedRole,
      using: sql`current_setting('app.user_id', true) = id`,
    }),
    pgPolicy("Enable insert for authenticated users", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`current_setting('app.user_id', true) = id`,
    }),
    pgPolicy("Enable update for users based on id", {
      for: "update",
      to: authenticatedRole,
      using: sql`current_setting('app.user_id', true) = id`,
    }),
    pgPolicy("Enable delete for users based on id", {
      for: "delete",
      to: authenticatedRole,
      using: sql`current_setting('app.user_id', true) = id`,
    }),
  ]
).enableRLS();

// Workspaces table
export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 500 }).default(""),
    owner_id: varchar("owner_id", { length: 100 }).notNull(), // References Clerk user ID
    metadata: jsonb("metadata").default({}),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // RLS Policies
    pgPolicy("Enable read access for workspace owners", {
      for: "select",
      to: authenticatedRole,
      using: sql`current_setting('app.user_id', true) = owner_id`,
    }),
    pgPolicy("Enable insert for authenticated users", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`current_setting('app.user_id', true) = owner_id`,
    }),
    pgPolicy("Enable update for workspace owners", {
      for: "update",
      to: authenticatedRole,
      using: sql`current_setting('app.user_id', true) = owner_id`,
    }),
    pgPolicy("Enable delete for workspace owners", {
      for: "delete",
      to: authenticatedRole,
      using: sql`current_setting('app.user_id', true) = owner_id`,
    }),
  ]
).enableRLS();

// Blocks table - Universal Block System
export const blocks = pgTable(
  "blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    block_type: blockTypeEnum("block_type").notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    metadata: jsonb("metadata").notNull(),
    parent_block_id: uuid("parent_block_id"), // Will be self-referenced after table creation
    workspace_id: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Indexes
    sql`CREATE UNIQUE INDEX idx_blocks_slug_workspace_unique ON blocks (slug, workspace_id) WHERE workspace_id IS NOT NULL`,
    sql`CREATE INDEX idx_blocks_type ON blocks (block_type)`,
    sql`CREATE INDEX idx_blocks_parent ON blocks (parent_block_id)`,
    sql`CREATE INDEX idx_blocks_workspace ON blocks (workspace_id)`,
    sql`CREATE INDEX idx_blocks_agent_type ON blocks (block_type) WHERE block_type = 'agent'`,
    sql`CREATE INDEX idx_blocks_template_type ON blocks (block_type) WHERE block_type = 'artifact_template'`,
    sql`CREATE INDEX idx_blocks_block_definition_type ON blocks (block_type) WHERE block_type = 'block_definition'`,
    sql`CREATE INDEX idx_blocks_edge_definition_type ON blocks (block_type) WHERE block_type = 'edge_definition'`,
    sql`CREATE INDEX idx_blocks_column_definition_type ON blocks (block_type) WHERE block_type = 'column_definition'`,
    sql`CREATE INDEX idx_blocks_artifact_class_type ON blocks (block_type) WHERE block_type = 'artifact_class'`,

    // Constraints
    sql`ALTER TABLE blocks ADD CONSTRAINT chk_blocks_slug_format CHECK (slug ~ '^[a-z0-9가-힣-]+$')`,
    sql`ALTER TABLE blocks ADD CONSTRAINT chk_blocks_name_length CHECK (char_length(name) BETWEEN 1 AND 100)`,
    sql`ALTER TABLE blocks ADD CONSTRAINT fk_blocks_parent_block_id FOREIGN KEY (parent_block_id) REFERENCES blocks(id) ON DELETE SET NULL`,
    sql`ALTER TABLE blocks ADD CONSTRAINT chk_agent_metadata_required CHECK (block_type != 'agent' OR (metadata ? 'persona' AND metadata ? 'role' AND jsonb_array_length(metadata->'persona') > 0 AND jsonb_array_length(metadata->'role') > 0))`,
    sql`ALTER TABLE blocks ADD CONSTRAINT chk_template_metadata_required CHECK (block_type != 'artifact_template' OR (metadata ? 'artifact_format' AND metadata ? 'definitions' AND jsonb_array_length(metadata->'definitions') > 0))`,
    sql`ALTER TABLE blocks ADD CONSTRAINT chk_block_definition_metadata_required CHECK (block_type != 'block_definition' OR (metadata ? 'ai_instruction' AND metadata ? 'design_properties' AND metadata ? 'metadata_schema'))`,
    sql`ALTER TABLE blocks ADD CONSTRAINT chk_edge_definition_metadata_required CHECK (block_type != 'edge_definition' OR (metadata ? 'style_properties' AND metadata ? 'metadata_schema'))`,
    sql`ALTER TABLE blocks ADD CONSTRAINT chk_column_definition_metadata_required CHECK (block_type != 'column_definition' OR (metadata ? 'data_type' AND metadata ? 'validation_rules'))`,
    sql`ALTER TABLE blocks ADD CONSTRAINT chk_artifact_class_metadata_required CHECK (block_type != 'artifact_class' OR (metadata ? 'source_template_id' AND metadata ? 'class_configuration'))`,

    // RLS Policies
    pgPolicy("Enable read access for workspace members", {
      for: "select",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = blocks.workspace_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      )`,
    }),
    pgPolicy("Enable insert for workspace members", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = blocks.workspace_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      )`,
    }),
    pgPolicy("Enable update for workspace members", {
      for: "update",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = blocks.workspace_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      )`,
    }),
    pgPolicy("Enable delete for workspace members", {
      for: "delete",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = blocks.workspace_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      )`,
    }),
  ]
).enableRLS();

// Edges table - Block relationships
export const edges = pgTable(
  "edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source_block_id: uuid("source_block_id")
      .references(() => blocks.id, { onDelete: "cascade" })
      .notNull(),
    target_block_id: uuid("target_block_id")
      .references(() => blocks.id, { onDelete: "cascade" })
      .notNull(),
    edge_type: edgeTypeEnum("edge_type").notNull(),
    metadata: jsonb("metadata"),
    workspace_id: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Indexes
    sql`CREATE INDEX idx_edges_source ON edges (source_block_id)`,
    sql`CREATE INDEX idx_edges_target ON edges (target_block_id)`,
    sql`CREATE INDEX idx_edges_type ON edges (edge_type)`,

    // Constraints
    sql`ALTER TABLE edges ADD CONSTRAINT chk_edges_type_valid CHECK (edge_type IN ('contains', 'next', 'input', 'output', 'accesses', 'used_by'))`,
    sql`ALTER TABLE edges ADD CONSTRAINT chk_edges_no_self_ref CHECK (source_block_id != target_block_id)`,

    // RLS Policies
    pgPolicy("Enable read access for workspace members", {
      for: "select",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = edges.source_block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      )`,
    }),
    pgPolicy("Enable insert for workspace members", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = edges.source_block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      )`,
    }),
    pgPolicy("Enable update for workspace members", {
      for: "update",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = edges.source_block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      )`,
    }),
    pgPolicy("Enable delete for workspace members", {
      for: "delete",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = edges.source_block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      )`,
    }),
  ]
).enableRLS();

// Block positions table - Context-based visual layout persistence
export const blockPositions = pgTable(
  "block_positions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    block_id: uuid("block_id")
      .references(() => blocks.id, { onDelete: "cascade" })
      .notNull(),
    context_block_id: uuid("context_block_id") // Page context (which page the block is rendered in)
      .references(() => blocks.id, { onDelete: "cascade" })
      .notNull(),
    x_position: integer("x_position").notNull(),
    y_position: integer("y_position").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Indexes
    sql`CREATE INDEX idx_block_positions_block ON block_positions (block_id)`,
    sql`CREATE INDEX idx_block_positions_context ON block_positions (context_block_id)`,
    sql`CREATE UNIQUE INDEX idx_block_positions_context_unique ON block_positions (block_id, context_block_id)`,

    // Constraints
    sql`ALTER TABLE block_positions ADD CONSTRAINT chk_block_positions_range CHECK (x_position >= 0 AND y_position >= 0)`,

    // RLS Policies
    pgPolicy("Enable read access for workspace members", {
      for: "select",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = block_positions.block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      )`,
    }),
    pgPolicy("Enable insert for workspace members", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = block_positions.block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      )`,
    }),
    pgPolicy("Enable update for workspace members", {
      for: "update",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = block_positions.block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      )`,
    }),
    pgPolicy("Enable delete for workspace members", {
      for: "delete",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = block_positions.block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      )`,
    }),
  ]
).enableRLS();

// Relations
export const workspacesRelations = relations(workspaces, ({ many }) => ({
  blocks: many(blocks),
  edges: many(edges),
}));

export const blocksRelations = relations(blocks, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [blocks.workspace_id],
    references: [workspaces.id],
  }),
  parent: one(blocks, {
    fields: [blocks.parent_block_id],
    references: [blocks.id],
    relationName: "blockHierarchy",
  }),
  children: many(blocks, {
    relationName: "blockHierarchy",
  }),
  sourceEdges: many(edges, { relationName: "sourceBlock" }),
  targetEdges: many(edges, { relationName: "targetBlock" }),
  positions: many(blockPositions, { relationName: "blockPositions" }),
  contextPositions: many(blockPositions, { relationName: "contextPositions" }),
}));

export const edgesRelations = relations(edges, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [edges.workspace_id],
    references: [workspaces.id],
  }),
  sourceBlock: one(blocks, {
    fields: [edges.source_block_id],
    references: [blocks.id],
    relationName: "sourceBlock",
  }),
  targetBlock: one(blocks, {
    fields: [edges.target_block_id],
    references: [blocks.id],
    relationName: "targetBlock",
  }),
}));

export const blockPositionsRelations = relations(blockPositions, ({ one }) => ({
  block: one(blocks, {
    fields: [blockPositions.block_id],
    references: [blocks.id],
    relationName: "blockPositions",
  }),
  contextBlock: one(blocks, {
    fields: [blockPositions.context_block_id],
    references: [blocks.id],
    relationName: "contextPositions",
  }),
}));

// RLS is now enabled via .enableRLS() on each table

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
export type Edge = typeof edges.$inferSelect;
export type NewEdge = typeof edges.$inferInsert;
export type BlockPosition = typeof blockPositions.$inferSelect;
export type NewBlockPosition = typeof blockPositions.$inferInsert;
