-- YouTube App Space migration cleanup: drop legacy video path tables
-- Source path uses source-management (sources, source_summaries, source_action_transactions, source_jobs).

-- Drop in dependency order (summary_jobs has no FK to others; action_transactions references videos)
DROP TABLE IF EXISTS youtube_app_space.summary_jobs;
DROP TABLE IF EXISTS youtube_app_space.action_transactions;
DROP TABLE IF EXISTS youtube_app_space.video_summaries;
