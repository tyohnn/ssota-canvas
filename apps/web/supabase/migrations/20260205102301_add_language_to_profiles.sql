-- Add language column to profiles table
-- This column stores the user's preferred language for UI and content

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';

-- Add index for language-based queries (optional, for future filtering)
CREATE INDEX IF NOT EXISTS idx_profiles_language ON profiles(language);

-- Add comment to document the column
COMMENT ON COLUMN profiles.language IS 'User preferred language (ISO 639-1 code, e.g., en, ko, ja)';
