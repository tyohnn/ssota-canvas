# Source Management 마이그레이션 Plan

YouTube App Space → Sources 아키텍처 전환 계획.
`architecture.md`의 옵션 B(통합 Sources + 소스 기준 요약)를 기반으로 한다.

---

## 1. 결정된 사항

### 1.1 블록 → 소스 참조: source_id 단일 참조

- `blocks.source_id` (FK → sources.id)만 사용한다.
- 기존 `blocks.properties.youtubeId` (App Space 참조)는 **제거**하고 `sources.metadata.appSpaceVideoId`로 이전한다.
- YouTube 블록의 **UI 렌더링용 properties** (youtubeTitle, youtubeThumbnail, channelName 등)는 기존처럼 `block.properties`에 유지한다. 이건 블록 타입별로 세팅하는 기존 패턴 그대로.
- **원칙**: 블록은 Sources만 참조한다. App Space에 직접 접근하지 않는다.

```
Before:
  blocks.properties.youtubeId → youtube_app_space.videos.id

After:
  blocks.source_id → sources.id
  sources.metadata.appSpaceVideoId → youtube_app_space.videos.id
  blocks.properties: 렌더링 전용 (thumbnail, title, channelName 등)
```

### 1.2 접근 제어 플래그: 일반화 + block.properties 캐시

- **Source of truth**: `source_action_transactions` (org + source + action_type + language)
- **Fast-path 캐시**: `block.properties`에 일반화된 이름으로 유지

```
Before (YouTube 전용):
  blocks.properties.scriptAccessGranted: boolean
  blocks.properties.summaryAccessGrantedLanguages: string[]

After (범용):
  blocks.properties.sourceContentAccessGranted: boolean
  blocks.properties.sourceSummaryAccessLanguages: string[]
```

**라이프사이클**:
1. 유저가 추출/요약 요청
2. `source_action_transaction` 기록 (org 기준, 크레딧 차감)
3. 실제 데이터 확인 (이미 있으면 skip, 없으면 생성)
4. `block.properties` 플래그 업데이트 (캐시)
5. 다음 조회 시 플래그로 빠른 경로 → action_transaction 조회 불필요

**자동 복구(auto-recovery)**:
플래그 없음 → action_transaction 확인 → 있으면 플래그 복원 + 데이터 반환

**크레딧 차감 시나리오**:
- 조직A가 요약 생성 (실제 AI 호출) → 크레딧 차감, action_transaction 기록
- 조직B가 동일 소스 요약 요청 → source_summary 이미 존재하므로 AI 호출 불필요, 하지만 **크레딧 차감 + action_transaction 기록** 필요 (접근 권한 부여 목적)

### 1.3 raw_content 포맷: 타임스탬프 텍스트 포함

`sources.raw_content`는 TEXT 컬럼이며, **타임스탬프를 텍스트로 포함**한다.

```
YouTube raw_content 예시:
  "[00:00] 안녕하세요\n[00:05] 오늘은 AI에 대해 이야기하겠습니다\n[01:30] 첫 번째 주제는..."

PDF raw_content 예시:
  "제1장 서론\n본 논문에서는...\n\n제2장 관련 연구\n..."

X raw_content 예시:
  "AI가 코딩을 대체할 수 있을까?\n\n이건 단순한 문제가 아닙니다..."
```

- **요약 생성**: 항상 `sources.raw_content`에서 수행. 소스 타입에 무관하게 동일 로직.
- **프롬프트 분기**: `sources.source_type`을 힌트로 사용 가능 ("이 텍스트는 YouTube 영상의 트랜스크립트입니다" 등). 프롬프트만 분기, 데이터 처리 로직은 통일.

### 1.4 요약 큐잉: 기존 패턴 유지, 대상만 변경

- 기존 `ensureVideoSummary` → `ensureSourceSummary`로 마이그레이션.
- pgmq 큐 패턴 유지. 큐잉 → Edge Function → API route → 요약 생성 → source_summaries 저장.
- 메타데이터 추출 완료 시 기존처럼 이벤트 발행 → 요약 큐잉 자동 트리거.

