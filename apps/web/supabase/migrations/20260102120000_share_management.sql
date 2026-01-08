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

-- Enable Row Level Security
ALTER TABLE published_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for published_pages
-- Public can read all published pages (for /p/[token] access)
CREATE POLICY "Enable read for all users" ON published_pages 
  AS PERMISSIVE FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Only page owner can publish (insert)
CREATE POLICY "Enable insert for page owner" ON published_pages 
  AS PERMISSIVE FOR INSERT 
  TO authenticated 
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- Only page owner can update their published pages
CREATE POLICY "Enable update for page owner" ON published_pages 
  AS PERMISSIVE FOR UPDATE 
  TO authenticated 
  USING (owner_id = (SELECT auth.uid()));

-- Only page owner can delete (unpublish) their published pages
CREATE POLICY "Enable delete for page owner" ON published_pages 
  AS PERMISSIVE FOR DELETE 
  TO authenticated 
  USING (owner_id = (SELECT auth.uid()));
