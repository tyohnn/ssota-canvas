DROP POLICY "Enable read/write for owners" ON "cli_secrets" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read for organization owners" ON "organizations" CASCADE;--> statement-breakpoint
DROP POLICY "Enable insert for authenticated users" ON "organizations" CASCADE;--> statement-breakpoint
DROP POLICY "Enable update for organization owners" ON "organizations" CASCADE;--> statement-breakpoint
DROP POLICY "Enable delete for organization owners" ON "organizations" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for authenticated users" ON "users" CASCADE;--> statement-breakpoint
DROP POLICY "Enable insert for authenticated users" ON "users" CASCADE;--> statement-breakpoint
DROP POLICY "Enable update for users based on id" ON "users" CASCADE;--> statement-breakpoint
DROP POLICY "Enable delete for users based on id" ON "users" CASCADE;