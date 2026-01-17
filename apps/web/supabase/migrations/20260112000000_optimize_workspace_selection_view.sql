-- Migration: Optimize Workspace Selection View Read Model
-- Purpose: Add indexes to optimize the workspace selection query used in Share domain
-- 
-- Query Pattern:
--   SELECT workspaces.*, organizations.*
--   FROM workspaces
--   LEFT JOIN workspace_members ON workspaces.id = workspace_members.workspace_id
--   LEFT JOIN organizations ON workspaces.organization_id = organizations.id
--   WHERE workspaces.deleted_at IS NULL
--     AND (workspace_members.user_id = $userId OR workspaces.owner_id = $userId)
--   ORDER BY workspaces.is_default DESC, workspaces.created_at ASC

-- Index 1: Optimize owner_id filter (covers non-personal workspaces)
-- Current idx_workspaces_personal_owner only covers is_personal = true
-- This index covers all workspaces where owner_id is used in WHERE clause
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id 
  ON workspaces(owner_id) 
  WHERE deleted_at IS NULL AND owner_id IS NOT NULL;

-- Index 2: Optimize sorting for workspace selection query
-- Covers ORDER BY is_default DESC, created_at ASC with deleted_at filter
CREATE INDEX IF NOT EXISTS idx_workspaces_selection_sort 
  ON workspaces(is_default DESC, created_at ASC) 
  WHERE deleted_at IS NULL;

-- Index 3: Composite index for workspace_members JOIN optimization
-- Covers JOIN condition: workspace_members.workspace_id = workspaces.id
-- Note: workspace_members already has idx_workspace_members_workspace_id
-- This composite index helps with the combined filter (workspace_id + user_id)
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_user 
  ON workspace_members(workspace_id, user_id);

-- Comments
COMMENT ON INDEX idx_workspaces_owner_id IS 
  'Workspace Selection View: Optimize owner_id filter for non-personal workspaces';

COMMENT ON INDEX idx_workspaces_selection_sort IS 
  'Workspace Selection View: Optimize sorting (is_default DESC, created_at ASC)';

COMMENT ON INDEX idx_workspace_members_workspace_user IS 
  'Workspace Selection View: Optimize JOIN with workspace_members for user lookup';
