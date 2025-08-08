CREATE TYPE "public"."edge_type" AS ENUM('contains', 'next', 'input', 'output');--> statement-breakpoint
CREATE TYPE "public"."node_type" AS ENUM('agent', 'task', 'workflow', 'artifact_template', 'checklist', 'data', 'artifact_class', 'node_definition', 'edge_definition', 'column_definition');--> statement-breakpoint
CREATE TABLE "edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_node_id" uuid NOT NULL,
	"target_node_id" uuid NOT NULL,
	"edge_type" "edge_type" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "edges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "node_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"x_position" integer NOT NULL,
	"y_position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "node_positions_node_id_unique" UNIQUE("node_id")
);
--> statement-breakpoint
ALTER TABLE "node_positions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_type" "node_type" NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"metadata" jsonb NOT NULL,
	"parent_node_id" uuid,
	"workspace_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nodes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"image_url" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_source_node_id_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_target_node_id_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_positions" ADD CONSTRAINT "node_positions_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "edges" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for workspace members" ON "edges" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("edges"."source_node_id" IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "Enable update for workspace members" ON "edges" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("edges"."source_node_id" IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())))) WITH CHECK ("edges"."source_node_id" IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "Enable delete for workspace members" ON "edges" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("edges"."source_node_id" IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "node_positions" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for workspace members" ON "node_positions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("node_positions"."node_id" IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "Enable update for workspace members" ON "node_positions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("node_positions"."node_id" IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())))) WITH CHECK ("node_positions"."node_id" IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "Enable delete for workspace members" ON "node_positions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("node_positions"."node_id" IN (SELECT id FROM nodes WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "nodes" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for workspace members" ON "nodes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("nodes"."workspace_id" IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "Enable update for workspace members" ON "nodes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("nodes"."workspace_id" IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid()))) WITH CHECK ("nodes"."workspace_id" IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "Enable delete for workspace members" ON "nodes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("nodes"."workspace_id" IN (SELECT id FROM workspaces WHERE owner_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "Enable read access for authenticated users" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "users"."id");--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "users" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "users"."id");--> statement-breakpoint
CREATE POLICY "Enable update for users based on id" ON "users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "users"."id") WITH CHECK ((select auth.uid()) = "users"."id");--> statement-breakpoint
CREATE POLICY "Enable delete for users based on id" ON "users" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "users"."id");--> statement-breakpoint
CREATE POLICY "Enable read access for workspace members" ON "workspaces" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "workspaces" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "workspaces"."owner_id");--> statement-breakpoint
CREATE POLICY "Enable update for workspace owners" ON "workspaces" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "workspaces"."owner_id") WITH CHECK ((select auth.uid()) = "workspaces"."owner_id");--> statement-breakpoint
CREATE POLICY "Enable delete for workspace owners" ON "workspaces" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "workspaces"."owner_id");