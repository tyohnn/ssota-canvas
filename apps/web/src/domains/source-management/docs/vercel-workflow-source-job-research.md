# 소스 요약 파이프라인: Vercel Workflow 전환 리서치 및 계획

소스 요약(추출 → 요약 생성)이 현재 **Supabase Queue(pgmq) + pg_cron + Edge Function**으로 동작하고 있다.  
[Vercel Workflow](https://vercel.com/workflow)(Workflow DevKit) 도입 시 로직 변화와 인프라 간소화 방안을 정리한 문서다.

---

## 1. 현재 구조 (As-Is)

### 1.1 전체 흐름

```
[사용자] 요약 요청 (processSourceSummaryAction / extractSourceContentAction)
    → ensureSourceJobService (요약 있으면 스킵, 없으면 잡 생성)
    → createSourceJobService: source_jobs 저장 + pgmq.send('source_job_queue', { jobId, blockId, sourceId, language })
    → [대기]

[pg_cron 5초마다]
    → Edge Function 'process-source-job-queue' HTTP 호출

[Edge Function] (Supabase Deno)
    → pgmq.read('source_job_queue', n: 20, visibility_timeout: 60s)
    → source_jobs.status = 'processing'
    → POST /api/source/process-job (jobId, msgId) × N (병렬)

[Next.js] POST /api/source/process-job
    → processSourceJobService (추출 → startSummarizing → ensureSourceSummary → complete)
    → 완료 시 pgmq.archive(msgId) 또는 delete
```

### 1.2 사용 중인 컴포넌트

| 컴포넌트 | 역할 | 위치 |
|----------|------|------|
| **pgmq** | `source_job_queue` — jobId 메시지 적재·읽기·archive/delete | Supabase DB (pgmq_public 스키마) |
| **pg_cron** | 5초마다 Edge Function URL 호출 | `cron.schedule('invoke-process-source-job-queue', '5 seconds', ...)` |
| **config.edge_function_cron_config** | Cron이 호출할 base_url, anon_key | config 스키마 |
| **Edge Function** | 큐에서 메시지 읽기 → 앱 API로 jobId 전달 | `supabase/functions/process-source-job-queue/` |
| **Next.js API** | 실제 처리: processSourceJobService | `app/api/source/process-job/route.ts` |
| **Queue Adapter** | pgmq.send 래핑 | `domains/queue/implementations/supabase-pgmq.queue-adapter.ts` |

### 1.3 관련 코드 경로

- **트리거**: `actions/summary/process-source-summary.action.ts`, `actions/source/extract-source-content.action.ts` → `ensureSourceJobService` → `createSourceJobService`
- **큐 적재**: `create-source-job.service.ts` — `queueAdapter.send('source_job_queue', { jobId, ... })`
- **잡 처리**: `process-source-job/route.ts` → `processSourceJobService` (추출, ensureSourceSummary, block.properties 갱신)
- **마이그레이션**: `20260211160000_create_source_jobs.sql` (source_job_queue, source_jobs, cron), `20260211190100_unschedule_process_summary_queue_cron.sql` (legacy summary cron 제거)

### 1.4 현재 구조의 이슈

- **레이어 다수**: 큐 → Cron → Edge Function → App API 4단계. 배포·환경 변수·디버깅 시 추적이 번거로움.
- **설정 분산**: Supabase(Cron, Edge env), Vercel(앱 URL, INTERNAL_API_SECRET), config 테이블이 서로 의존.
- **재시도/가시성**: pgmq visibility_timeout 기반 재시도만 있고, 단계별 관찰·재실행은 직접 구현 필요.

---

## 2. Vercel Workflow(Workflow DevKit) 개요

### 2.1 특징

- **Durable workflow**: 함수 실행이 중간에 중단되어도 상태가 유지되고, 재개 시 이어서 실행.
- **"use workflow" / "use step"**: 디렉티브로 워크플로·스텝 단위로 영속화·재시도 적용.
- **트리거**: HTTP/이벤트로 워크플로 함수 한 번 호출하면, 내부 스텝은 플랫폼이 실행·재시도·관찰.
- **인프라**: 큐·별도 워커·Cron 불필요. Vercel 배포만으로 동작.

참고: [Vercel Workflow](https://vercel.com/workflow), npm 패키지 `workflow`.

### 2.2 소스 요약에 적용 시 개념

- **한 번의 트리거**: 사용자가 "요약 추출" 요청 시, **큐에 넣지 않고** Workflow 트리거 API를 호출해 `runSourceSummaryWorkflow({ jobId, blockId, sourceId, orgId, language })` 시작.
- **워크플로 내부**: 기존 `processSourceJobService`에 해당하는 단계를 그대로 호출하되, 각 단계를 "use step"으로 감싸서 추출 → 요약 → 완료가 한 흐름으로 실행되고, 실패 시 해당 스텝만 재시도.
- **제거 가능**: pgmq 큐, pg_cron, Edge Function `process-source-job-queue`, config.edge_function_cron_config.

---

## 3. 전환 시 로직 변화

### 3.1 트리거 변경

| 구분 | 현재 | Workflow 전환 후 |
|------|------|------------------|
| 요약 없을 때 | createSourceJobService → queueAdapter.send → 대기 | Workflow 트리거 API 호출 (같은 jobId/blockId/sourceId/orgId/language 전달) |
| 요약 이미 있을 때 | ensureSourceJobService에서 completed job 생성 후 반환 | 동일 (변경 없음) |

### 3.2 실행 경로

| 구분 | 현재 | Workflow 전환 후 |
|------|------|------------------|
| 실행 주체 | Cron → Edge → App API | Workflow 런타임이 워크플로 함수 실행 |
| 단계 영속화 | 없음 (한 번의 POST가 끝까지 수행) | 스텝 단위 자동 영속·재시도 |
| 타임아웃 | 서버리스/Edge 제한 있음 | Workflow는 장시간 실행 지원 (문서 기준 24h 등) |

### 3.3 유지하는 것

- **도메인 로직**: `processSourceJobService`, `extractSourceContent`, `ensureSourceSummary`, `createSourceActionTransaction`, `updateBlockProperties` 등은 그대로 둠. 워크플로가 이 함수들을 **호출**하는 형태.
- **DB·Realtime**: `source_jobs` 테이블, Realtime publication, 상태 값(pending → processing → completed) 흐름 유지. UI는 기존처럼 `source_jobs` 구독으로 "추출 중 / 요약 중" 표시 가능.
- **잡 생성 정책**: `ensureSourceJobService`의 “이미 요약 있으면 completed job만 생성”, “없으면 잡 생성” 로직 유지. 단 “잡 생성” 후 큐 send 대신 Workflow 트리거로 대체.

---

## 4. 인프라 간소화 요약

| 항목 | 현재 | 전환 후 |
|------|------|---------|
| 큐 | pgmq `source_job_queue` (send/read/archive/delete) | 사용 안 함 |
| Cron | pg_cron 5초 + Edge Function 호출 | 사용 안 함 |
| Edge Function | process-source-job-queue | 제거 |
| config | edge_function_cron_config (base_url, anon_key) | Cron 제거 시 불필요 |
| 앱 API | POST /api/source/process-job | 워크플로 내부에서 동일 서비스 호출 (route는 제거 또는 내부 전용으로 유지) |
| Queue Adapter | SupabasePgmqQueueAdapter | source-management 도메인에서는 미사용 (다른 도메인에서만 사용 시 유지) |

---

## 5. 마이그레이션 계획

### 5.1 전제 조건

- Vercel 배포 환경에서 Workflow DevKit 사용 가능 여부 확인.
- 기존 `source_jobs` + Realtime UX 유지 여부 결정 (유지 권장).

### 5.2 구현 단계 (개요)

1. **Workflow 함수 추가**
   - `runSourceSummaryWorkflow(payload)` 형태의 워크플로 정의.
   - 내부에서 기존 `processSourceJobService`에 넘기는 인자와 동일한 입력으로 호출 (jobId, blockId, sourceId, orgId, language 등). 필요 시 `archiveQueueMessage`/`deleteQueueMessage` 대신 “완료만 반영”하는 래퍼 사용.

2. **트리거 진입점 변경**
   - `ensureSourceJobService` 이후, `createSourceJobService`에서 `queueAdapter.send` 호출하는 대신 **Vercel Workflow 트리거 API** 호출 (같은 jobId 등 전달).
   - `process-source-summary.action.ts`, `extract-source-content.action.ts`에서 사용하는 ensure/create 경로가 새 트리거를 쓰도록 수정.

3. **제거·정리**
   - Edge Function `process-source-job-queue` 배포 중단 및 삭제.
   - pg_cron `invoke-process-source-job-queue` unschedule 마이그레이션 적용.
   - `config.edge_function_cron_config`는 다른 Cron이 사용하지 않으면 제거 검토.
   - `/api/source/process-job` route는 “Workflow에서만 호출”하거나, Workflow가 직접 서비스 레이어를 호출하도록 바꾼 뒤 route 제거 가능.

4. **Queue Adapter**
   - source-management에서만 쓰였다면 제거. youtube-metadata-fetched 등 다른 도메인에서 사용 중이면 유지.

5. **문서·배포**
   - `SUPABASE_SETUP.md`, `EDGE_FUNCTIONS_CICD_SETUP.md` 등에서 process-source-job-queue·Cron 관련 절차 제거 또는 “Legacy”로 표기.
   - 배포 순서: Workflow 트리거 + 새 코드 배포 → Cron unschedule → Edge Function 제거.

### 5.3 롤백

- Workflow 트리거 대신 다시 `queueAdapter.send` 호출하도록 코드 되돌리고, Cron + Edge Function 다시 활성화하면 기존 구조로 복귀 가능. pgmq 큐와 source_jobs 테이블은 그대로 두었으므로 데이터 호환 유지.

---

## 6. 참고 자료

- [Vercel Workflow](https://vercel.com/workflow) — 공식 소개
- `plan.md` §1.4 — 기존 “요약 큐잉: pgmq 큐 패턴 유지” 설명 (전환 시 이 패턴 대체)
- `apps/web/supabase/migrations/20260211160000_create_source_jobs.sql` — 현재 큐·Cron·source_jobs 정의
