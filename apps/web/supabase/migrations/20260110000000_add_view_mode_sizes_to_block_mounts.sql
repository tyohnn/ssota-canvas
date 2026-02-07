-- Migration: Add view_mode_sizes to block_mounts table
-- Description: 
-- - Add view_mode_sizes JSONB column to store size for each view mode (original, card, note)
-- - Migrate existing size_width and size_height to view_mode_sizes.original
-- - Keep existing columns for backward compatibility
--
-- Rationale:
-- - Supports view-mode-specific sizes for blocks
-- - Allows different sizes for original, card, and note views
-- - Preserves original view size when resizing in card/note views
-- - Backward compatible: falls back to size_width/size_height if view_mode_sizes is NULL

-- 1. Add view_mode_sizes JSONB column (idempotent)
ALTER TABLE block_mounts 
ADD COLUMN IF NOT EXISTS view_mode_sizes JSONB DEFAULT NULL;

-- 2. Migrate existing data: size_width and size_height to view_mode_sizes
-- 모든 블록에 original, card, note 크기를 설정
-- - original: 기존 size_width, size_height 사용
-- - card: 기본값 (300, 200)
-- - note: 기본값 (400, 300)
UPDATE block_mounts bm
SET view_mode_sizes = jsonb_build_object(
  'original', jsonb_build_object(
    'width', bm.size_width::numeric,
    'height', bm.size_height::numeric
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
  AND bm.view_mode_sizes IS NULL 
  AND bm.size_width IS NOT NULL 
  AND bm.size_height IS NOT NULL;

-- 3. Add GIN index for JSONB queries (drop only if exists to avoid NOTICE)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_block_mounts_view_mode_sizes') THEN
    DROP INDEX idx_block_mounts_view_mode_sizes;
  END IF;
END $$;
CREATE INDEX idx_block_mounts_view_mode_sizes 
ON block_mounts USING GIN (view_mode_sizes) 
WHERE deleted_at IS NULL;
