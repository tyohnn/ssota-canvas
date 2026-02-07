-- YouTube Summary Queue (2/2): pgmq_public 스키마·함수, summary_jobs, RLS
-- 1차(20260205140000) 적용 후 Remote에서는 수동 설정(Expose Queues 등)을 하고 이 마이그레이션을 적용합니다.

-- pgmq_public 스키마 (로컬 config.toml schemas용; 호스팅에서는 Expose Queues 토글이 생성할 수 있음)
CREATE SCHEMA IF NOT EXISTS pgmq_public;

-- pgmq_public 래퍼 함수 (Supabase Queues API와 동일 시그니처). IF NOT EXISTS로 재실행 시 에러 방지.
-- DO 블록은 $mig$ 태그 사용 (내부 CREATE FUNCTION의 $$ 와 충돌 방지)
-- https://supabase.com/docs/guides/queues/api
DO $mig$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'pgmq_public' AND p.proname = 'read') THEN
    CREATE FUNCTION pgmq_public.read(queue_name text, sleep_seconds integer, n integer)
    RETURNS SETOF pgmq.message_record
    LANGUAGE sql
    SECURITY DEFINER
    AS $$ SELECT * FROM pgmq.read(queue_name, sleep_seconds, n); $$;
  END IF;
END $mig$;

DO $mig$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'pgmq_public' AND p.proname = 'archive') THEN
    CREATE FUNCTION pgmq_public.archive(queue_name text, message_id bigint)
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    AS $$ SELECT pgmq.archive(queue_name, message_id); $$;
  END IF;
END $mig$;

DO $mig$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'pgmq_public' AND p.proname = 'delete') THEN
    CREATE FUNCTION pgmq_public.delete(queue_name text, message_id bigint)
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    AS $$ SELECT pgmq.delete(queue_name, message_id); $$;
  END IF;
END $mig$;

DO $mig$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'pgmq_public' AND p.proname = 'send') THEN
    CREATE FUNCTION pgmq_public.send(queue_name text, message jsonb, sleep_seconds integer DEFAULT 0)
    RETURNS bigint
    LANGUAGE sql
    SECURITY DEFINER
    AS $$ SELECT (SELECT * FROM pgmq.send(queue_name, message, sleep_seconds) LIMIT 1); $$;
  END IF;
END $mig$;

DO $mig$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'pgmq_public' AND p.proname = 'pop') THEN
    CREATE FUNCTION pgmq_public.pop(queue_name text)
    RETURNS SETOF pgmq.message_record
    LANGUAGE sql
    SECURITY DEFINER
    AS $$ SELECT * FROM pgmq.pop(queue_name); $$;
  END IF;
END $mig$;

GRANT USAGE ON SCHEMA pgmq_public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgmq_public TO service_role;

-- summary_queue 테이블 권한 (Dashboard "Manage queue permissions"와 동일: postgres는 소유자로 이미 전부 보유, service_role만 명시적 GRANT)
GRANT SELECT, INSERT, UPDATE, DELETE ON pgmq.q_summary_queue TO service_role;

-- summary_queue RLS
ALTER TABLE pgmq.q_summary_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'pgmq' AND tablename = 'q_summary_queue' AND policyname = 'service_role can manage summary_queue') THEN
    CREATE POLICY "service_role can manage summary_queue"
      ON pgmq.q_summary_queue
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- summary_jobs 테이블 (Realtime 상태 추적)
CREATE TABLE IF NOT EXISTS youtube_app_space.summary_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  youtube_id text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  pgmq_msg_id bigint,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  UNIQUE(block_id, language)
);

CREATE INDEX IF NOT EXISTS idx_summary_jobs_block_id ON youtube_app_space.summary_jobs(block_id);
CREATE INDEX IF NOT EXISTS idx_summary_jobs_status ON youtube_app_space.summary_jobs(status);

GRANT ALL ON youtube_app_space.summary_jobs TO service_role;
GRANT SELECT ON youtube_app_space.summary_jobs TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'youtube_app_space'
      AND tablename = 'summary_jobs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE youtube_app_space.summary_jobs;
  END IF;
END $$;

ALTER TABLE youtube_app_space.summary_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'youtube_app_space' AND tablename = 'summary_jobs' AND policyname = 'Users can view their org''s summary jobs') THEN
    CREATE POLICY "Users can view their org's summary jobs"
      ON youtube_app_space.summary_jobs
      FOR SELECT
      TO authenticated
      USING (
        org_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;

-- config 스키마: Edge Function cron 등 인프라 설정 (api.schemas에 넣지 않아 PostgREST 비노출)
CREATE SCHEMA IF NOT EXISTS config;

-- Cron → Edge Function HTTP 호출용 설정 (환경마다 한 번 설정. 로컬 기본값, Remote는 배포 후 수동 UPDATE)
CREATE TABLE IF NOT EXISTS config.edge_function_cron_config (
  id int PRIMARY KEY DEFAULT 1,
  base_url text NOT NULL DEFAULT 'http://kong:8000',
  anon_key text,
  CONSTRAINT single_row CHECK (id = 1)
);

-- 로컬용 기본값은 seed.sql에서만 INSERT (배포 DB에는 넣지 않음)

REVOKE ALL ON config.edge_function_cron_config FROM anon, authenticated;
GRANT SELECT, UPDATE ON config.edge_function_cron_config TO service_role;

-- 매 5초마다 process-summary-queue Edge Function으로 HTTP POST (net.http_post 사용).
-- base_url·anon_key 둘 다 있을 때만 호출 (배포 후 수동 INSERT 전에는 호출 안 함).
-- 참고: pg_cron은 SQL로만 등록되므로 대시보드에서는 "database function"으로 보일 수 있으나, 실제로는 HTTP Request임.
SELECT cron.schedule(
  'invoke-process-summary-queue',
  '5 seconds',
  $cron$
  SELECT net.http_post(
    url := (SELECT rtrim(base_url, '/') || '/functions/v1/process-summary-queue'
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