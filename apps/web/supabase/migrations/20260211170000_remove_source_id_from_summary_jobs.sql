-- Revert source_id from summary_jobs (source path now uses public.source_jobs)
-- Idempotent: only runs when source_id column exists (e.g. 20260211150000 was applied)
-- 1. Delete any summary_jobs rows that have source_id (they are now in source_jobs)
-- 2. Drop source_id column
-- 3. Restore youtube_id NOT NULL

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'youtube_app_space'
      AND table_name = 'summary_jobs'
      AND column_name = 'source_id'
  ) THEN
    DELETE FROM youtube_app_space.summary_jobs WHERE source_id IS NOT NULL;
    ALTER TABLE youtube_app_space.summary_jobs DROP COLUMN source_id;
  END IF;
END $$;

-- Restore youtube_id NOT NULL (no-op if already NOT NULL)
ALTER TABLE youtube_app_space.summary_jobs
  ALTER COLUMN youtube_id SET NOT NULL;
