-- YouTube Summary Queue (1/2): pgmq extension + summary_queue만 생성
-- Remote(dev/main)에서는 이 마이그레이션 적용 후, Dashboard에서 수동 설정(예: Expose Queues 등)을 하고
-- 다음 마이그레이션(20260205140100)이 적용되도록 합니다.

CREATE EXTENSION IF NOT EXISTS pgmq;

-- summary_queue 생성 (이미 있으면 스킵)
DO $$
BEGIN
  PERFORM pgmq.create('summary_queue');
EXCEPTION
  WHEN duplicate_object OR unique_violation OR OTHERS THEN
    NULL;
END $$;
