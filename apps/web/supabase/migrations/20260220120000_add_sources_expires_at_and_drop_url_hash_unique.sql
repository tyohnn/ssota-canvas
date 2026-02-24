-- Source TTL: add expires_at, allow multiple sources per url_hash (snapshot model)
-- 1. Add expires_at column (nullable for existing rows)
-- 2. Drop url_hash unique constraint

ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.sources.expires_at IS 'TTL: when to treat as expired. link=2d, youtube=3mo. NULL=permanent.';

ALTER TABLE public.sources
  DROP CONSTRAINT IF EXISTS sources_url_hash_unique;
