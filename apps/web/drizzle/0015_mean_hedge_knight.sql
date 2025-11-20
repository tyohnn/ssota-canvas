CREATE TABLE "page_favorites" (
	"page_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"favorited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "page_favorites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"parent_id" uuid,
	"title" text NOT NULL,
	"icon" text,
	"order" integer DEFAULT 0 NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "pages_title_length" CHECK (LENGTH(TRIM("pages"."title")) BETWEEN 1 AND 200),
	CONSTRAINT "pages_depth_non_negative" CHECK ("pages"."depth" >= 0),
	CONSTRAINT "pages_depth_root_consistency" CHECK (("pages"."parent_id" IS NULL AND "pages"."depth" = 0) OR ("pages"."parent_id" IS NOT NULL AND "pages"."depth" > 0)),
	CONSTRAINT "pages_order_non_negative" CHECK ("pages"."order" >= 0)
);
--> statement-breakpoint
ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"deletable" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "workspaces_unique_default_per_org" UNIQUE("organization_id","is_default"),
	CONSTRAINT "workspaces_name_length" CHECK (LENGTH(TRIM("workspaces"."name")) BETWEEN 1 AND 100),
	CONSTRAINT "workspaces_description_length" CHECK ("workspaces"."description" IS NULL OR LENGTH("workspaces"."description") <= 500),
	CONSTRAINT "workspaces_default_not_deletable" CHECK (NOT ("workspaces"."is_default" = true AND "workspaces"."deletable" = true))
);
--> statement-breakpoint
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "page_favorites" ADD CONSTRAINT "page_favorites_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_favorites" ADD CONSTRAINT "page_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_page_favorites_user_id" ON "page_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_pages_workspace_id" ON "pages" USING btree ("workspace_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_pages_parent_id" ON "pages" USING btree ("parent_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_pages_tree_query" ON "pages" USING btree ("workspace_id","depth","order") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_pages_ancestors" ON "pages" USING btree ("id","parent_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_workspace_members_user_id" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_members_workspace_id" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_workspaces_organization_id" ON "workspaces" USING btree ("organization_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_workspaces_default" ON "workspaces" USING btree ("organization_id","is_default") WHERE is_default = true;--> statement-breakpoint
CREATE POLICY "Enable read for self" ON "page_favorites" AS PERMISSIVE FOR SELECT TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable insert for self" ON "page_favorites" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable update for self" ON "page_favorites" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable delete for self" ON "page_favorites" AS PERMISSIVE FOR DELETE TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable read for creator" ON "pages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (created_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable insert for creator" ON "pages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (created_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable update for creator" ON "pages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (created_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable delete for creator" ON "pages" AS PERMISSIVE FOR DELETE TO "authenticated" USING (created_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable read for self" ON "workspace_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable insert for self" ON "workspace_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable update for self" ON "workspace_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable delete for self" ON "workspace_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable read for creator" ON "workspaces" AS PERMISSIVE FOR SELECT TO "authenticated" USING (created_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable insert for creator" ON "workspaces" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (created_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable update for creator" ON "workspaces" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (created_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable delete for creator" ON "workspaces" AS PERMISSIVE FOR DELETE TO "authenticated" USING (created_by = (select auth.uid()));