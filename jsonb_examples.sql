-- 현재 프로젝트의 blocks 테이블 기준 JSONB 필터링 예시

-- 1. 특정 색상의 노드 찾기
SELECT id, name, metadata->'nodeUI'->>'color' as color
FROM blocks 
WHERE metadata->'nodeUI'->>'color' = 'yellow';

-- 2. 특정 상태의 노드 찾기
SELECT id, name, metadata->'formData'->>'status' as status
FROM blocks 
WHERE metadata->'formData'->>'status' = 'in_progress';

-- 3. 특정 폼 필드 타입을 가진 노드 찾기
SELECT id, name, metadata->'formSchema'->'fields'
FROM blocks 
WHERE metadata->'formSchema'->'fields' @> '[{"type": "status"}]';

-- 4. 복합 조건 (색상과 상태)
SELECT id, name, 
       metadata->'nodeUI'->>'color' as color,
       metadata->'formData'->>'status' as status
FROM blocks 
WHERE metadata->'nodeUI'->>'color' = 'yellow' 
  AND metadata->'formData'->>'status' = 'complete';

-- 5. 배열 길이로 필터링
SELECT id, name, 
       jsonb_array_length(metadata->'formSchema'->'fields') as field_count
FROM blocks 
WHERE jsonb_array_length(metadata->'formSchema'->'fields') > 3;

-- 6. 키 존재 여부 확인
SELECT id, name
FROM blocks 
WHERE metadata ? 'nodeUI' 
  AND metadata->'nodeUI' ? 'color';

-- 7. 부분 문자열 검색 (텍스트 필드)
SELECT id, name, metadata->'formData'->>'ydvJb' as description
FROM blocks 
WHERE metadata->'formData'->>'ydvJb' ILIKE '%조건%';

-- 8. 숫자 범위 검색
SELECT id, name, 
       (metadata->'nodeUI'->'size'->>'width')::int as width
FROM blocks 
WHERE (metadata->'nodeUI'->'size'->>'width')::int > 300;
