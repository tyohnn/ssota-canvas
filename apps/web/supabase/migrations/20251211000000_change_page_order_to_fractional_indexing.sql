-- Migration: Change page order from integer to fractional indexing (text)
-- Description: Convert page order from integer to text-based fractional indexing
-- to enable efficient insertion without updating other pages
--
-- Benefits:
-- - No need to update other pages when inserting/moving pages
-- - Always O(1) operation (single INSERT/UPDATE)
-- - Used by Notion, Figma, Linear, etc.
--
-- Migration Strategy:
-- 1. Add temporary text column
-- 2. Convert existing integer orders to fractional indexes (a0, a1, a2, ...)
-- 3. Drop old integer column
-- 4. Rename text column to order
-- 5. Update constraints and indexes

-- 1. Add temporary text column
ALTER TABLE pages ADD COLUMN IF NOT EXISTS order_text TEXT;

-- 2. Convert existing integer order to fractional index
-- Each workspace/parent group gets sequential fractional indexes (a0, a1, a2, ...)
-- Using CTE to work around PostgreSQL limitation with window functions in UPDATE
WITH numbered_pages AS (
  SELECT 
    id,
    'a' || (
      ROW_NUMBER() OVER (
        PARTITION BY workspace_id, COALESCE(parent_id::text, 'root')
        ORDER BY "order", created_at
      ) - 1
    )::text AS new_order_text
  FROM pages
  WHERE deleted_at IS NULL
)
UPDATE pages
SET order_text = numbered_pages.new_order_text
FROM numbered_pages
WHERE pages.id = numbered_pages.id;

-- 3. Set order_text for any remaining NULL values (shouldn't happen, but safety)
UPDATE pages
SET order_text = 'a0'
WHERE order_text IS NULL AND deleted_at IS NULL;

-- 4. Drop old integer order column
ALTER TABLE pages DROP COLUMN IF EXISTS "order";

-- 5. Rename order_text to order
ALTER TABLE pages RENAME COLUMN order_text TO "order";

-- 6. Add NOT NULL constraint
ALTER TABLE pages ALTER COLUMN "order" SET NOT NULL;

-- 7. Drop old integer-specific CHECK constraint
ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_order_non_negative;

-- 8. Add new CHECK constraint for fractional index format
-- Valid format: alphanumeric string, max 100 characters
ALTER TABLE pages ADD CONSTRAINT pages_order_valid_format 
  CHECK ("order" ~ '^[a-zA-Z0-9]+$' AND LENGTH("order") <= 100);

-- 9. Recreate index with text order
DROP INDEX IF EXISTS idx_pages_tree_query;
CREATE INDEX idx_pages_tree_query 
  ON pages(workspace_id, depth, "order") 
  WHERE deleted_at IS NULL;

-- 10. Add comment for documentation
COMMENT ON COLUMN pages."order" IS 'Fractional index for ordering pages (e.g., a0, a1, a0V). Allows infinite insertion between items without updating other pages.';
