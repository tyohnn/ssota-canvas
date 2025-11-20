CREATE TABLE "image_app_space"."test_deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_name" text NOT NULL,
	"deployed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "image_app_space"."test_deployments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_test_deployments_branch" ON "image_app_space"."test_deployments" USING btree ("branch_name");--> statement-breakpoint
CREATE POLICY "test_deployments_select_policy" ON "image_app_space"."test_deployments" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "test_deployments_insert_policy" ON "image_app_space"."test_deployments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);