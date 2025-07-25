import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

// Enums
export const nodeTypeEnum = pgEnum("node_type", [
  "agent",
  "task",
  "workflow",
  "artifact_template",
  "checklist",
  "data",
  "artifact_class",
  "node_definition",
  "edge_definition",
  "column_definition",
]);

export const edgeTypeEnum = pgEnum("edge_type", [
  "contains",
  "next",
  "input",
  "output",
]);

// Users table (for Clerk integration)
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().notNull(), // Clerk user ID
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
  (table) => ({
    // RLS Policies
    readPolicy: sql`CREATE POLICY "Enable read access for authenticated users" ON users FOR SELECT TO authenticated USING ((select auth.uid()) = id)`,
    insertPolicy: sql`CREATE POLICY "Enable insert for authenticated users" ON users FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id)`,
    updatePolicy: sql`CREATE POLICY "Enable update for users based on id" ON users FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id)`,
    deletePolicy: sql`CREATE POLICY "Enable delete for users based on id" ON users FOR DELETE TO authenticated USING ((select auth.uid()) = id)`,
  })
);

// Workspaces table
export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    owner_id: uuid("owner_id").notNull(), // References Clerk user ID
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // RLS Policies
    readPolicy: sql`CREATE POLICY "Enable read access for workspace members" ON workspaces FOR SELECT TO authenticated USING (true)`,
    insertPolicy: sql`CREATE POLICY "Enable insert for authenticated users" ON workspaces FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = owner_id)`,
    updatePolicy: sql`CREATE POLICY "Enable update for workspace owners" ON workspaces FOR UPDATE TO authenticated USING ((select auth.uid()) = owner_id) WITH CHECK ((select auth.uid()) = owner_id)`,
    deletePolicy: sql`CREATE POLICY "Enable delete for workspace owners" ON workspaces FOR DELETE TO authenticated USING ((select auth.uid()) = owner_id)`,
  })
);

