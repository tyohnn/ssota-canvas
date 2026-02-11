# grepBlockContent 성능 분석

PostgreSQL(Supabase) + Node 서버 기준으로 `executeGrepBlockContent` 플로우의 성능을 데이터 크기별로 정리한 문서다.

---

## 1. 처리 흐름 요약

```
[Client] → API route → executeGrepBlockContent(repository, args, options)
                              │
                              ├─ buildScopeFromArgs (in-memory)
                              ├─ repository.findByContentPattern(patterns, scope)  ← DB 1회
                              └─ for each row:
                                    ├─ contentRaw.split('\n')
                                    ├─ for each line: lineMatches(line) (정규식 1~N개)
                                    └─ 매칭 시 context 라인 slice + 포맷팅
```

- **DB**: `block_mounts` ⋈ `blocks` + scope 조건 + **content_raw ILIKE '%p%' (OR)** 한 번.
- **서버**: DB에서 받은 **전체 행**에 대해 라인 단위 정규식 매칭 + 컨텍스트 문자열 생성.

---

## 2. DB 레이어 (PostgreSQL / Supabase)

### 2.1 쿼리 형태

```sql
SELECT bm.id, b.block_type, b.title, b.content_raw
FROM block_mounts bm
INNER JOIN blocks b ON bm.block_id = b.id
WHERE bm.deleted_at IS NULL AND b.deleted_at IS NULL
  AND bm.page_id = $1                    -- 또는 inArray(bm.id, ...) / workspace_id
  [AND b.workspace_id = $2]
  [AND b.block_type = ANY($3)]
  AND (b.content_raw ILIKE '%p1%' OR b.content_raw ILIKE '%p2%' ...);
```

- **스코프**: `page_id` 기준이면 `idx_block_mounts_page_id` 사용 가능.
- **content_raw 조건**: `ILIKE '%...%'` 는 **앞뒤 와일드카드**라 일반 B-tree 인덱스 사용 불가.
- 현재 스키마에는 **content_raw 에 대한 인덱스가 없음** → ILIKE 적용 구간은 **순차 스캔**.

### 2.2 실제 실행 시나리오

| 단계 | 동작 |
|------|------|
| 1 | `block_mounts` 에서 `page_id`(또는 id 목록) + `deleted_at IS NULL` 로 인덱스 스캔 |
| 2 | `blocks` 와 JOIN (block_id로 조인) |
| 3 | `blocks.workspace_id`, `block_type` 등 추가 필터 |
| 4 | **남은 행들 전체**에 대해 `content_raw ILIKE '%p1%' OR ...` 평가 (Seq Scan on join result 또는 blocks 쪽 스캔) |

즉, **스코프로 좁혀진 블록 수**만큼의 행에서 `content_raw` 텍스트를 전부 읽고 ILIKE를 적용한다.

### 2.3 Supabase 특성

- 공용 풀 사용 시 CPU/IO가 다른 테넌트와 공유.
- Row/Result set 크기가 크면 **네트워크 전송 시간**이 증가 (Supabase ↔ 서버).
- `content_raw` 가 TEXT 이므로 행당 크기가 클 수 있음 (수 KB ~ 수십 KB 가능).

---

## 3. 서버 레이어 (Node)

### 3.1 메모리

- `rows`: DB에서 받은 **전체 결과**를 한 번에 메모리에 적재.
- 각 row 에 `contentRaw` (전체 텍스트) 포함 → **총 payload ≈ Σ(content_raw 길이) + 메타데이터**.

### 3.2 CPU

- **정규식**: 패턴 수만큼 `RegExp(escapeRegex(p), 'gi')` 생성 후, **매 라인마다** `test()` 호출.
  - 라인 수 × 패턴 수 × 블록 수 만큼 정규식 실행.
- **문자열**: `split('\n')`, `slice()`, `map().join()` 등으로 컨텍스트 문자열 생성.
- **matchMode 'all' / invert**: 같은 라인에 대해 패턴을 여러 번 검사 (any/all, invert 여부만 다름).

---

## 4. 데이터 크기별 시나리오

가정:

- **페이지당 블록 수**: 10 / 100 / 500 / 2000
- **블록당 content_raw**: 평균 5 KB (짧은 노트) / 20 KB (긴 문서) / 50 KB (매우 긴 1블록)
- **매칭률**: ILIKE 로 걸러진 뒤 서버로 오는 행이 “페이지 블록의 10%~50%” 라고 가정 (패턴에 따라 다름).

### 4.1 소규모 (페이지 ~10블록, 블록당 ~5 KB)

| 항목 | 값 |
|------|-----|
| 스코프 블록 수 | 10 |
| DB 반환 행 (예: 50% 매칭) | 5 |
| 전송 데이터 | ~25 KB |
| 블록당 평균 라인 수 | ~100 라인 |
| 서버: 라인×패턴 | 5×100×1 ≈ 500 회 정규식 (패턴 1개) |

