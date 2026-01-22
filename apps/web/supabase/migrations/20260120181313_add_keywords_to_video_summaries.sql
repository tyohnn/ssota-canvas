-- Migration: Add keywords column to video_summaries table
-- Description:
-- - Add keywords column to store extracted keywords from video summaries
-- - Keywords are stored as TEXT[] (array of strings)
-- - Keywords are extracted during summary generation using AI

-- ============================================
-- Add keywords column to video_summaries
-- ============================================

ALTER TABLE youtube_app_space.video_summaries
  ADD COLUMN keywords TEXT[];

-- Add index for keywords array (GIN index for array operations)
CREATE INDEX idx_video_summaries_keywords
  ON youtube_app_space.video_summaries
  USING GIN (keywords);

-- Comments
COMMENT ON COLUMN youtube_app_space.video_summaries.keywords IS 'AI-extracted keywords from the video summary (array of strings)';