// Nodes table - Universal Node System
export const nodes = pgTable(
  "nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    node_type: nodeTypeEnum("node_type").notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    metadata: jsonb("metadata").notNull(),
    parent_node_id: uuid("parent_node_id"), // Will be self-referenced after table creation
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
  (table) => ({
    // Indexes
    slugWorkspaceIdx: sql`CREATE UNIQUE INDEX idx_nodes_slug_workspace_unique ON nodes (slug, workspace_id) WHERE workspace_id IS NOT NULL`,
    typeIdx: sql`CREATE INDEX idx_nodes_type ON nodes (node_type)`,
    parentIdx: sql`CREATE INDEX idx_nodes_parent ON nodes (parent_node_id)`,
    workspaceIdx: sql`CREATE INDEX idx_nodes_workspace ON nodes (workspace_id)`,

    // Partial indexes for specific node types
    agentIdx: sql`CREATE INDEX idx_nodes_agent_type ON nodes (node_type) WHERE node_type = 'agent'`,
    templateIdx: sql`CREATE INDEX idx_nodes_template_type ON nodes (node_type) WHERE node_type = 'artifact_template'`,
    nodeDefIdx: sql`CREATE INDEX idx_nodes_node_definition_type ON nodes (node_type) WHERE node_type = 'node_definition'`,
    edgeDefIdx: sql`CREATE INDEX idx_nodes_edge_definition_type ON nodes (node_type) WHERE node_type = 'edge_definition'`,
    columnDefIdx: sql`CREATE INDEX idx_nodes_column_definition_type ON nodes (node_type) WHERE node_type = 'column_definition'`,
    artifactClassIdx: sql`CREATE INDEX idx_nodes_artifact_class_type ON nodes (node_type) WHERE node_type = 'artifact_class'`,

    // Constraints
    slugFormatConstraint: sql`ALTER TABLE nodes ADD CONSTRAINT chk_nodes_slug_format CHECK (slug ~ '^[a-z0-9-]+$')`,
    nameLengthConstraint: sql`ALTER TABLE nodes ADD CONSTRAINT chk_nodes_name_length CHECK (char_length(name) BETWEEN 1 AND 100)`,
    parentNodeConstraint: sql`ALTER TABLE nodes ADD CONSTRAINT fk_nodes_parent_node_id FOREIGN KEY (parent_node_id) REFERENCES nodes(id) ON DELETE SET NULL`,
    agentMetadataConstraint: sql`ALTER TABLE nodes ADD CONSTRAINT chk_agent_metadata_required CHECK (node_type != 'agent' OR (metadata ? 'persona' AND metadata ? 'role' AND jsonb_array_length(metadata->'persona') > 0 AND jsonb_array_length(metadata->'role') > 0))`,
    templateMetadataConstraint: sql`ALTER TABLE nodes ADD CONSTRAINT chk_template_metadata_required CHECK (node_type != 'artifact_template' OR (metadata ? 'artifact_format' AND metadata ? 'definitions' AND jsonb_array_length(metadata->'definitions') > 0))`,
    nodeDefMetadataConstraint: sql`ALTER TABLE nodes ADD CONSTRAINT chk_node_definition_metadata_required CHECK (node_type != 'node_definition' OR (metadata ? 'ai_instruction' AND metadata ? 'design_properties' AND metadata ? 'metadata_schema'))`,
    edgeDefMetadataConstraint: sql`ALTER TABLE nodes ADD CONSTRAINT chk_edge_definition_metadata_required CHECK (node_type != 'edge_definition' OR (metadata ? 'style_properties' AND metadata ? 'metadata_schema'))`,
    columnDefMetadataConstraint: sql`ALTER TABLE nodes ADD CONSTRAINT chk_column_definition_metadata_required CHECK (node_type != 'column_definition' OR (metadata ? 'data_type' AND metadata ? 'validation_rules'))`,
    artifactClassMetadataConstraint: sql`ALTER TABLE nodes ADD CONSTRAINT chk_artifact_class_metadata_required CHECK (node_type != 'artifact_class' OR (metadata ? 'source_template_id' AND metadata ? 'class_configuration'))`,

    // RLS Policies
    readPolicy: sql`CREATE POLICY "Enable read access for all users" ON nodes FOR SELECT TO anon, authenticated USING (true)`,
    insertPolicy: sql`CREATE POLICY "Enable insert for workspace members" ON nodes FOR INSERT TO authenticated WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())))`,
    updatePolicy: sql`CREATE POLICY "Enable update for workspace members" ON nodes FOR UPDATE TO authenticated USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))) WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())))`,
    deletePolicy: sql`CREATE POLICY "Enable delete for workspace members" ON nodes FOR DELETE TO authenticated USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())))`,
  })
);

// Edges table - Node relationships
export const edges = pgTable(
  "edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source_node_id: uuid("source_node_id")
      .references(() => nodes.id, { onDelete: "cascade" })
      .notNull(),
    target_node_id: uuid("target_node_id")
      .references(() => nodes.id, { onDelete: "cascade" })
      .notNull(),
    edge_type: edgeTypeEnum("edge_type").notNull(),
    metadata: jsonb("metadata"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Indexes
    sourceIdx: sql`CREATE INDEX idx_edges_source ON edges (source_node_id)`,
    targetIdx: sql`CREATE INDEX idx_edges_target ON edges (target_node_id)`,
    typeIdx: sql`CREATE INDEX idx_edges_type ON edges (edge_type)`,

    // Constraints
    edgeTypeConstraint: sql`ALTER TABLE edges ADD CONSTRAINT chk_edges_type_valid CHECK (edge_type IN ('contains', 'next', 'input', 'output'))`,
    noSelfRefConstraint: sql`ALTER TABLE edges ADD CONSTRAINT chk_edges_no_self_ref CHECK (source_node_id != target_node_id)`,

    // RLS Policies
    readPolicy: sql`CREATE POLICY "Enable read access for all users" ON edges FOR SELECT TO anon, authenticated USING (true)`,
    insertPolicy: sql`CREATE POLICY "Enable insert for workspace members" ON edges FOR INSERT TO authenticated WITH CHECK (source_node_id IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))))`,
    updatePolicy: sql`CREATE POLICY "Enable update for workspace members" ON edges FOR UPDATE TO authenticated USING (source_node_id IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())))) WITH CHECK (source_node_id IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))))`,
    deletePolicy: sql`CREATE POLICY "Enable delete for workspace members" ON edges FOR DELETE TO authenticated USING (source_node_id IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))))`,
  })
);

