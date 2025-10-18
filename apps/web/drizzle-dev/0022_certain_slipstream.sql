ALTER TABLE "workspaces" ADD COLUMN "is_personal" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_profiles_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_workspaces_personal" ON "workspaces" USING btree ("organization_id","is_personal") WHERE is_personal = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_workspaces_personal_owner" ON "workspaces" USING btree ("owner_id") WHERE is_personal = true AND deleted_at IS NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_personal_owner_required" CHECK ("workspaces"."is_personal" = false OR "workspaces"."owner_id" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_default_personal_mutually_exclusive" CHECK (NOT ("workspaces"."is_default" = true AND "workspaces"."is_personal" = true));