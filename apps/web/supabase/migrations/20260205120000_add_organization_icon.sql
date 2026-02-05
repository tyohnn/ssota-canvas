-- Add organization icon URL (public URL from user-avatars bucket)
ALTER TABLE organizations
ADD COLUMN icon_url text;

COMMENT ON COLUMN organizations.icon_url IS 'Organization logo URL (public URL from user-avatars bucket)';
