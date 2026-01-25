-- Migration: Add marker_end and marker_start to edges table
-- Description:
-- - edge_marker enum: 'none' | 'arrow' | 'arrow-open' | 'circle' | 'circle-open' | 'diamond' | 'diamond-open'
--   (aligned with MarkerType in shared/types/marker-type.ts)
-- - marker_end: edge_marker NOT NULL DEFAULT 'arrow' (preserve existing edge appearance; 'none' = no end marker)
-- - marker_start: edge_marker NULL DEFAULT NULL (no marker at source; NULL = none)
--
-- Used for: Edge Toolbar marker selection (None / Arrow / ArrowOpen / Circle / Diamond, each start/end)
--
-- 3. Loose-mode 보정: onConnectStart 도입 전 ConnectionMode.Loose에서 source/target이 반대로 저장된
--    기존 엣지를 복구. path는 source→target으로 그려지므로, swap 후 marker_end='arrow'가 올바른 방향.

-- 1. Create edge_marker enum
CREATE TYPE edge_marker AS ENUM (
  'none',
  'arrow',
  'arrow-open',
  'circle',
  'circle-open',
  'diamond',
  'diamond-open'
);

-- 2. Add columns with defaults (existing rows receive defaults)
ALTER TABLE edges
  ADD COLUMN marker_end edge_marker NOT NULL DEFAULT 'arrow';

ALTER TABLE edges
  ADD COLUMN marker_start edge_marker DEFAULT NULL;

-- 3. Loose-mode bug: 기존 엣지의 source/target·handle 교정 (한 번의 UPDATE로 swap)
UPDATE edges
SET
  source_block_mount_id = target_block_mount_id,
  target_block_mount_id = source_block_mount_id,
  source_handle = target_handle,
  target_handle = source_handle;
