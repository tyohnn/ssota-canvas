-- Migration: Add 'group' block type and parent_block_mount_id for Parent-Child
-- Description:
-- - Adds 'group' to block_type enum for Group container nodes
-- - Adds parent_block_mount_id to block_mounts for page-scoped group membership
--   (child position stored as relative to parent)
--
-- Used for: AI Visual Summary zones, node grouping in canvas

-- 1. Add 'group' to block_type enum
ALTER TYPE block_type ADD VALUE 'group';

-- 2. Add parent_block_mount_id to block_mounts (self-reference)
ALTER TABLE block_mounts
  ADD COLUMN parent_block_mount_id UUID REFERENCES block_mounts(id) ON DELETE SET NULL;

-- 3. Index for parent lookup
CREATE INDEX idx_block_mounts_parent ON block_mounts(parent_block_mount_id)
  WHERE deleted_at IS NULL;
