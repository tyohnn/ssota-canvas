-- Phase 1: Add slug to blocks (8-char hex, unique per workspace)
-- 1. Add column (nullable for backfill)
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS slug text;

-- 2. Backfill: first 8 chars of UUID hex (no dashes)
UPDATE blocks
SET slug = left(lower(replace(id::text, '-', '')), 8)
WHERE slug IS NULL;

-- 3. Not null
ALTER TABLE blocks ALTER COLUMN slug SET NOT NULL;

-- 4. Unique (workspace_id, slug)
CREATE UNIQUE INDEX IF NOT EXISTS blocks_workspace_id_slug_key
  ON blocks (workspace_id, slug);
