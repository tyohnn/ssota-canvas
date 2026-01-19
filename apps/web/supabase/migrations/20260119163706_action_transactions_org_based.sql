-- Action Transactions: block_id → org_id Migration
-- Created: 2026-01-19
-- Purpose: Change action_transactions from block-based to org-based for better credit management and workspace sharing

-- ============================================
-- Step 1: Add org_id column (nullable initially)
-- ============================================
ALTER TABLE youtube_app_space.action_transactions 
ADD COLUMN IF NOT EXISTS org_id UUID;

COMMENT ON COLUMN youtube_app_space.action_transactions.org_id IS 'Organization ID - org 단위로 스크립트 추출 권한 관리';

-- ============================================
-- Step 2: Migrate existing data (block_id → org_id)
-- ============================================
-- blocks → workspaces → organizations 경로로 org_id 조회
UPDATE youtube_app_space.action_transactions at
SET org_id = (
  SELECT w.organization_id
  FROM public.blocks b
  JOIN public.workspaces w ON b.workspace_id = w.id
  WHERE b.id = at.block_id
);

-- ============================================
-- Step 3: Validate migration (ensure no NULL org_id)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM youtube_app_space.action_transactions 
    WHERE org_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Migration failed: Found action_transactions with NULL org_id. Some blocks may have been deleted or orphaned.';
  END IF;
END $$;

-- ============================================
-- Step 4: Make org_id NOT NULL
-- ============================================
ALTER TABLE youtube_app_space.action_transactions 
ALTER COLUMN org_id SET NOT NULL;

-- ============================================
-- Step 5: Drop block_id column
-- ============================================
ALTER TABLE youtube_app_space.action_transactions 
DROP COLUMN IF EXISTS block_id;

-- ============================================
-- Step 6: Recreate indexes
-- ============================================
-- Drop old block_id index
DROP INDEX IF EXISTS youtube_app_space.idx_action_transactions_block_id;

-- Create new org + video + action_type composite index
CREATE INDEX IF NOT EXISTS idx_action_transactions_org_video 
ON youtube_app_space.action_transactions(org_id, video_id, action_type);

-- Keep existing indexes
-- idx_action_transactions_video_id (already exists)
-- idx_action_transactions_action_type (already exists)

COMMENT ON INDEX youtube_app_space.idx_action_transactions_org_video IS 'Composite index for org-based action transaction lookups';
