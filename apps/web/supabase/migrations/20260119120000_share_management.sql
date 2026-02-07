-- Share Management Domain
-- Created: 2026-01-02
-- Updated: 2026-01-18 (publisher_id, status enum, workspace optimization)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    CREATE EXTENSION pgcrypto;
  END IF;
END $$;

-- ============================================
-- Share Management Domain Enums
-- ============================================
CREATE TYPE published_page_status AS ENUM('published', 'unpublished');

COMMENT ON TYPE published_page_status IS 'Published page status: published or unpublished';

-- ============================================
-- Published Pages Table
-- ============================================
CREATE TABLE IF NOT EXISTS published_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL,
  publisher_id UUID NOT NULL,
  publish_token TEXT NOT NULL,
  status published_page_status NOT NULL DEFAULT 'published',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT published_pages_publish_token_unique UNIQUE (publish_token)
);

CREATE INDEX IF NOT EXISTS idx_published_pages_page_id ON published_pages(page_id);
CREATE INDEX IF NOT EXISTS idx_published_pages_publisher_id ON published_pages(publisher_id);
CREATE INDEX IF NOT EXISTS idx_published_pages_publish_token ON published_pages(publish_token);

COMMENT ON TABLE published_pages IS 'Share Management - published pages';
COMMENT ON COLUMN published_pages.publish_token IS 'Base64(UUID) token, /p/[token]';
COMMENT ON COLUMN published_pages.status IS '게시 상태: published 또는 unpublished (published_page_status ENUM)';
COMMENT ON COLUMN published_pages.publisher_id IS '페이지를 게시한 사용자 ID (게시자)';

-- Enable Row Level Security
ALTER TABLE published_pages ENABLE ROW LEVEL SECURITY;

-- Only publisher can read (SELECT) for management purposes. 
-- Public view (/p/[token]) is handled via Server Actions that bypass RLS or use different credentials.
CREATE POLICY "Enable selective read for publisher" ON published_pages 
  AS PERMISSIVE FOR SELECT 
  TO authenticated 
  USING (publisher_id = auth.uid());

-- Only page publisher can publish (insert)
CREATE POLICY "Enable insert for page publisher" ON published_pages 
  AS PERMISSIVE FOR INSERT 
  TO authenticated 
  WITH CHECK (publisher_id = (SELECT auth.uid()));

-- Only page publisher can update their published pages
CREATE POLICY "Enable update for page publisher" ON published_pages 
  AS PERMISSIVE FOR UPDATE 
  TO authenticated 
  USING (publisher_id = auth.uid());

-- Only page publisher can delete (unpublish) their published pages
CREATE POLICY "Enable delete for page publisher" ON published_pages 
  AS PERMISSIVE FOR DELETE 
  TO authenticated 
  USING (publisher_id = auth.uid());

-- ============================================
-- Workspace Selection View Optimization
-- ============================================
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
