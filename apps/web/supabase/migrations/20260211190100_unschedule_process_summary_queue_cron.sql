-- Unschedule legacy summary queue cron (process-summary-queue Edge Function removed).
-- Source jobs use process-source-job-queue and source_job_queue instead.
SELECT cron.unschedule('invoke-process-summary-queue');
