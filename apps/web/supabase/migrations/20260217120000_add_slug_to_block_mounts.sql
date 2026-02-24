-- Phase 2: Add slug to block_mounts (8-char hex, unique per page)
-- Collision handling: if (page_id, 8-char) duplicates exist, use 10-char hex for those rows.
-- 1. Add column (nullable for backfill)
ALTER TABLE block_mounts ADD COLUMN IF NOT EXISTS slug text;

-- 2. Backfill: 8-char hex, extend to 10-char for collisions within same page
WITH hex_val AS (
  SELECT id, page_id,
    lower(replace(id::text, '-', '')) AS hex
  FROM block_mounts
  WHERE slug IS NULL
),
slug_calc AS (
  SELECT id,
    left(hex, 8) AS base_8,
    left(hex, 10) AS base_10,
    count(*) OVER (PARTITION BY page_id, left(hex, 8)) AS cnt
  FROM hex_val
)
UPDATE block_mounts b
SET slug = CASE
  WHEN s.cnt = 1 THEN s.base_8
  ELSE s.base_10
END
FROM slug_calc s
WHERE b.id = s.id AND b.slug IS NULL;

-- 3. Not null
ALTER TABLE block_mounts ALTER COLUMN slug SET NOT NULL;

-- 4. Unique (page_id, slug)
CREATE UNIQUE INDEX IF NOT EXISTS block_mounts_page_id_slug_key
  ON block_mounts (page_id, slug)
  WHERE deleted_at IS NULL;
