-- Migration: Add view_mode to block_mounts table
-- Description: 
-- - Create block_view_mode enum type (enum name for type distinction)
-- - Add view_mode column to block_mounts table (column name in BlockMount context)
-- - Add index for view_mode queries
--
-- Rationale:
-- - Supports multiple view modes for blocks (note, original, card)
-- - Each block mount can have its own view mode setting
-- - Enum type named block_view_mode to avoid conflicts with future view_mode types
-- - Column named view_mode since it's within BlockMount context (no block prefix needed)

-- 1. Create block_view_mode enum type (idempotent check)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'block_view_mode') THEN
    CREATE TYPE "public"."block_view_mode" AS ENUM('note', 'original', 'card');
  END IF;
END $$;

-- 2. Add view_mode column to block_mounts table (idempotent)
ALTER TABLE block_mounts 
ADD COLUMN IF NOT EXISTS view_mode "public"."block_view_mode" DEFAULT 'original' NOT NULL;

-- 3. Set default value for existing rows (in case column already existed but was NULL)
UPDATE block_mounts
SET view_mode = 'original'
WHERE view_mode IS NULL;

-- 4. Ensure NOT NULL constraint (in case column existed without constraint)
ALTER TABLE block_mounts
ALTER COLUMN view_mode SET NOT NULL;

ALTER TABLE block_mounts
ALTER COLUMN view_mode SET DEFAULT 'original';

-- 5. Add index for view_mode queries (idempotent)
DROP INDEX IF EXISTS idx_block_mounts_view_mode;
CREATE INDEX idx_block_mounts_view_mode 
ON block_mounts(view_mode) 
WHERE deleted_at IS NULL;
