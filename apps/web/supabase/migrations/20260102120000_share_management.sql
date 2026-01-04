-- Share Management Domain
-- Created: 2026-01-02

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS published_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  publish_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  snapshot_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT published_pages_publish_token_unique UNIQUE (publish_token),
  CONSTRAINT published_pages_status_check CHECK (status IN ('published'))
);

CREATE INDEX IF NOT EXISTS idx_published_pages_page_id ON published_pages(page_id);
CREATE INDEX IF NOT EXISTS idx_published_pages_owner_id ON published_pages(owner_id);
CREATE INDEX IF NOT EXISTS idx_published_pages_publish_token ON published_pages(publish_token);

COMMENT ON TABLE published_pages IS 'Share Management - published pages';
COMMENT ON COLUMN published_pages.publish_token IS 'Base64(UUID) token, /p/[token]';
COMMENT ON COLUMN published_pages.status IS '향후 unpublish/expired 확장을 고려한 필드';
COMMENT ON COLUMN published_pages.snapshot_version IS '게시 시점 페이지 스냅샷 식별자 (Page Domain snapshot id 또는 version string)';

CREATE TABLE IF NOT EXISTS copy_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_token TEXT NOT NULL,
  requester_id UUID,
  status TEXT NOT NULL,
  target_workspace_id UUID,
  failure_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT copy_workflows_status_check CHECK (
    status IN ('pending','waiting_login','selecting_workspace','copying','completed','failed')
  ),
  CONSTRAINT copy_workflows_completed_at_check CHECK (
    (status IN ('completed','failed') AND completed_at IS NOT NULL)
    OR
    (status NOT IN ('completed','failed') AND completed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_copy_workflows_publish_token ON copy_workflows(publish_token);
CREATE INDEX IF NOT EXISTS idx_copy_workflows_requester_id ON copy_workflows(requester_id);
CREATE INDEX IF NOT EXISTS idx_copy_workflows_status ON copy_workflows(status);

COMMENT ON TABLE copy_workflows IS 'Share Management - copy workflow states';

ALTER TABLE published_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published_pages_read" ON published_pages
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "published_pages_write" ON published_pages
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "copy_workflows_read" ON copy_workflows
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid());

CREATE POLICY "copy_workflows_write" ON copy_workflows
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "copy_workflows_update" ON copy_workflows
  FOR UPDATE TO authenticated
  USING (requester_id = auth.uid());
