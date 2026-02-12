-- source_job_queue에 RLS 적용 (summary_queue와 동일 패턴)
-- summary_queue 삭제 (source_job_queue로 마이그레이션 완료)

-- 1. source_job_queue RLS
ALTER TABLE pgmq.q_source_job_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'pgmq' AND tablename = 'q_source_job_queue' AND policyname = 'service_role can manage source_job_queue') THEN
    CREATE POLICY "service_role can manage source_job_queue"
      ON pgmq.q_source_job_queue
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 2. summary_queue 삭제 (cron unschedule는 20260211190100에서 완료)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'pgmq' AND tablename = 'q_summary_queue') THEN
    PERFORM pgmq.drop_queue('summary_queue');
  END IF;
END $$;
