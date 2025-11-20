DROP POLICY "Enable read for owners" ON "cli_auth_codes" CASCADE;--> statement-breakpoint
DROP POLICY "Enable insert for authenticated" ON "cli_auth_codes" CASCADE;--> statement-breakpoint
DROP POLICY "Approve code by assigning current user" ON "cli_auth_codes" CASCADE;