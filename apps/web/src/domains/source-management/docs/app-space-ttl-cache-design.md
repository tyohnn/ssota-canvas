# App Space TTL 캐시 설계

YouTube/Link 스크래핑 캐시와 영구 저장소(sources) 설계.
논의 과정과 최종 결정사항을 정리한다.

---

## 1. 배경

### 1.1 현황

- **YouTube**: `youtube_app_space.videos.script`에 스크립트 저장. 같은 slug는 한 번만 저장하여 재사용(캐싱).
- **Link**: Firecrawl 스크래핑 후 `sources.raw_content`에 markdown 저장. `url_hash` 기준 dedupe (`findOrCreateSource`).
- LLM/Firecrawl API 비용 절감을 위해 캐싱 사용. 동시에 DB에 캐시 데이터를 보관해야 함.

### 1.2 의문

- 한 달에 YouTube 1만 개, Link 1만 개씩 추가 시 DB 비용은?
- 캐싱 데이터를 우리 DB에 보관하는 것이 옳은가?
- Firecrawl도 캐시를 사용하는데 그들의 DB는 엄청 클 것 같은데?

### 1.3 결론 (비용 분석)

- **DB 보관은 타당함**: sources는 단순 캐시가 아니라 검색·요약·에이전트용 핵심 데이터.
- **규모 감**: 월 2만 건 × ~100KB ≈ 2GB/월 → 연 24GB 수준. Supabase Pro 100GB로 수 년 커버 가능.
- **Firecrawl vs SSOTA**: Firecrawl은 전 유저·전 URL 글로벌 캐시. SSOTA는 우리 유저가 캔버스에 올린 URL만 저장하므로 규모가 훨씬 작음.

---

## 2. 도메인 역할 구분 (수정)

### 2.1 sources는 block/user에 의존하지 않음

- `public.sources`는 **url_hash 기준** 전역 dedupe. block_id, user_id 없음.
- 블록이 소비하는 도메인: `blocks.source_id` → `sources.id`.
- **link_app_space는 불필요**: sources가 이미 URL별 1건으로 캐시 역할을 함. sources에 TTL을 두면 됨.

### 2.2 youtube_app_space vs sources

| 도메인 | 역할 | 비고 |
|--------|------|------|
| **youtube_app_space** | 유튜브 플랫폼 내부 데이터 (채널, 댓글, 영상 메타, script 등) | 플랫폼 네이티브 구조 |
| **sources** | 블록이 소비하는 통합 소스 (raw_content, 요약, 과금 추적) | block-consumed, url_hash 기준 |

- YouTube: `videos.script` → `sources.raw_content`로 복사. sources가 블록의 소스.
- Link: Firecrawl 스크래핑 → 바로 `sources.raw_content`. link_app_space 없이 sources만 사용.

### 2.3 TTL 적용 위치 (최종)

- **youtube_app_space.videos**: `expires_at` 추가 (6개월). videos는 유튜브 데이터 캐시.
- **sources**: `expires_at` 추가 (Link 2일, YouTube 6개월). 블록 참조 중이면 만료 안 함.

---

## 3. source_jobs와 블록 관계

### 3.1 source_job은 블록 기준으로 관리됨

- `source_jobs`는 **(block_id, language) 당 1건** (UNIQUE 제약).
- 역할: 추출(extracting) → 요약(summarizing) 파이프라인 상태 + Realtime UI 진행률.
- **"어떤 작업에서 이루어졌는지"** → `block_id`로 `source_jobs` 조회.

```
blocks.source_id ──→ sources (raw_content, 요약용)
blocks.id (block_id) ──→ source_jobs (이 블록의 추출/요약 job 상태)
```

### 3.2 흐름

1. 메타데이터 추출 완료 → `findOrCreateSource` → `block.source_id` 설정.
2. `ensureSourceJobService` → `source_jobs` 생성 (block_id, source_id, language).
3. 큐/워커 → `processSourceJobService` → 추출 → ensureSourceSummary → `source_jobs.status = completed`.
4. UI: Realtime 구독 `source_jobs` where `block_id=eq.{blockUuid}` → "추출 중 / 요약 중" 표시.

---

## 4. TTL 캐시 범위: 링크별 vs 유저별

### 4.1 결론: **링크별(전역)**

| 구분 | 링크별 (전역) | 유저별+링크별 |
|------|----------------|----------------|
| 히트 | 유저 B가 유저 A가 스크래핑한 링크 요청 → 히트 | 유저 A가 같은 링크를 2번 요청 → 히트 |
| 현실 | 같은 인기 링크를 여러 유저가 쓸 가능성 높음 | 유저는 한 번 스크래핑하면 다시 할 일이 거의 없음 |
| 저장 | 1 URL = 1 엔트리 | 100 유저 × 같은 URL = 100 엔트리 |

- "새로고침" 필요 시: `forceRefresh` 등으로 TTL 우회, Firecrawl 직접 호출.

---

## 5. YouTube: youtube_app_space.videos

### 5.1 TTL 적용

- **videos.script**: TTL 적용. `sources.raw_content`는 transcripts 복사본으로 영구 보유(캔버스 추가 시).
- TTL 만료 시 videos.script만 비우거나 재추출. sources에는 영향 없음.

### 5.2 TTL 기간: 6개월

- 영상 스크립트는 사실상 불변. 저작권/정책상 "영구 보관 아님" 전제.
- 6개월: 캐시 히트율·비용 균형.

### 5.3 스키마

```sql
-- youtube_app_space.videos 에 추가
expires_at TIMESTAMPTZ  -- script 추출 시점 + 6개월
```

---

## 6. Link: sources에 TTL (link_app_space 없음)

### 6.1 설계 변경

- `link_app_space.links` **미도입**. sources가 URL별 캐시이자 블록 소스.
- **sources**에 `expires_at` 컬럼 추가.

### 6.2 TTL 정책

- **블록 참조 중**: `expires_at` 만료 무시. `blocks.source_id = sources.id` 인 row가 1개라도 있으면 영구 유지.
- **블록 미참조**: `expires_at < now()` 이면 `raw_content` null 처리 또는 재스크래핑 트리거. (Cron/Job에서 정리)

### 6.3 스키마

```sql
-- public.sources 에 추가
expires_at TIMESTAMPTZ  -- source_type='link' 일 때 extracted_at + 2일, 'youtube' 일 때 + 6개월
```

### 6.4 TTL 기간

- Link: **2일** (웹페이지 변경 빈도 고려).
- YouTube(문자열 등): sources에 복사 시 **6개월** 또는 영구(블록 참조 시).

---

## 7. 요약

| 항목 | YouTube | Link |
|------|---------|------|
| App Space | `youtube_app_space.videos` (expires_at 6개월) | 없음 |
| 블록 소스 | `sources` (url_hash, block 참조 시 영구) | `sources` (url_hash, TTL 2일, block 참조 시 영구) |
| TTL 캐시 | videos.script | sources.raw_content |
| 작업 추적 | `source_jobs` (block_id 기준) | `source_jobs` (block_id 기준) |
