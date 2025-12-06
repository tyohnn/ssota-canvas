-- Migration: Add signed_url fields to image_assets
-- Description: Separate storage path from signed URL for proper URL regeneration
--
-- Problem: image_url was storing both storage path and signed URL,
-- causing errors when regenerating signed URLs from expired signed URLs
--
-- Solution:
-- - image_url: Always stores storage path (e.g., "workspace_id/date/filename.jpg")
-- - signed_url: Stores the generated signed URL
-- - signed_url_expires_at: Stores expiration time for cache invalidation

-- 1. Add new columns
ALTER TABLE image_app_space.image_assets
ADD COLUMN IF NOT EXISTS signed_url TEXT,
ADD COLUMN IF NOT EXISTS signed_url_expires_at TIMESTAMPTZ;

-- 2. Create index for efficient expiration checks
CREATE INDEX IF NOT EXISTS idx_image_assets_signed_url_expires 
ON image_app_space.image_assets (signed_url_expires_at)
WHERE signed_url IS NOT NULL;

-- 3. Migrate existing data: Extract storage path from signed URLs
-- If image_url contains a signed URL (starts with http), extract the storage path
UPDATE image_app_space.image_assets
SET 
  -- Move current URL to signed_url
  signed_url = image_url,
  -- Extract storage path from URL (everything after /image-assets/ and before ?)
  image_url = CASE 
    WHEN image_url LIKE '%/image-assets/%' THEN 
      regexp_replace(
        regexp_replace(image_url, '^.*/image-assets/', ''),
        '\?.*$', ''
      )
    ELSE 
      image_url
  END,
  -- Set expiration to now (will trigger regeneration)
  signed_url_expires_at = NOW()
WHERE image_url LIKE 'http%';

-- 4. Add comment for documentation
COMMENT ON COLUMN image_app_space.image_assets.image_url IS 'Storage path (e.g., workspace_id/date/uuid.jpg). NOT a full URL.';
COMMENT ON COLUMN image_app_space.image_assets.signed_url IS 'Cached signed URL for the image. May be expired.';
COMMENT ON COLUMN image_app_space.image_assets.signed_url_expires_at IS 'Expiration time of the signed_url. NULL means no cached URL.';