```
Before:
  메타데이터 → publishYoutubeMetadataFetched → ensureVideoSummary → pgmq
  큐 처리 → extractAndUpdateSummary → video_summaries

After:
  메타데이터 → publishYoutubeMetadataFetched → ensureSourceSummary → pgmq
  큐 처리 → extractAndUpdateSummary → source_summaries
```

### 1.5 Published Page 인증 일반화

#### 배경: 왜 Published Page에 별도 인증이 필요한가

Published Page(공개 페이지)에서는 비로그인 유저도 콘텐츠를 볼 수 있다. 일반 블록(텍스트, 이미지 등)은 블록 데이터에 콘텐츠가 이미 포함되어 있어 서버 호출 없이 렌더링된다. 하지만 **소스 기반 블록**(YouTube, PDF 등)은 스크립트/요약을 **서버에서 온디맨드로 가져와야** 하므로, Publish Token 기반 인증이 필요하다.

#### 현재 구조: YouTube 전용 `withPublishedPageSecureAction`

현재 `withPublishedPageSecureAction`은 YouTube 블록 컴포넌트 내부에서만 호출된다.

**호출 흐름**:
```
Published Page 렌더링
  → YouTube 블록 컴포넌트
    → useCanvasReadOnly() → { readonly: true, publishToken: "..." }
    → useVideoScript({ readonly: true, publishToken })
      → processVideoScriptForPublishedPageAction
        → withPublishedPageSecureAction (검증)
```

**현재 검증 단계** (`secure-action.ts`의 `authorizeByPublishedPage`):
1. `publishToken` 검증 → publishedPage 조회 (범용)
2. `blockId`가 해당 page에 속하는지 확인 (범용)
3. `block.block_type === 'youtube'` 검증 ← **YouTube 전용**
4. `YoutubeBlockPropertiesVO` 파싱 ← **YouTube 전용**
5. `youtubeId` 일치 확인 ← **YouTube 전용**
6. `orgId` 조회 (page → workspace → org) (범용)

**현재 사용하는 3개 Published Page 액션**:
- `processVideoScriptForPublishedPageAction` — 스크립트 조회
- `processVideoSummaryForPublishedPageAction` — 요약 조회
- `getAvailableSummaryLangListForPublishedPageAction` — 사용 가능 언어 조회

**현재 `PublishedPageContext`**:
```typescript
interface PublishedPageContext {
  publishedPage: PublishedPage;
  pageId: PageId;
  block: Block;                                // 검증된 Block Entity
  youtubeProperties: YoutubeBlockPropertiesVO; // ← YouTube 전용
  orgId: string;
}
```

#### 마이그레이션: Source 기반 범용 `withPublishedPageSourceSecureAction`

Source 기반으로 일반화하여 **모든 소스 타입 블록에서 공통으로 사용**한다.

**새 검증 단계**:
1. `publishToken` 검증 → publishedPage 조회 (그대로)
2. `blockId`가 해당 page에 속하는지 확인 (그대로)
3. `block.source_id` 존재 확인 ← **범용! (블록 타입 무관)**
4. `sourceId` 일치 확인 (요청의 sourceId === block.source_id) ← **범용!**
5. `orgId` 조회 (그대로)

**새 `PublishedPageSourceContext`**:
```typescript
interface PublishedPageSourceContext {
  publishedPage: PublishedPage;
  pageId: PageId;
  block: Block;
  sourceId: string;    // ← 범용 (YouTube, PDF, X, ... 모두 동일)
  sourceType: string;  // ← 'youtube' | 'pdf' | 'x' | 'thread' | 'audio'
  orgId: string;
}
```

**새 Published Page 액션** (YouTube 전용 3개 → Source 범용 3개):
```
Before:
  processVideoScriptForPublishedPageAction   → YouTube 스크립트 전용
  processVideoSummaryForPublishedPageAction  → YouTube 요약 전용
  getAvailableSummaryLangListForPublishedPageAction → YouTube 언어 전용

After:
  getSourceContentForPublishedPageAction     → 모든 소스 타입의 raw_content 조회
  getSourceSummaryForPublishedPageAction     → 모든 소스 타입의 요약 조회
  getSourceSummaryLanguagesForPublishedPageAction → 모든 소스 타입의 사용 가능 언어 조회
```

