ALTER TABLE "block_positions" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blocks" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER POLICY "Enable read access for workspace members" ON "block_positions" TO authenticated USING (EXISTS (
        SELECT 1 FROM blocks
        JOIN workspaces ON workspaces.id = blocks.workspace_id
        WHERE blocks.id = block_positions.block_id
          AND workspaces.owner_id = (SELECT current_setting('app.user_id', true))
          AND blocks.deleted_at IS NULL
      ) AND block_positions.deleted_at IS NULL);--> statement-breakpoint
ALTER POLICY "Enable read access for workspace members" ON "blocks" TO authenticated USING (EXISTS (
        SELECT 1 FROM workspaces
        WHERE workspaces.id = blocks.workspace_id
          AND workspaces.owner_id = (SELECT current_setting('app.user_id', true)));