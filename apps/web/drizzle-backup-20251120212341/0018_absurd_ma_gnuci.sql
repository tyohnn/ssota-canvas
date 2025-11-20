ALTER TABLE "page_favorites" DROP CONSTRAINT "page_favorites_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "pages" DROP CONSTRAINT "pages_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "workspace_members" DROP CONSTRAINT "workspace_members_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "page_favorites" ADD CONSTRAINT "page_favorites_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_created_by_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;