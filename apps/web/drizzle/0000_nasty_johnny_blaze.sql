CREATE TABLE "edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_node_id" uuid NOT NULL,
	"target_node_id" uuid NOT NULL,
	"edge_type" varchar(20) NOT NULL,
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
	"node_type" varchar(20) NOT NULL,
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
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_parent_node_id_nodes_id_fk" FOREIGN KEY ("parent_node_id") REFERENCES "public"."nodes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Enable read access for workspace members" ON "edges" AS PERMISSIVE FOR SELECT TO "authenticated" USING (source_node_id in (select id from nodes where workspace_id in (select id from workspaces where owner_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "Enable insert for workspace owners" ON "edges" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (source_node_id in (select id from nodes where workspace_id in (select id from workspaces where owner_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "Enable update for workspace owners" ON "edges" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (source_node_id in (select id from nodes where workspace_id in (select id from workspaces where owner_id = (select auth.uid())))) WITH CHECK (source_node_id in (select id from nodes where workspace_id in (select id from workspaces where owner_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "Enable delete for workspace owners" ON "edges" AS PERMISSIVE FOR DELETE TO "authenticated" USING (source_node_id in (select id from nodes where workspace_id in (select id from workspaces where owner_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "Enable read access for workspace members" ON "node_positions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (node_id in (select id from nodes where workspace_id in (select id from workspaces where owner_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "Enable insert for workspace owners" ON "node_positions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (node_id in (select id from nodes where workspace_id in (select id from workspaces where owner_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "Enable update for workspace owners" ON "node_positions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (node_id in (select id from nodes where workspace_id in (select id from workspaces where owner_id = (select auth.uid())))) WITH CHECK (node_id in (select id from nodes where workspace_id in (select id from workspaces where owner_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "Enable delete for workspace owners" ON "node_positions" AS PERMISSIVE FOR DELETE TO "authenticated" USING (node_id in (select id from nodes where workspace_id in (select id from workspaces where owner_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "Enable read access for workspace members" ON "nodes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (workspace_id in (select id from workspaces where owner_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "Enable insert for workspace owners" ON "nodes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (workspace_id in (select id from workspaces where owner_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "Enable update for workspace owners" ON "nodes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (workspace_id in (select id from workspaces where owner_id = (select auth.uid()))) WITH CHECK (workspace_id in (select id from workspaces where owner_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "Enable delete for workspace owners" ON "nodes" AS PERMISSIVE FOR DELETE TO "authenticated" USING (workspace_id in (select id from workspaces where owner_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "Enable read access for workspace members" ON "workspaces" AS PERMISSIVE FOR SELECT TO "authenticated" USING (owner_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "workspaces" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (owner_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable update for workspace owners" ON "workspaces" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (owner_id = (select auth.uid())) WITH CHECK (owner_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable delete for workspace owners" ON "workspaces" AS PERMISSIVE FOR DELETE TO "authenticated" USING (owner_id = (select auth.uid()));