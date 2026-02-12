# Supabase/PostgreSQL 검색 백엔드 옵션

현재 내부 검색(grep 등)은 **Supabase(PostgreSQL)에서 `ILIKE '%...%'`** 로 구현되어 있다. 이 문서는 ILIKE 대안으로 쓸 수 있는 Supabase/PostgreSQL 검색 옵션을 정리한다.

---

## 1. 현재 구현 요약

- **위치**: `DrizzleBlockSearchRepository` (`findByContentPattern`, `findBySourceContentPattern`, `findBySourceSummaryPattern`), 페이지/조직 검색 등.
- **방식**: Drizzle `ilike(column, '%pattern%')` → PostgreSQL `column ILIKE '%pattern%'`.
- **특징**: 부분 문자열 매칭만 가능, **랭킹 없음**, 앞뒤 와일드카드 때문에 일반 B-tree 인덱스 사용 불가(순차 스캔 구간 발생).

---

## 2. 옵션 비교

| 옵션 | 랭킹 | 다국어(한국어) | Supabase | 비고 |
|------|------|----------------|----------|------|
| **ILIKE (현재)** | 없음 | 가능 | ✅ | 인덱스 없으면 대용량에서 비효율 |
| **FTS + GIN** | ts_rank | 영어 위주 | ✅ | 기본 FTS, 무난한 첫 단계 |
| **FTS + RUM** | ts_rank + 거리/구문 | 영어 위주 | ✅ | 구문·시간순 정렬 강화 |
| **pg_trgm** | 유사도만 | 가능 | ✅ | ILIKE 가속·오타 허용 |
| **PGroonga** | 엔진 랭킹 | 한국어 등 우수 | ✅ | 다국어 전문 검색 |
| **pg_textsearch (BM25)** | BM25 | 설정 의존 | ⚠️ PG17·확장 확인 | Supabase 기본 목록엔 없음 |
| **pgvector** | 유사도(의미) | 임베딩 의존 | ✅ | 하이브리드 검색용 |

---

## 3. 옵션별 상세

### 3.1 PostgreSQL 기본 Full-Text Search (FTS)

