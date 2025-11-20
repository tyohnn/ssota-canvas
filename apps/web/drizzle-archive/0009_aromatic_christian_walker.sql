CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"owner_id" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP POLICY "Enable read access for workspace owners" ON "workspaces" CASCADE;--> statement-breakpoint
DROP POLICY "Enable insert for authenticated users" ON "workspaces" CASCADE;--> statement-breakpoint
DROP POLICY "Enable update for workspace owners" ON "workspaces" CASCADE;--> statement-breakpoint
DROP POLICY "Enable delete for workspace owners" ON "workspaces" CASCADE;--> statement-breakpoint
CREATE POLICY "Enable read access for organization owners (transitional)" ON "workspaces" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((
        workspaces.owner_id = current_setting('app.user_id', true)
      ) OR (
        workspaces.organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM organizations 
          WHERE organizations.id = workspaces.organization_id 
          AND organizations.owner_id = current_setting('app.user_id', true)
        )
      ));--> statement-breakpoint
CREATE POLICY "Enable insert for organization owners (transitional)" ON "workspaces" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((
        workspaces.owner_id = current_setting('app.user_id', true)
      ) OR (
        workspaces.organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM organizations 
          WHERE organizations.id = workspaces.organization_id 
          AND organizations.owner_id = current_setting('app.user_id', true)
        )
      ));--> statement-breakpoint
CREATE POLICY "Enable update for organization owners (transitional)" ON "workspaces" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((
        workspaces.owner_id = current_setting('app.user_id', true)
      ) OR (
        workspaces.organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM organizations 
          WHERE organizations.id = workspaces.organization_id 
          AND organizations.owner_id = current_setting('app.user_id', true)
        )
      ));--> statement-breakpoint
CREATE POLICY "Enable delete for organization owners (transitional)" ON "workspaces" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((
        workspaces.owner_id = current_setting('app.user_id', true)
      ) OR (
        workspaces.organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM organizations 
          WHERE organizations.id = workspaces.organization_id 
          AND organizations.owner_id = current_setting('app.user_id', true)
        )
      ));--> statement-breakpoint
CREATE POLICY "Enable read for organization owners" ON "organizations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (current_setting('app.user_id', true) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "organizations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (current_setting('app.user_id', true) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable update for organization owners" ON "organizations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (current_setting('app.user_id', true) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable delete for organization owners" ON "organizations" AS PERMISSIVE FOR DELETE TO "authenticated" USING (current_setting('app.user_id', true) = owner_id);--> statement-breakpoint
ALTER POLICY "Enable read access for workspace members" ON "block_positions" TO authenticated USING (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        LEFT JOIN organizations ON organizations.id = workspaces.organization_id
        WHERE blocks.id = block_positions.block_id 
        AND (
          workspaces.owner_id = current_setting('app.user_id', true)
          OR (workspaces.organization_id IS NOT NULL AND organizations.owner_id = current_setting('app.user_id', true))
        )
      ));--> statement-breakpoint
ALTER POLICY "Enable insert for workspace members" ON "block_positions" TO authenticated WITH CHECK (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        LEFT JOIN organizations ON organizations.id = workspaces.organization_id
        WHERE blocks.id = block_positions.block_id 
        AND (
          workspaces.owner_id = current_setting('app.user_id', true)
          OR (workspaces.organization_id IS NOT NULL AND organizations.owner_id = current_setting('app.user_id', true))
        )
      ));--> statement-breakpoint
ALTER POLICY "Enable update for workspace members" ON "block_positions" TO authenticated USING (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        LEFT JOIN organizations ON organizations.id = workspaces.organization_id
        WHERE blocks.id = block_positions.block_id 
        AND (
          workspaces.owner_id = current_setting('app.user_id', true)
          OR (workspaces.organization_id IS NOT NULL AND organizations.owner_id = current_setting('app.user_id', true))
        )
      ));--> statement-breakpoint
