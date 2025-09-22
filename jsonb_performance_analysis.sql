-- JSONB 성능 최적화를 위한 인덱스 생성 예시

-- 1. GIN 인덱스 (가장 일반적, 모든 JSONB 연산 지원)
CREATE INDEX CONCURRENTLY idx_blocks_metadata_gin 
ON blocks USING GIN (metadata);

-- 2. 특정 키에 대한 B-tree 인덱스 (정확한 값 매칭에 최적)
CREATE INDEX CONCURRENTLY idx_blocks_metadata_color 
ON blocks USING BTREE ((metadata->'nodeUI'->>'color'));

-- 3. 특정 키에 대한 Hash 인덱스 (등가 비교에 최적)
CREATE INDEX CONCURRENTLY idx_blocks_metadata_status_hash 
ON blocks USING HASH ((metadata->'formData'->>'status'));

-- 4. 복합 인덱스 (여러 조건 조합)
CREATE INDEX CONCURRENTLY idx_blocks_metadata_composite 
ON blocks (workspace_id, (metadata->'nodeUI'->>'color'));

-- 5. 부분 인덱스 (특정 조건의 데이터만 인덱싱)
CREATE INDEX CONCURRENTLY idx_blocks_metadata_yellow_nodes 
ON blocks USING GIN (metadata) 
WHERE metadata->'nodeUI'->>'color' = 'yellow';

-- 6. 표현식 인덱스 (계산된 값에 대한 인덱스)
CREATE INDEX CONCURRENTLY idx_blocks_metadata_field_count 
ON blocks ((jsonb_array_length(metadata->'formSchema'->'fields')));

-- 성능 테스트 쿼리들
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, name 
FROM blocks 
WHERE metadata->'nodeUI'->>'color' = 'yellow';

EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, name 
FROM blocks 
WHERE metadata @> '{"nodeUI": {"color": "yellow"}}';

EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, name 
FROM blocks 
WHERE metadata->'formSchema'->'fields' @> '[{"type": "status"}]';
