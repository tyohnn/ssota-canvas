-- Drop videos.script, script_language, script_extracted_at columns
-- Timeline uses sources.raw_content (useSourceContent + parseTimelineRawContent)

-- Drop GIN index first (depends on script column)
DROP INDEX IF EXISTS youtube_app_space.idx_videos_script;

-- Drop script columns
ALTER TABLE youtube_app_space.videos
  DROP COLUMN IF EXISTS script,
  DROP COLUMN IF EXISTS script_language,
  DROP COLUMN IF EXISTS script_extracted_at;
