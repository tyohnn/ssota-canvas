-- Migration: Add multi-language video summaries support
-- Description:
-- - Create video_summaries table to store language-specific summaries
-- - Add language column to action_transactions for multi-language action tracking
-- - Each video can have multiple summaries in different languages
-- - Unique constraint on (video_id, language) ensures one summary per language per video
--
-- Rationale:
-- - YouTube videos need multi-language summary support (10+ languages)
-- - Separate table allows independent lifecycle management per language
-- - Better scalability than JSONB approach for 10+ languages
-- - extract_summary action needs language-specific transaction tracking

-- ============================================
-- 1. Create video_summaries table
-- ============================================

CREATE TABLE youtube_app_space.video_summaries (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key to videos
  video_id UUID NOT NULL REFERENCES youtube_app_space.videos(id) ON DELETE CASCADE,

  -- Language code (ISO 639-1, 2 characters)
  language TEXT NOT NULL,

  -- Summary content
  summary TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints: 비디오당 언어당 하나의 summary
  UNIQUE(video_id, language)
);

-- Indexes for video_summaries
CREATE INDEX idx_video_summaries_video_id
  ON youtube_app_space.video_summaries(video_id);
CREATE INDEX idx_video_summaries_language
  ON youtube_app_space.video_summaries(language);

-- Full-text search indexes: Hybrid approach
-- 주요 언어(ko, en, es, ja, zh)는 언어별 인덱스로 정확한 stemming 지원
-- 나머지 언어(fr, de, pt, ru, ar)는 simple 인덱스로 처리
-- Note: PostgreSQL 기본 제공 언어만 사용 (korean, japanese는 기본 제공되지 않음)

-- Korean (한국어) - simple 인덱스 (korean config 없음)
CREATE INDEX idx_video_summaries_summary_ko
  ON youtube_app_space.video_summaries
  USING GIN (to_tsvector('simple', summary))
  WHERE language = 'ko';

-- English - 언어별 인덱스
CREATE INDEX idx_video_summaries_summary_en
  ON youtube_app_space.video_summaries
  USING GIN (to_tsvector('english', summary))
  WHERE language = 'en';

-- Spanish (Español) - 언어별 인덱스
CREATE INDEX idx_video_summaries_summary_es
  ON youtube_app_space.video_summaries
  USING GIN (to_tsvector('spanish', summary))
  WHERE language = 'es';

-- Japanese (日本語) - simple 인덱스 (japanese config 없음)
CREATE INDEX idx_video_summaries_summary_ja
  ON youtube_app_space.video_summaries
  USING GIN (to_tsvector('simple', summary))
  WHERE language = 'ja';

-- Chinese (中文) - simple 인덱스 (chinese config 없음)
CREATE INDEX idx_video_summaries_summary_zh
  ON youtube_app_space.video_summaries
  USING GIN (to_tsvector('simple', summary))
  WHERE language = 'zh';

-- 나머지 언어(fr, de, pt, ru, ar) - simple 인덱스
CREATE INDEX idx_video_summaries_summary_other
  ON youtube_app_space.video_summaries
  USING GIN (to_tsvector('simple', summary))
  WHERE language NOT IN ('ko', 'en', 'es', 'ja', 'zh');

-- RLS Policy (Defense in Depth)
ALTER TABLE youtube_app_space.video_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY video_summaries_block_direct_access
  ON youtube_app_space.video_summaries
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Comments for video_summaries
COMMENT ON TABLE youtube_app_space.video_summaries IS 'Multi-language AI-generated summaries for YouTube videos';
COMMENT ON COLUMN youtube_app_space.video_summaries.language IS 'ISO 639-1 language code (e.g., "en", "ko", "ja")';
COMMENT ON COLUMN youtube_app_space.video_summaries.summary IS 'AI-generated summary text in the specified language';

-- ============================================
-- 2. Add language column to action_transactions
-- ============================================

-- Add language column (nullable for backward compatibility)
ALTER TABLE youtube_app_space.action_transactions
  ADD COLUMN language TEXT;

-- Drop existing unique index if exists (only if exists to avoid NOTICE)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'youtube_app_space' AND indexname = 'idx_action_transactions_org_video') THEN
    DROP INDEX youtube_app_space.idx_action_transactions_org_video;
  END IF;
END $$;

-- Create unique index for actions with language (extract_summary)
CREATE UNIQUE INDEX idx_action_transactions_unique_with_language
  ON youtube_app_space.action_transactions(org_id, video_id, action_type, language)
  WHERE language IS NOT NULL;

-- Create unique index for actions without language (extract_script)
CREATE UNIQUE INDEX idx_action_transactions_unique_null_language
  ON youtube_app_space.action_transactions(org_id, video_id, action_type)
  WHERE language IS NULL;

-- Add index for language column
CREATE INDEX idx_action_transactions_language
  ON youtube_app_space.action_transactions(language)
  WHERE language IS NOT NULL;

-- Comments for action_transactions
COMMENT ON COLUMN youtube_app_space.action_transactions.language IS 'Language code for multi-language actions (e.g., "ko" for extract_summary). NULL for actions that do not require language (e.g., extract_script)';