**프론트엔드 훅 변경**:
```
Before:
  useVideoScript({ readonly, publishToken })
    → readonly 분기: processVideoScriptForPublishedPageAction

After:
  useSourceContent({ readonly, publishToken })
    → readonly 분기: getSourceContentForPublishedPageAction
  (YouTube 블록은 이 훅의 결과를 받아 타임스탬프 파싱 등 YouTube 전용 처리)
```

이를 통해 향후 PDF, X, 오디오 등의 블록이 Published Page에서 서버 데이터를 가져올 때 **동일한 auth wrapper와 액션을 재사용**할 수 있다.

---

## 2. 결정된 사항 (타임스탬프 처리)

### 2.1 sourceContentAccessGranted 시 YouTube 타임스탬프 처리 — 방향 B

**결정**: 타임스탬프 재생·TOC·인용 등 **도메인 전용 UI 기능**에는 **App Space**를 참조한다. `sources.raw_content`는 검색·요약 전용으로만 사용한다.

- **검색·요약·에이전트**: `sources.raw_content` + `source_summaries` (Sources만 참조)
- **타임스탬프 클릭 → 재생, 목차(TOC), 인용**: `youtube_app_space.videos.script` (구조화 JSONB) — `block.source_id → sources.metadata.appSpaceVideoId → app space` 경로로 조회

**원칙 정리**: 블록은 **추출·요약·검색에는 Sources만** 참조한다. **도메인 전용 UI 기능**(타임스탬프 재생, 페이지 네비게이션 등)에 한해 App Space를 참조할 수 있으며, 접근 경로는 `sources.metadata`의 app space ID를 통해 한다.

(동일 데이터를 raw_content, metadata.transcript, app space script에 3중 저장하는 방안은 제외.)

---

## 3. 현재 파이프라인 → 마이그레이션 매핑

### 3.1 메타데이터 추출

| 항목 | 현재 | After |
|------|------|-------|
| 트리거 | `getYoutubeMetadataAction` | 유지 (App Space 전용) |
| 저장 | `youtube_app_space.videos` + `channels` | 유지 |
| 블록 properties 업데이트 | youtubeId, youtubeTitle, thumbnail 등 | source_id 추가, youtubeId 제거, 나머지 렌더링 props 유지 |
| 이벤트 | `publishYoutubeMetadataFetched` | 유지하되 source 생성도 트리거 |
| Policy | `ensureVideoSummary` (자동 요약 큐잉) | `ensureSourceSummary` |

**추가 로직**: 메타데이터 추출 완료 후 → **sources 레코드 생성** (Policy로 자동 호출).
이 시점에서 `sources.raw_content`는 아직 비어 있을 수 있음 (스크립트 추출 전).

### 3.2 스크립트 추출

| 항목 | 현재 | After |
|------|------|-------|
| 트리거 | `processVideoScriptAction` | 유지 (App Space에 저장) |
| 저장 | `youtube_app_space.videos.script` (JSONB) | 유지 |
| **추가** | 없음 | **동시에 sources.raw_content 업데이트** (Policy 자동 호출) |
| 블록 properties | `scriptAccessGranted = true` | `sourceContentAccessGranted = true` |
| action_transaction | `extract_script` (org + video) | `extract_content` (org + source) |

**핵심**: 스크립트 추출은 App Space에 구조화 원본을 저장하면서, 동시에 Sources에 정규화 텍스트(타임스탬프 포함 플랫 텍스트)를 저장한다.

### 3.3 요약 추출

| 항목 | 현재 | After |
|------|------|-------|
| 트리거 | `processVideoSummaryAction` 또는 pgmq 큐 | 유지 (큐 패턴 동일) |
| 입력 | `youtube_app_space.videos.script` | `sources.raw_content` |
| AI 호출 | Grok via Helicone | 유지 |
| 저장 | `youtube_app_space.video_summaries` | `source_summaries` |
| 블록 properties | `summaryAccessGrantedLanguages += [lang]` | `sourceSummaryAccessLanguages += [lang]` |
| action_transaction | `extract_summary` (org + video + language) | `extract_summary` (org + source + language) |

