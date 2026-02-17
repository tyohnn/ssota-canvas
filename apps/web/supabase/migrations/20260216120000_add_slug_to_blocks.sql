-- Phase 1: Add slug to blocks (8-char hex, unique per workspace)
-- Collision handling: if (workspace_id, 8-char) duplicates exist, use 10-char hex for those rows.
-- 1. Add column (nullable for backfill)
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS slug text;

-- 2. Backfill: 8-char hex, extend to 10-char for collisions within same workspace
WITH hex_val AS (
  SELECT id, workspace_id,
    lower(replace(id::text, '-', '')) AS hex
  FROM blocks
  WHERE slug IS NULL
),
slug_calc AS (
  SELECT id,
    left(hex, 8) AS base_8,
    left(hex, 10) AS base_10,
    count(*) OVER (PARTITION BY workspace_id, left(hex, 8)) AS cnt
  FROM hex_val
)
UPDATE blocks b
SET slug = CASE
  WHEN s.cnt = 1 THEN s.base_8
  ELSE s.base_10
END
FROM slug_calc s
WHERE b.id = s.id AND b.slug IS NULL;

-- 3. Not null
ALTER TABLE blocks ALTER COLUMN slug SET NOT NULL;

-- 4. Unique (workspace_id, slug)
CREATE UNIQUE INDEX IF NOT EXISTS blocks_workspace_id_slug_key
  ON blocks (workspace_id, slug);
