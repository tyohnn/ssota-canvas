-- Migration: Migrate markdown blocks from original to note view mode
-- Description:
-- - Update markdown blocks with view_mode='original' to view_mode='note'
-- - Set view_mode_sizes with default values for all view modes
-- - Preserve existing size_width and size_height in view_mode_sizes.original
--
-- Rationale:
-- - Markdown blocks should use 'note' view mode by default (not 'original')
-- - Markdown blocks only support 'note' and 'card' view modes, not 'original'
-- - Ensures consistent view mode for all markdown blocks

-- 1. Update view_mode from 'original' to 'note' for markdown blocks
UPDATE block_mounts bm
SET view_mode = 'note'
FROM blocks b
WHERE bm.block_id = b.id
  AND b.block_type = 'markdown'
  AND bm.view_mode = 'original'
  AND bm.deleted_at IS NULL
  AND b.deleted_at IS NULL;

-- 2. Update view_mode_sizes for markdown blocks
-- - original: Use existing size_width/size_height or default (342, 456)
-- - card: Default size (300, 200)
-- - note: Default size (400, 300) - always use default for note view
UPDATE block_mounts bm
SET view_mode_sizes = jsonb_build_object(
  'original', jsonb_build_object(
    'width', COALESCE(bm.size_width, 342)::numeric,
    'height', COALESCE(bm.size_height, 456)::numeric
  ),
  'card', jsonb_build_object(
    'width', 300::numeric,
    'height', 200::numeric
  ),
  'note', jsonb_build_object(
    'width', 400::numeric,
    'height', 300::numeric
  )
)
FROM blocks b
WHERE bm.block_id = b.id
  AND b.block_type = 'markdown'
  AND bm.deleted_at IS NULL
  AND b.deleted_at IS NULL
  AND (
    -- Update if view_mode_sizes is NULL or doesn't have all required keys
    bm.view_mode_sizes IS NULL
    OR NOT (bm.view_mode_sizes ? 'original' AND bm.view_mode_sizes ? 'card' AND bm.view_mode_sizes ? 'note')
  );