**예상**: DB 수 ms ~ 수십 ms, 네트워크 수 ms, 서버 수 ms. **전체 50 ms 이내** 수준.

### 4.2 중규모 (페이지 ~100블록, 블록당 ~20 KB)

| 항목 | 값 |
|------|-----|
| 스코프 블록 수 | 100 |
| DB 반환 행 (50% 매칭) | 50 |
| 전송 데이터 | ~1 MB |
| 블록당 평균 라인 수 | ~400 라인 |
| 서버: 라인×패턴 | 50×400×1 = 20,000 회 (패턴 1개) |

**예상**:

- DB: 스코프 인덱스 후 100행 JOIN + 100행 ILIKE → 수십 ms ~ 100 ms 대.
- 네트워크: 1 MB → 수십 ms (지역/품질에 따라 100 ms 넘을 수 있음).
- 서버: 2만 회 정규식 + 문자열 처리 → 수십 ms ~ 100 ms.
- **전체 200~400 ms** 정도 가능.

### 4.3 대규모 (페이지 ~500블록, 블록당 ~20 KB)

| 항목 | 값 |
|------|-----|
| 스코프 블록 수 | 500 |
| DB 반환 행 (40%) | 200 |
| 전송 데이터 | ~4 MB |
| 블록당 평균 라인 수 | ~400 |
| 서버: 라인×패턴 | 200×400 = 80,000 회 (패턴 1개) |

**예상**:

- DB: 500행 JOIN + 500행 ILIKE 스캔 → 100~300 ms.
- 네트워크: 4 MB → 100~500 ms.
- 서버: 메모리 ~4 MB, CPU 80k 정규식 → 100~300 ms.
- **전체 0.5~1 s** 구간 가능. 메모리 피크도 수 MB.

### 4.4 극단 (페이지 ~2000블록, 블록당 ~50 KB)

| 항목 | 값 |
|------|-----|
| 스코프 블록 수 | 2000 |
| DB 반환 행 (30%) | 600 |
| 전송 데이터 | ~30 MB |
| 서버: 라인×패턴 | 600×2000 라인 가정 → 1.2M 회 (패턴 1개) |

**예상**:

- DB: 2000행 JOIN + ILIKE → 수백 ms ~ 1 s.
- 네트워크: 30 MB → 1 s 이상 가능.
- 서버: **메모리 30 MB+**, CPU 수백 ms ~ 수 초.
- **전체 2~5 s 이상**, 타임아웃/메모리 부담 가능.

---

## 5. 병목 정리

| 구간 | 병목 요인 |
|------|-----------|
| **DB** | (1) 스코프가 넓을수록 JOIN/필터 행 증가, (2) **content_raw 에 인덱스 없음** → ILIKE 구간 순차 스캔, (3) 패턴 수만큼 OR 조건 증가 |
| **네트워크** | 반환 행 수 × content_raw 크기. 행이 많거나 블록이 크면 payload 커짐 |
| **서버** | (1) **한 번에 받는 행 전체** 메모리 적재, (2) **라인 수 × 패턴 수 × 블록 수** 만큼 정규식 실행, (3) context 라인 slice/문자열 조합 |

---

## 6. 개선 방향 (참고)

- **DB**
  - **LIMIT**: `findByContentPattern` 에 최대 반환 행 수 제한 (예: 200~500). 페이지 단위로 나누려면 cursor/offset 고려.
  - **pg_trgm**: `content_raw` 에 `pg_trgm` + GIN 인덱스 시 ILIKE '%...%' 구간 스캔 비용 감소 (Supabase에서 extension 사용 가능 여부 확인 필요).
- **서버**
  - **스트리밍/청크**: DB에서 행을 청크로 받아 한 블록씩 처리하면 메모리 피크 감소 (현재는 전체 rows 한 번에 처리).
  - **contextLines 상한**: 이미 0~10으로 제한되어 있어 과한 확장은 막혀 있음.
- **스코프**
  - 기본이 현재 페이지(`page_id`)이면, 페이지당 블록 수가 수백 이하로 유지되는 구조라 위 “중규모” 이하로 유지하기 쉬움. workspace 전체 검색은 블록 수가 크게 늘어나므로 LIMIT 또는 pg_trgm 이 더 중요해짐.

---

## 7. 요약 표 (체감 기준)

| 규모 | 페이지 블록 수 | 예상 반환 행 | payload | 전체 응답 시간 (대략) |
|------|----------------|-------------|---------|------------------------|
| 소 | ~10 | ~5 | ~25 KB | &lt; 50 ms |
| 중 | ~100 | ~50 | ~1 MB | 200~400 ms |
| 대 | ~500 | ~200 | ~4 MB | 0.5~1 s |
| 극단 | ~2000 | ~600 | ~30 MB | 2~5 s+ (위험 구간) |

실제 측정은 Supabase 대시보드의 Query performance, 서버 로그에 구간별 시간을 남겨 두고 확인하는 것을 권장한다.
