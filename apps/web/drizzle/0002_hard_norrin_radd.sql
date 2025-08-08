ALTER TYPE "public"."node_type" RENAME TO "block_type";--> statement-breakpoint
ALTER TABLE "node_positions" RENAME TO "block_positions";--> statement-breakpoint
ALTER TABLE "nodes" RENAME TO "blocks";--> statement-breakpoint
ALTER TABLE "edges" RENAME COLUMN "source_node_id" TO "source_block_id";--> statement-breakpoint
ALTER TABLE "edges" RENAME COLUMN "target_node_id" TO "target_block_id";--> statement-breakpoint
ALTER TABLE "block_positions" RENAME COLUMN "node_id" TO "block_id";--> statement-breakpoint
ALTER TABLE "block_positions" RENAME COLUMN "context_node_id" TO "context_block_id";--> statement-breakpoint
ALTER TABLE "blocks" RENAME COLUMN "node_type" TO "block_type";--> statement-breakpoint
ALTER TABLE "blocks" RENAME COLUMN "parent_node_id" TO "parent_block_id";--> statement-breakpoint
ALTER TABLE "edges" DROP CONSTRAINT "edges_source_node_id_nodes_id_fk";
--> statement-breakpoint
ALTER TABLE "edges" DROP CONSTRAINT "edges_target_node_id_nodes_id_fk";
--> statement-breakpoint
ALTER TABLE "block_positions" DROP CONSTRAINT "node_positions_node_id_nodes_id_fk";
--> statement-breakpoint
ALTER TABLE "block_positions" DROP CONSTRAINT "node_positions_context_node_id_nodes_id_fk";
--> statement-breakpoint
ALTER TABLE "blocks" DROP CONSTRAINT "nodes_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "block_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."block_type";--> statement-breakpoint
CREATE TYPE "public"."block_type" AS ENUM('agent', 'task', 'workflow', 'artifact_template', 'checklist', 'data', 'artifact_class', 'block_definition', 'edge_definition', 'column_definition');--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "block_type" SET DATA TYPE "public"."block_type" USING "block_type"::"public"."block_type";--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_source_block_id_blocks_id_fk" FOREIGN KEY ("source_block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_target_block_id_blocks_id_fk" FOREIGN KEY ("target_block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_positions" ADD CONSTRAINT "block_positions_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_positions" ADD CONSTRAINT "block_positions_context_block_id_blocks_id_fk" FOREIGN KEY ("context_block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER POLICY "Enable insert for workspace members" ON "edges" TO authenticated WITH CHECK ("edges"."source_block_id" IN (SELECT id FROM blocks WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))));--> statement-breakpoint
ALTER POLICY "Enable update for workspace members" ON "edges" TO authenticated USING ("edges"."source_block_id" IN (SELECT id FROM blocks WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())))) WITH CHECK ("edges"."source_block_id" IN (SELECT id FROM blocks WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))));--> statement-breakpoint
ALTER POLICY "Enable delete for workspace members" ON "edges" TO authenticated USING ("edges"."source_block_id" IN (SELECT id FROM blocks WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))));--> statement-breakpoint
ALTER POLICY "Enable insert for workspace members" ON "block_positions" TO authenticated WITH CHECK ("block_positions"."block_id" IN (SELECT id FROM blocks WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))));--> statement-breakpoint
ALTER POLICY "Enable update for workspace members" ON "block_positions" TO authenticated USING ("block_positions"."block_id" IN (SELECT id FROM blocks WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())))) WITH CHECK ("block_positions"."block_id" IN (SELECT id FROM blocks WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))));--> statement-breakpoint
ALTER POLICY "Enable delete for workspace members" ON "block_positions" TO authenticated USING ("block_positions"."block_id" IN (SELECT id FROM blocks WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))));--> statement-breakpoint
ALTER POLICY "Enable insert for workspace members" ON "blocks" TO authenticated WITH CHECK ("blocks"."workspace_id" IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())));--> statement-breakpoint
ALTER POLICY "Enable update for workspace members" ON "blocks" TO authenticated USING ("blocks"."workspace_id" IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))) WITH CHECK ("blocks"."workspace_id" IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())));--> statement-breakpoint
ALTER POLICY "Enable delete for workspace members" ON "blocks" TO authenticated USING ("blocks"."workspace_id" IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())));