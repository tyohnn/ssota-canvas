-- Migration: Add marker_end and marker_start to edges table
-- Description:
-- - edge_marker enum: 'none' | 'arrow' | 'arrow-open' | 'circle' | 'circle-open' | 'diamond' | 'diamond-open'
--   (aligned with MarkerType in shared/types/marker-type.ts)
-- - marker_end: edge_marker NOT NULL DEFAULT 'arrow' (preserve existing edge appearance; 'none' = no end marker)
-- - marker_start: edge_marker NULL DEFAULT NULL (no marker at source; NULL = none)
--
-- Used for: Edge Toolbar marker selection (None / Arrow / ArrowOpen / Circle / Diamond, each start/end)

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
