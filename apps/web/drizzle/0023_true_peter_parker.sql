ALTER TABLE "block_positions" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blocks" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER POLICY "Enable read access for organization owners (owner only)" ON "workspaces" TO authenticated USING ((SELECT current_setting('app.user_id', true)) = owner_id);--> statement-breakpoint
ALTER POLICY "Enable insert for organization owners (owner only)" ON "workspaces" TO authenticated WITH CHECK ((SELECT current_setting('app.user_id', true)) = owner_id);--> statement-breakpoint
ALTER POLICY "Enable update for organization owners (owner only)" ON "workspaces" TO authenticated USING ((SELECT current_setting('app.user_id', true)) = owner_id);--> statement-breakpoint
ALTER POLICY "Enable delete for organization owners (owner only)" ON "workspaces" TO authenticated USING ((SELECT current_setting('app.user_id', true)) = owner_id);