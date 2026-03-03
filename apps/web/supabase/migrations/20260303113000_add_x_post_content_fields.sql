-- X App Space: add cached post content fields to reduce X API calls

ALTER TABLE "x_app_space"."posts"
  ADD COLUMN IF NOT EXISTS "article_url" text,
  ADD COLUMN IF NOT EXISTS "attachment_urls" jsonb DEFAULT '[]'::jsonb;

