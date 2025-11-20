ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "owner_id" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "description" varchar(500) DEFAULT '';--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable read access for all users" ON "block_positions" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable insert for workspace members" ON "block_positions" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable update for workspace members" ON "block_positions" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable delete for workspace members" ON "block_positions" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable read access for all users" ON "blocks" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable insert for workspace members" ON "blocks" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable update for workspace members" ON "blocks" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable delete for workspace members" ON "blocks" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable read access for all users" ON "edges" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable insert for workspace members" ON "edges" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable update for workspace members" ON "edges" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable delete for workspace members" ON "edges" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "users" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "users" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable update for users based on id" ON "users" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable delete for users based on id" ON "users" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable read access for workspace members" ON "workspaces" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "workspaces" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable update for workspace owners" ON "workspaces" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable delete for workspace owners" ON "workspaces" CASCADE;