-- Drop policies and tables only if they exist
DO $$ 
BEGIN
    -- Drop policies for cli_auth_codes if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cli_auth_codes') THEN
        DROP POLICY IF EXISTS "Enable read for owners" ON "cli_auth_codes" CASCADE;
        DROP POLICY IF EXISTS "Enable insert for authenticated" ON "cli_auth_codes" CASCADE;
        DROP POLICY IF EXISTS "Approve code by assigning current user" ON "cli_auth_codes" CASCADE;
        DROP TABLE "cli_auth_codes" CASCADE;
    END IF;
    
    -- Drop policies and table for cli_secrets if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cli_secrets') THEN
        DROP POLICY IF EXISTS "Enable read/write for owners" ON "cli_secrets" CASCADE;
        DROP TABLE "cli_secrets" CASCADE;
    END IF;
    
    -- Drop type if it exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cli_auth_code_status') THEN
        DROP TYPE "public"."cli_auth_code_status";
    END IF;
END $$;