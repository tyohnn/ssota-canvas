CREATE POLICY "Enable read access for workspace members" ON "block_positions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = block_positions.block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      ));--> statement-breakpoint
CREATE POLICY "Enable insert for workspace members" ON "block_positions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = block_positions.block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      ));--> statement-breakpoint
CREATE POLICY "Enable update for workspace members" ON "block_positions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = block_positions.block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      ));--> statement-breakpoint
CREATE POLICY "Enable delete for workspace members" ON "block_positions" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = block_positions.block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      ));--> statement-breakpoint
CREATE POLICY "Enable read access for workspace members" ON "blocks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = blocks.workspace_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      ));--> statement-breakpoint
CREATE POLICY "Enable insert for workspace members" ON "blocks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = blocks.workspace_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      ));--> statement-breakpoint
CREATE POLICY "Enable update for workspace members" ON "blocks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = blocks.workspace_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      ));--> statement-breakpoint
CREATE POLICY "Enable delete for workspace members" ON "blocks" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = blocks.workspace_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      ));--> statement-breakpoint
CREATE POLICY "Enable read access for workspace members" ON "edges" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = edges.source_block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      ));--> statement-breakpoint
CREATE POLICY "Enable insert for workspace members" ON "edges" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = edges.source_block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      ));--> statement-breakpoint
CREATE POLICY "Enable update for workspace members" ON "edges" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = edges.source_block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      ));--> statement-breakpoint
CREATE POLICY "Enable delete for workspace members" ON "edges" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        WHERE blocks.id = edges.source_block_id 
        AND workspaces.owner_id = current_setting('app.user_id', true)
      ));--> statement-breakpoint
CREATE POLICY "Enable read access for authenticated users" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING (current_setting('app.user_id', true) = id);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "users" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (current_setting('app.user_id', true) = id);--> statement-breakpoint
CREATE POLICY "Enable update for users based on id" ON "users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (current_setting('app.user_id', true) = id);--> statement-breakpoint
CREATE POLICY "Enable delete for users based on id" ON "users" AS PERMISSIVE FOR DELETE TO "authenticated" USING (current_setting('app.user_id', true) = id);--> statement-breakpoint
CREATE POLICY "Enable read access for workspace owners" ON "workspaces" AS PERMISSIVE FOR SELECT TO "authenticated" USING (current_setting('app.user_id', true) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "workspaces" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (current_setting('app.user_id', true) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable update for workspace owners" ON "workspaces" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (current_setting('app.user_id', true) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable delete for workspace owners" ON "workspaces" AS PERMISSIVE FOR DELETE TO "authenticated" USING (current_setting('app.user_id', true) = owner_id);