### 3.4 Published Page (Readonly)

| 항목 | 현재 | After |
|------|------|-------|
| Auth wrapper | `withPublishedPageSecureAction` (YouTube 전용) | `withPublishedPageSourceSecureAction` (범용) |
| Context | `YoutubeBlockPropertiesVO`, `youtubeId` | `sourceId`, `sourceType` |
| 스크립트 조회 | `processVideoScriptForPublishedPageAction` | Source 기반 범용 action |
| 요약 조회 | `processVideoSummaryForPublishedPageAction` | Source 기반 범용 action |
| 사용 가능 언어 | `getAvailableSummaryLangListForPublishedPageAction` | Source 기반 범용 action |

### 3.5 블록 properties 필드 변경 매핑

```
Before (YouTube 전용):
  youtubeId: string                      → 제거 (sources.metadata.appSpaceVideoId로 이전)
  scriptAccessGranted: boolean           → sourceContentAccessGranted: boolean
  summaryAccessGrantedLanguages: string[] → sourceSummaryAccessLanguages: string[]
  youtubeTitle: string                   → 유지 (렌더링용)
  youtubeThumbnail: string               → 유지 (렌더링용)
  channelName: string                    → 유지 (렌더링용)
  channelThumbnail: string               → 유지 (렌더링용)
  viewCount, likeCount, ...              → 유지 (렌더링용)
  url: string                            → 유지 (유저 입력 URL)
```

---

## 4. DB 스키마 변경 요약

### 4.1 신규 테이블

```sql
-- source_type: 소스 종류 enum
CREATE TYPE source_type AS ENUM (
  'youtube',
  'pdf',
  'x',
  'thread',
  'audio',
  'link'
);

-- sources: URL 기준 추출 캐시
CREATE TABLE sources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url           TEXT NOT NULL,
  url_hash      TEXT GENERATED ALWAYS AS (encode(sha256(url::bytea), 'hex')) STORED,
  source_type   source_type NOT NULL,
  raw_content   TEXT,           -- 검색·요약용 정규화 텍스트 (타임스탬프 포함)
  metadata      JSONB DEFAULT '{}',  -- { appSpace, appSpaceVideoId, videoSlug, ... }
  content_language TEXT,
  extracted_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(url_hash)
);

-- source_summaries: 소스별 다국어 요약
CREATE TABLE source_summaries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id   UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  language    TEXT NOT NULL,
  summary     TEXT NOT NULL,
  keywords    TEXT[],
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_id, language)
);

-- source_action_transactions: org 기반 과금 추적
CREATE TABLE source_action_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL,
  source_id     UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  action_type   TEXT NOT NULL,  -- 'extract_content' | 'extract_summary'
  language      TEXT,           -- extract_summary 시 사용
  created_at    TIMESTAMPTZ DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  UNIQUE NULLS NOT DISTINCT (org_id, source_id, action_type, language)
);
```

### 4.2 기존 테이블 변경

```sql
-- blocks에 source_id FK 추가
ALTER TABLE blocks ADD COLUMN source_id UUID REFERENCES sources(id);
```

### 4.3 데이터 마이그레이션 (youtube_app_space → sources)