- **문서**: [Supabase – Full Text Search](https://supabase.com/docs/guides/database/full-text-search)
- **함수**: `to_tsvector()`, `to_tsquery()` / `plainto_tsquery()`, `websearch_to_tsquery()`, 매칭 연산자 `@@`.
- **랭킹**: `ts_rank()` / `ts_rank_cd()` (BM25는 아니지만 빈도·위치 기반 점수).
- **인덱스**: `GIN` 사용. generated column로 `tsvector` 저장 후 `CREATE INDEX ... USING gin(fts)`.
- **특징**: 스테밍, 불용어, 다중 컬럼·가중치(A/B/C/D) 지원. 영어 등 알파벳 언어에 적합.

### 3.2 pg_trgm (Trigram)

- **문서**: [PostgreSQL pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html), Supabase Extensions 목록에 포함.
- **역할**: 문자열 유사도(트라이그램) + **ILIKE/LIKE용 인덱스**.
- **연산자**: `%` (유사도), `LIKE`/`ILIKE`에 `gist_trgm_ops` / `gin_trgm_ops` 인덱스 사용.
- **특징**: 오타·부분 일치에 강함. **기존 ILIKE 쿼리 유지한 채 인덱스만 추가**해 성능 개선 가능.
- **한계**: BM25 같은 문서 랭킹은 없음.

### 3.3 RUM 인덱스

- **문서**: [Supabase – RUM extension](https://supabase.com/docs/guides/database/extensions/rum).
- **역할**: GIN과 유사하지만 **위치 정보**를 인덱스에 저장.
- **장점**: 구문 검색(phrase search), **텍스트 거리로 정렬** (`tsvector <=> tsquery`), **비인덱스 컬럼(예: timestamp)으로 정렬** 시에도 인덱스 활용.
- **특징**: FTS와 동일한 `tsvector`/`tsquery` 사용. 인덱스만 `USING rum`으로 변경 가능.
- **단점**: 인덱스 크기·빌드/쓰기 비용이 GIN보다 큼.

### 3.4 PGroonga

- **문서**: [Supabase – PGroonga](https://supabase.com/docs/guides/database/extensions/pgroonga).
- **역할**: Groonga 기반 전문 검색. **다국어(한국어, 일본어, 중국어 등)** 지원.
- **연산자**: `&&@~` 로 전문 검색 (AND/OR/negation 등). `LIKE '%...%'` 도 PGroonga 인덱스로 가속 가능.
- **특징**: 한국어 비중이 큰 검색에 유리. BM25는 아니지만 Groonga 자체 랭킹 제공.

### 3.5 BM25: pg_textsearch (Timescale)

- **역할**: **BM25** 랭킹(TF, IDF, 문서 길이 정규화).
- **요구**: PostgreSQL **17+**.
- **Supabase**: 기본 확장 목록에 없음. [database.dev](https://database.dev/) 등으로 설치 가능 여부는 인스턴스/플랜에 따라 확인 필요.
- **용도**: BM25 점수로 정렬이 꼭 필요할 때. Supabase 관리형에서는 공식 지원이 아니므로 PG 버전·확장 설치 가능 여부 확인 필요.

### 3.6 pgvector (의미 검색)

- **문서**: [Supabase – Semantic search](https://supabase.com/docs/guides/ai/semantic-search).
- **역할**: 임베딩 벡터 유사도 검색(코사인 등).
- **용도**: “의미가 비슷한” 문장/문단 검색. 키워드 검색과 별도 축.
- **활용**: FTS/BM25와 **하이브리드 검색** (키워드 점수 + 벡터 유사도 결합)에 사용.

---

## 4. 적용 우선순위 제안

1. **당장 ILIKE만 개선**  
   - `pg_trgm` 활성화 후 `content_raw`, `title` 등 검색 컬럼에 `USING gin(column_name gin_trgm_ops)` 인덱스 추가.  
   - 쿼리 변경 없이 스캔 비용 감소 기대.

2. **랭킹이 필요할 때**  
   - `to_tsvector`/`to_tsquery` + `ts_rank` + **GIN**(또는 **RUM**) 으로 전환.  
   - Drizzle에서는 `sql` 템플릿으로 FTS 조건/랭킹 표현 가능.

3. **한국어 비중이 클 때**  
   - **PGroonga**로 검색 컬럼 인덱스 후 `&&@~` 연산자로 전환 검토.

4. **BM25가 꼭 필요할 때**  
   - Supabase에서 **pg_textsearch** 설치 가능 여부 확인.  
   - 불가 시 FTS + RUM + `ts_rank`로 타협하거나 외부 검색 엔진 검토.

---

## 5. 관련 코드

- **Repository**: `apps/web/src/domains/ai-management/backend/repositories/implementations/drizzle-block-search.repository.ts`  
  - `findByContentPattern`, `findByMetadata`, `findBySourceContentPattern`, `findBySourceSummaryPattern` 등에서 `ilike` 사용.
- **성능 분석**: 같은 디렉터리의 `grep-block-content-performance-analysis.md` 참고.

---

## 6. 참고 링크

- [Supabase – Full Text Search](https://supabase.com/docs/guides/database/full-text-search)
- [Supabase – Postgres Extensions Overview](https://supabase.com/docs/guides/database/extensions)
- [Supabase – RUM](https://supabase.com/docs/guides/database/extensions/rum)
- [Supabase – PGroonga](https://supabase.com/docs/guides/database/extensions/pgroonga)
- [PostgreSQL – pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Timescale pg_textsearch (BM25)](https://github.com/timescale/pg_textsearch) (Supabase 기본 목록 외)