// Node positions table - Visual layout persistence
export const nodePositions = pgTable(
  "node_positions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    node_id: uuid("node_id")
      .references(() => nodes.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    x_position: integer("x_position").notNull(),
    y_position: integer("y_position").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Indexes
    nodeIdx: sql`CREATE INDEX idx_node_positions_node ON node_positions (node_id)`,

    // Constraints
    positionRangeConstraint: sql`ALTER TABLE node_positions ADD CONSTRAINT chk_node_positions_range CHECK (x_position >= 0 AND y_position >= 0)`,

    // RLS Policies
    readPolicy: sql`CREATE POLICY "Enable read access for all users" ON node_positions FOR SELECT TO anon, authenticated USING (true)`,
    insertPolicy: sql`CREATE POLICY "Enable insert for workspace members" ON node_positions FOR INSERT TO authenticated WITH CHECK (node_id IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))))`,
    updatePolicy: sql`CREATE POLICY "Enable update for workspace members" ON node_positions FOR UPDATE TO authenticated USING (node_id IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())))) WITH CHECK (node_id IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))))`,
    deletePolicy: sql`CREATE POLICY "Enable delete for workspace members" ON node_positions FOR DELETE TO authenticated USING (node_id IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))))`,
  })
);

// Relations
export const workspacesRelations = relations(workspaces, ({ many }) => ({
  nodes: many(nodes),
}));

export const nodesRelations = relations(nodes, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [nodes.workspace_id],
    references: [workspaces.id],
  }),
  parent: one(nodes, {
    fields: [nodes.parent_node_id],
    references: [nodes.id],
    relationName: "nodeHierarchy",
  }),
  children: many(nodes, {
    relationName: "nodeHierarchy",
  }),
  sourceEdges: many(edges, { relationName: "sourceNode" }),
  targetEdges: many(edges, { relationName: "targetNode" }),
  position: one(nodePositions, {
    fields: [nodes.id],
    references: [nodePositions.node_id],
  }),
}));

export const edgesRelations = relations(edges, ({ one }) => ({
  sourceNode: one(nodes, {
    fields: [edges.source_node_id],
    references: [nodes.id],
    relationName: "sourceNode",
  }),
  targetNode: one(nodes, {
    fields: [edges.target_node_id],
    references: [nodes.id],
    relationName: "targetNode",
  }),
}));

export const nodePositionsRelations = relations(nodePositions, ({ one }) => ({
  node: one(nodes, {
    fields: [nodePositions.node_id],
    references: [nodes.id],
  }),
}));

// Enable RLS on all tables
export const enableRLS = (): ReturnType<typeof sql>[] => {
  return [
    sql`ALTER TABLE users ENABLE ROW LEVEL SECURITY`,
    sql`ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY`,
    sql`ALTER TABLE nodes ENABLE ROW LEVEL SECURITY`,
    sql`ALTER TABLE edges ENABLE ROW LEVEL SECURITY`,
    sql`ALTER TABLE node_positions ENABLE ROW LEVEL SECURITY`,
  ];
};

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;
export type Edge = typeof edges.$inferSelect;
export type NewEdge = typeof edges.$inferInsert;
export type NodePosition = typeof nodePositions.$inferSelect;
export type NewNodePosition = typeof nodePositions.$inferInsert;
