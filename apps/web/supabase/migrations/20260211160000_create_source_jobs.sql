-- Source Job System Migration
-- Creates source_job_queue (pgmq), source_jobs table, Realtime publication, RLS, and cron job.

-- 1. Create source_job_queue (pgmq already exists from summary_queue migration)
DO $$
BEGIN
  PERFORM pgmq.create('source_job_queue');
EXCEPTION
  WHEN duplicate_object OR unique_violation OR OTHERS THEN
    NULL;
END $$;

-- 2. Grant permissions for source_job_queue (pgmq creates q_<queue_name> table)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'pgmq' AND tablename = 'q_source_job_queue') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON pgmq.q_source_job_queue TO service_role;
  END IF;
END $$;

-- 3. Create enums and source_jobs table (public schema)
CREATE TYPE public.source_job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.source_job_current_step AS ENUM ('extracting', 'summarizing');

CREATE TABLE IF NOT EXISTS public.source_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  block_id uuid NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'en',
  pgmq_msg_id bigint,
  status public.source_job_status NOT NULL DEFAULT 'pending',
  current_step public.source_job_current_step,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  UNIQUE(block_id, language)
);

COMMENT ON COLUMN public.source_jobs.current_step IS 'UI progress: null | extracting | summarizing';

CREATE INDEX IF NOT EXISTS idx_source_jobs_block_id ON public.source_jobs(block_id);
CREATE INDEX IF NOT EXISTS idx_source_jobs_status ON public.source_jobs(status);

GRANT ALL ON public.source_jobs TO service_role;
GRANT SELECT ON public.source_jobs TO authenticated;

-- 4. Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'source_jobs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.source_jobs;
  END IF;
END $$;

-- 5. RLS (deny-all; server uses service_role, main auth in business logic)
ALTER TABLE public.source_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "source_jobs_block_direct_access" ON public.source_jobs
  AS PERMISSIVE FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

-- 6. Cron job for process-source-job-queue Edge Function
SELECT cron.schedule(
  'invoke-process-source-job-queue',
  '5 seconds',
  $cron$
  SELECT net.http_post(
    url := (SELECT rtrim(base_url, '/') || '/functions/v1/process-source-job-queue'
      FROM config.edge_function_cron_config WHERE id = 1 AND base_url IS NOT NULL AND base_url != '' AND anon_key IS NOT NULL AND anon_key != ''),
    body := '{}'::jsonb,
    headers := (SELECT jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || anon_key)
      FROM config.edge_function_cron_config WHERE id = 1 AND base_url IS NOT NULL AND base_url != '' AND anon_key IS NOT NULL AND anon_key != '')
  )
  WHERE EXISTS (
    SELECT 1 FROM config.edge_function_cron_config
    WHERE id = 1 AND base_url IS NOT NULL AND base_url != '' AND anon_key IS NOT NULL AND anon_key != ''
  )
  $cron$
);
