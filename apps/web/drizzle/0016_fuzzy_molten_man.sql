CREATE POLICY "Enable read access for workspace members" ON "block_positions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM blocks
        JOIN workspaces ON workspaces.id = blocks.workspace_id
        WHERE blocks.id = block_positions.block_id
          AND workspaces.owner_id = (SELECT current_setting('app.user_id', true))
      ));--> statement-breakpoint
CREATE POLICY "Enable insert for workspace members" ON "block_positions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM blocks
        JOIN workspaces ON workspaces.id = blocks.workspace_id
        WHERE blocks.id = block_positions.block_id
          AND workspaces.owner_id = (SELECT current_setting('app.user_id', true))
      ));--> statement-breakpoint
CREATE POLICY "Enable update for workspace members" ON "block_positions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM blocks
        JOIN workspaces ON workspaces.id = blocks.workspace_id
        WHERE blocks.id = block_positions.block_id
          AND workspaces.owner_id = (SELECT current_setting('app.user_id', true))
      ));--> statement-breakpoint
CREATE POLICY "Enable delete for workspace members" ON "block_positions" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM blocks
        JOIN workspaces ON workspaces.id = blocks.workspace_id
        WHERE blocks.id = block_positions.block_id
          AND workspaces.owner_id = (SELECT current_setting('app.user_id', true))
      ));--> statement-breakpoint
CREATE POLICY "Enable read access for workspace members" ON "blocks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = blocks.workspace_id
          AND workspaces.owner_id = (SELECT current_setting('app.user_id', true))
      ));--> statement-breakpoint
CREATE POLICY "Enable insert for workspace members" ON "blocks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = blocks.workspace_id
          AND workspaces.owner_id = (SELECT current_setting('app.user_id', true))
      ));--> statement-breakpoint
CREATE POLICY "Enable update for workspace members" ON "blocks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = blocks.workspace_id
          AND workspaces.owner_id = (SELECT current_setting('app.user_id', true))
      ));--> statement-breakpoint
CREATE POLICY "Enable delete for workspace members" ON "blocks" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = blocks.workspace_id
          AND workspaces.owner_id = (SELECT current_setting('app.user_id', true))
      ));--> statement-breakpoint
CREATE POLICY "Enable read for owners" ON "cli_auth_codes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (user_id = (SELECT current_setting('app.user_id', true)));--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated" ON "cli_auth_codes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (user_id = (SELECT current_setting('app.user_id', true)));--> statement-breakpoint
CREATE POLICY "Approve code by assigning current user" ON "cli_auth_codes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (user_id IS NULL OR user_id = (SELECT current_setting('app.user_id', true))) WITH CHECK (user_id = (SELECT current_setting('app.user_id', true)));--> statement-breakpoint
CREATE POLICY "Enable read/write for owners" ON "cli_secrets" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = (SELECT current_setting('app.user_id', true))) WITH CHECK (user_id = (SELECT current_setting('app.user_id', true)));--> statement-breakpoint
CREATE POLICY "Enable read access for workspace members" ON "edges" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = edges.workspace_id
          AND workspaces.owner_id = (SELECT current_setting('app.user_id', true))
      ));--> statement-breakpoint
CREATE POLICY "Enable insert for workspace members" ON "edges" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = edges.workspace_id
          AND workspaces.owner_id = (SELECT current_setting('app.user_id', true))
      ));--> statement-breakpoint
CREATE POLICY "Enable update for workspace members" ON "edges" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = edges.workspace_id
          AND workspaces.owner_id = (SELECT current_setting('app.user_id', true))
      ));--> statement-breakpoint
CREATE POLICY "Enable delete for workspace members" ON "edges" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = edges.workspace_id
          AND workspaces.owner_id = (SELECT current_setting('app.user_id', true))
      ));--> statement-breakpoint
CREATE POLICY "Enable read for organization owners" ON "organizations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT current_setting('app.user_id', true)) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "organizations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT current_setting('app.user_id', true)) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable update for organization owners" ON "organizations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT current_setting('app.user_id', true)) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable delete for organization owners" ON "organizations" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT current_setting('app.user_id', true)) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable read access for authenticated users" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT current_setting('app.user_id', true)) = id);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "users" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT current_setting('app.user_id', true)) = id);--> statement-breakpoint
CREATE POLICY "Enable update for users based on id" ON "users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT current_setting('app.user_id', true)) = id);--> statement-breakpoint
CREATE POLICY "Enable delete for users based on id" ON "users" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT current_setting('app.user_id', true)) = id);--> statement-breakpoint
CREATE POLICY "Enable read access for organization owners (owner only)" ON "workspaces" AS PERMISSIVE FOR SELECT TO "authenticated" USING (workspaces.owner_id = (SELECT current_setting('app.user_id', true)));--> statement-breakpoint
CREATE POLICY "Enable insert for organization owners (owner only)" ON "workspaces" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (workspaces.owner_id = (SELECT current_setting('app.user_id', true)));--> statement-breakpoint
CREATE POLICY "Enable update for organization owners (owner only)" ON "workspaces" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (workspaces.owner_id = (SELECT current_setting('app.user_id', true)));--> statement-breakpoint
CREATE POLICY "Enable delete for organization owners (owner only)" ON "workspaces" AS PERMISSIVE FOR DELETE TO "authenticated" USING (workspaces.owner_id = (SELECT current_setting('app.user_id', true)));