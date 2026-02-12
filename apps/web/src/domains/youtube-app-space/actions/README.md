# YouTube App Space Actions

YouTube 블록의 메타데이터 추출 및 관련 서버 액션들입니다.

**스크립트/요약 추출·조회는 source-management 도메인에서 처리합니다.**  
이 문서는 YouTube App Space가 담당하는 부분과 전체 흐름을 설명합니다.

## 목차

1. [개요](#개요)
2. [YouTube App Space 담당](#youtube-app-space-담당)
3. [Source Management 연동](#source-management-연동)
4. [데이터 흐름](#데이터-흐름)

---

## 개요

### 역할 분리

| 도메인 | 담당 |
|--------|------|
| **youtube-app-space** | 메타데이터 추출 (`getYoutubeMetadataAction`), `youtube_app_space.videos` / `channels` 저장, `videos.script` dual-write |
| **source-management** | 스크립트 추출 (`extractSourceContent`), 요약 생성 (`ensureSourceSummary`), 큐/잡 처리, `source_action_transactions` |

### 블록 → 소스 참조

- `blocks.source_id` (FK → sources.id)
- 블록 properties: `sourceContentAccessGranted`, `sourceSummaryAccessLanguages` (렌더링/캐시용)

---

## YouTube App Space 담당

### `getYoutubeMetadataAction`

- **용도**: YouTube URL 입력 시 메타데이터(fetch) 및 소스 연결
- **흐름**:
  1. YouTube API로 메타데이터 조회
  2. `youtube_app_space.videos` / `channels` 저장
  3. `linkSourceToBlock`으로 `blocks.source_id` 설정
  4. `publishYoutubeMetadataFetched` 이벤트 발행 → source-management의 `ensureSourceJobService` 호출

---

## Source Management 연동

### 스크립트

- **조회**: `useSourceContent` (source-management)
- **추출**: `extractSourceContentAction` (source-management)
- **Published Page**: `getSourceContentForPublishedPageAction`

### 요약

- **조회**: `useSourceSummary`, `useSourceSummaryLanguages` (source-management)
- **추출**: `processSourceSummaryAction` (source-management)
- **Published Page**: `getSourceSummaryForPublishedPageAction`, `getSourceSummaryLanguagesForPublishedPageAction`

### 큐/잡

- 메타데이터 직후: `ensureSourceJobService` → `source_job_queue` enqueue
- Edge Function: `process-source-job-queue` → `POST /api/source/process-job`
- 처리: `processSourceJobService` (스크립트 추출 → 요약 생성 → block properties 업데이트)

---

## 데이터 흐름

```
YouTube URL 입력
  ↓
getYoutubeMetadataAction
  ↓
youtube_app_space.videos + linkSourceToBlock (source_id)
  ↓
publishYoutubeMetadataFetched
  ↓
ensureSourceJobService → source_job_queue
  ↓
Edge Function → POST /api/source/process-job
  ↓
processSourceJobService
  - extractSourceContent (sources.raw_content)
  - ensureSourceSummary (source_summaries)
  - source_action_transactions, block.properties 업데이트
```

---

## 참고

- [source-management docs](../../source-management/docs/plan.md)
- [Secure Action Pattern](./secure-action.ts)