```sql
-- videos → sources (raw_content: script.transcript 배열을 "[MM:SS] text\n" 형식으로 변환)
INSERT INTO sources (url, source_type, raw_content, metadata, content_language, extracted_at)
SELECT
  'https://youtube.com/watch?v=' || v.slug,
  'youtube'::source_type,
  CASE
    WHEN v.script IS NOT NULL
         AND v.script ? 'transcript'
         AND jsonb_typeof(v.script->'transcript') = 'array'
         AND jsonb_array_length(v.script->'transcript') > 0
    THEN (
      SELECT string_agg(
        '[' || lpad(floor((seg->>'start')::numeric / 60)::text, 2, '0')
          || ':' || lpad(floor((seg->>'start')::numeric % 60)::text, 2, '0')
          || '] ' || (seg->>'text'),
        E'\n'
        ORDER BY (seg->>'start')::numeric
      )
      FROM jsonb_array_elements(v.script->'transcript') AS seg
    )
    ELSE NULL
  END,
  jsonb_build_object(
    'appSpace', 'youtube',
    'appSpaceVideoId', v.id,
    'videoSlug', v.slug,
    'channelName', c.channel_name
  ),
  v.script_language,
  v.script_extracted_at
FROM youtube_app_space.videos v
LEFT JOIN youtube_app_space.channels c ON v.channel_id = c.id;

-- video_summaries → source_summaries
INSERT INTO source_summaries (source_id, language, summary, keywords)
SELECT s.id, vs.language, vs.summary, vs.keywords
FROM youtube_app_space.video_summaries vs
JOIN youtube_app_space.videos v ON vs.video_id = v.id
JOIN sources s ON s.metadata->>'appSpaceVideoId' = v.id::text;

-- action_transactions → source_action_transactions
INSERT INTO source_action_transactions (org_id, source_id, action_type, language, created_at, completed_at)
SELECT at.org_id, s.id, at.action_type, at.language, at.created_at, at.completed_at
FROM youtube_app_space.action_transactions at
JOIN youtube_app_space.videos v ON at.video_id = v.id
JOIN sources s ON s.metadata->>'appSpaceVideoId' = v.id::text;

-- blocks.source_id 업데이트
UPDATE blocks b
SET source_id = s.id
FROM sources s
WHERE b.block_type = 'youtube'
  AND b.properties->>'youtubeId' IS NOT NULL
  AND s.metadata->>'appSpaceVideoId' = b.properties->>'youtubeId';
```

### 4.4 유지되는 테이블 (App Space)

- `youtube_app_space.videos` — 유지 (도메인 데이터, 구조화 스크립트)
- `youtube_app_space.channels` — 유지 (메타 엔티티)
- `youtube_app_space.video_summaries` — 마이그레이션 후 제거 예정
- `youtube_app_space.action_transactions` — 마이그레이션 후 제거 예정
- `youtube_app_space.summary_jobs` — sources 기반 summary_jobs로 전환

---

## 5. 참고: 현재 파일 → 마이그레이션 대상

| 현재 파일 | 변경 내용 |
|-----------|-----------|
| `youtube-app-space/actions/video/get-youtube-metadata.action.ts` | source 생성 Policy 추가 |
| `youtube-app-space/actions/script/process-video-script.action.ts` | sources.raw_content 동시 저장 Policy 추가 |
| `youtube-app-space/actions/summary/process-video-summary.action.ts` | source_summaries로 저장 대상 변경 |
| `youtube-app-space/actions/secure-action.ts` | Source 기반 auth wrapper 추가 |
| `youtube-app-space/backend/services/script/extract-and-update-script.service.ts` | sources.raw_content 업데이트 추가 |
| `youtube-app-space/backend/services/video-summary/extract-and-update-summary.service.ts` | source_summaries 저장으로 변경 |
| `youtube-app-space/backend/services/video-summary/generate-video-summary.service.ts` | raw_content 기반 입력으로 변경 |
| `youtube-app-space/backend/services/summary/ensure-video-summary.service.ts` | ensureSourceSummary로 전환 |
| `youtube-app-space/backend/services/youtube-metadata-fetched/publish-youtube-metadata-fetched.service.ts` | source 생성 트리거 추가 |
| `youtube-app-space/actions/script/process-video-script-for-published-page.action.ts` | Source 기반 auth로 전환 |
| `youtube-app-space/actions/summary/process-video-summary-for-published-page.action.ts` | Source 기반 auth로 전환 |
| `youtube-app-space/actions/summary/get-available-summary-lang-for-published-page.action.ts` | Source 기반 auth로 전환 |
| `block-management/shared/value-objects/block-properties/youtube.vo.ts` | youtubeId 제거, 범용 플래그로 전환 |
| `youtube-app-space/frontend/hooks/script/use-video-script.ts` | source 기반으로 전환 |
| `youtube-app-space/frontend/hooks/summary/use-process-video-summary.ts` | source 기반으로 전환 |
| `youtube-app-space/frontend/hooks/summary/use-available-summary-languages.ts` | source 기반으로 전환 |
| `block-management/frontend/components/block/block-type/youtube/core/use-youtube-block.business.ts` | source_id 설정 추가 |