ALTER POLICY "Enable delete for workspace members" ON "block_positions" TO authenticated USING (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        JOIN organizations ON organizations.id = workspaces.organization_id
        WHERE blocks.id = block_positions.block_id 
        AND organizations.owner_id = current_setting('app.user_id', true)
      ));--> statement-breakpoint
ALTER POLICY "Enable read access for workspace members" ON "blocks" TO authenticated USING (EXISTS (
        SELECT 1 FROM workspaces 
        LEFT JOIN organizations ON organizations.id = workspaces.organization_id
        WHERE workspaces.id = blocks.workspace_id 
        AND (
          workspaces.owner_id = current_setting('app.user_id', true)
          OR (workspaces.organization_id IS NOT NULL AND organizations.owner_id = current_setting('app.user_id', true))
        )
      ));--> statement-breakpoint
ALTER POLICY "Enable insert for workspace members" ON "blocks" TO authenticated WITH CHECK (EXISTS (
        SELECT 1 FROM workspaces 
        LEFT JOIN organizations ON organizations.id = workspaces.organization_id
        WHERE workspaces.id = blocks.workspace_id 
        AND (
          workspaces.owner_id = current_setting('app.user_id', true)
          OR (workspaces.organization_id IS NOT NULL AND organizations.owner_id = current_setting('app.user_id', true))
        )
      ));--> statement-breakpoint
ALTER POLICY "Enable update for workspace members" ON "blocks" TO authenticated USING (EXISTS (
        SELECT 1 FROM workspaces 
        LEFT JOIN organizations ON organizations.id = workspaces.organization_id
        WHERE workspaces.id = blocks.workspace_id 
        AND (
          workspaces.owner_id = current_setting('app.user_id', true)
          OR (workspaces.organization_id IS NOT NULL AND organizations.owner_id = current_setting('app.user_id', true))
        )
      ));--> statement-breakpoint
ALTER POLICY "Enable delete for workspace members" ON "blocks" TO authenticated USING (EXISTS (
        SELECT 1 FROM workspaces 
        LEFT JOIN organizations ON organizations.id = workspaces.organization_id
        WHERE workspaces.id = blocks.workspace_id 
        AND (
          workspaces.owner_id = current_setting('app.user_id', true)
          OR (workspaces.organization_id IS NOT NULL AND organizations.owner_id = current_setting('app.user_id', true))
        )
      ));--> statement-breakpoint
ALTER POLICY "Enable read access for workspace members" ON "edges" TO authenticated USING (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        LEFT JOIN organizations ON organizations.id = workspaces.organization_id
        WHERE blocks.id = edges.source_block_id 
        AND (
          workspaces.owner_id = current_setting('app.user_id', true)
          OR (workspaces.organization_id IS NOT NULL AND organizations.owner_id = current_setting('app.user_id', true))
        )
      ));--> statement-breakpoint
ALTER POLICY "Enable insert for workspace members" ON "edges" TO authenticated WITH CHECK (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        LEFT JOIN organizations ON organizations.id = workspaces.organization_id
        WHERE blocks.id = edges.source_block_id 
        AND (
          workspaces.owner_id = current_setting('app.user_id', true)
          OR (workspaces.organization_id IS NOT NULL AND organizations.owner_id = current_setting('app.user_id', true))
        )
      ));--> statement-breakpoint
ALTER POLICY "Enable update for workspace members" ON "edges" TO authenticated USING (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        LEFT JOIN organizations ON organizations.id = workspaces.organization_id
        WHERE blocks.id = edges.source_block_id 
        AND (
          workspaces.owner_id = current_setting('app.user_id', true)
          OR (workspaces.organization_id IS NOT NULL AND organizations.owner_id = current_setting('app.user_id', true))
        )
      ));--> statement-breakpoint
ALTER POLICY "Enable delete for workspace members" ON "edges" TO authenticated USING (EXISTS (
        SELECT 1 FROM blocks 
        JOIN workspaces ON blocks.workspace_id = workspaces.id
        JOIN organizations ON organizations.id = workspaces.organization_id
        WHERE blocks.id = edges.source_block_id 
        AND organizations.owner_id = current_setting('app.user_id', true)
      ));