-- Migration: Optimize Workspace By Org View Read Model
-- Purpose: Add indexes to optimize the workspace-by-org query that groups workspaces by organization
-- 
-- Query Pattern (workspace-by-org.view.ts):
--   SELECT 
--     organizations.id, organizations.name,
--     jsonb_agg(
--       jsonb_build_object('id', workspaces.id, 'name', workspaces.name, 'icon', workspaces.icon)
--       ORDER BY workspaces.is_default DESC, workspaces.created_at
--     ) as workspaces
--   FROM workspaces
--   LEFT JOIN workspace_members ON workspaces.id = workspace_members.workspace_id
--   LEFT JOIN organizations ON workspaces.organization_id = organizations.id
--   WHERE workspaces.deleted_at IS NULL
--     AND (workspace_members.user_id = $userId OR workspaces.owner_id = $userId)
--   GROUP BY organizations.id, organizations.name
--   ORDER BY organizations.name

-- Index 1: Optimize GROUP BY + jsonb_agg internal sorting for workspaces
-- Covers GROUP BY organization_id + jsonb_agg internal ORDER BY (is_default DESC, created_at)
-- When PostgreSQL processes GROUP BY organization_id, it can use this index to sort within each group
-- The order is: organization_id (for GROUP BY) → is_default DESC, created_at ASC (for jsonb_agg ORDER BY)
-- Note: First column overlaps with existing idx_workspaces_organization_id, but needed for internal sorting
CREATE INDEX IF NOT EXISTS idx_workspaces_org_group_agg_sort 
  ON workspaces(organization_id, is_default DESC, created_at ASC)
  WHERE deleted_at IS NULL;

-- Index 2: Optimize WHERE filter for workspaces owner_id
-- Covers WHERE workspaces.owner_id = $userId (OR condition)
-- Note: This complements workspace_members.user_id filter
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id 
  ON workspaces(owner_id) 
  WHERE deleted_at IS NULL AND owner_id IS NOT NULL;

-- Comments
COMMENT ON INDEX idx_workspaces_org_group_agg_sort IS 
  'Workspace By Org View: Optimize GROUP BY organization_id + jsonb_agg internal ORDER BY (is_default DESC, created_at ASC)';

COMMENT ON INDEX idx_workspaces_owner_id IS 
  'Workspace By Org View: Optimize WHERE workspaces.owner_id = $userId (OR condition)';
