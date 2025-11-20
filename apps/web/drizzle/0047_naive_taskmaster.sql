-- Fix content column: text → jsonb with data migration
-- 기존 text 데이터를 JSON으로 파싱하여 jsonb로 변환

-- PostgreSQL USING 절을 사용하여 타입 변환
-- content가 JSON string이면 parse, 아니면 null
ALTER TABLE "blocks" 
ALTER COLUMN "content" 
SET DATA TYPE jsonb 
USING (
  CASE 
    -- content가 null이거나 빈 문자열이면 null
    WHEN content IS NULL OR content = '' THEN NULL
    -- content가 JSON string인 경우 parse
    WHEN content ~ '^\s*\{' THEN content::jsonb
    -- 그 외의 경우 null (invalid data)
    ELSE NULL
  END
);

