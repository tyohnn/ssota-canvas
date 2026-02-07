# 🔐 Supabase Branching Setup Guide

Supabase Branching + Google OAuth 설정 가이드

---

## 🎯 Branch 전략

```
main → Full OAuth ✅ (Production)
develop → Full OAuth ✅ (Persistent Preview)
feature/* → Build only ❌ (임시 검증용)
```

---

## 📋 One-time Setup

### Step 1: Supabase Secrets 파일 생성

`supabase/.env.secrets` 파일이 이미 생성되어 있습니다 (.gitignore 포함).

### Step 2: Main Project Secrets 설정

```bash
cd apps/web

# Main project 링크 (이미 되어 있음)
supabase link --project-ref uqffxkleuwgeqivimpck

# Secrets 설정
supabase secrets set --env-file supabase/.env.secrets

# 확인
supabase secrets list
```

### Step 3: develop Persistent Branch 생성

```bash
# develop 브랜치 생성 (persistent)
supabase --experimental branches create develop --persistent

# 브랜치 목록 확인
supabase --experimental branches list
# → develop의 BRANCH PROJECT ID 복사
```

### Step 4: develop Branch Secrets 설정

```bash
# develop 브랜치로 전환
supabase link --project-ref <develop-branch-project-id>

# Secrets 설정
supabase secrets set --env-file supabase/.env.secrets

# 확인
supabase secrets list

# Main으로 복귀
supabase link --project-ref uqffxkleuwgeqivimpck
```

---

## 🔧 Vercel 환경변수 설정

### Main Project (Production)

```
Vercel Dashboard → ssota → Settings → Environment Variables

NEXT_PUBLIC_SUPABASE_URL
Value: https://uqffxkleuwgeqivimpck.supabase.co
Environment: Production

NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Main Project Anon Key]
Environment: Production
```

### develop Branch (Preview)

```
NEXT_PUBLIC_SUPABASE_URL
Value: https://uqffxkleuwgeqivimpck-preview-develop.supabase.co
Environment: Preview
Git Branch: develop

NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [develop Branch Anon Key]
Environment: Preview
Git Branch: develop
```

### feature/* Branches (Preview - Optional)

```
# Option A: develop credentials 공유 (추천)
NEXT_PUBLIC_SUPABASE_URL
Value: https://uqffxkleuwgeqivimpck-preview-develop.supabase.co (develop 사용!)
Environment: Preview
Git Branch: feature/*

# Option B: 빌드만 (OAuth 불필요)
# 환경변수 설정 안 함
# → Google OAuth 에러 발생하지만 빌드는 성공
```

---

## 🔍 Google Console Redirect URLs

### DEV Client

```
승인된 리디렉션 URI:
✅ http://127.0.0.1:54321/auth/v1/callback (로컬)
✅ https://uqffxkleuwgeqivimpck-preview-develop.supabase.co/auth/v1/callback (develop)
```

### PROD Client

```
승인된 리디렉션 URI:
✅ https://uqffxkleuwgeqivimpck.supabase.co/auth/v1/callback (main)
```

---

## 🚀 일상 워크플로우

### Feature 개발 (로컬 테스트)

```bash
# 1. Feature 브랜치 생성
git checkout -b feature/new-feature

# 2. 로컬 개발
pnpm dev
# → http://localhost:3000
# → Google OAuth 작동 (로컬 Supabase)

# 3. Commit & Push
git push origin feature/new-feature
# → Vercel: 빌드 검증만
# → Supabase: (OAuth 없어도 됨)

# 4. PR 생성 & Review
# → 빌드 성공 확인
# → 코드 리뷰
# → Merge to develop
```

### DB 스키마 변경 (develop 테스트)

```bash
# 1. develop에서 작업
git checkout develop

# 2. 스키마 변경
vim src/db/schema.ts
pnpm db:migrate

# 3. 로컬 테스트
pnpm supabase:reset
pnpm dev

# 4. Commit & Push
git push origin develop
# → develop Preview Branch 자동 배포
# → Google OAuth 작동 ✅
# → 완전한 기능 테스트 가능

# 5. Preview URL에서 테스트
# https://ssota-git-develop-ssota-labs.vercel.app

# 6. 테스트 완료 후 main Merge
```

---

## 🆘 Troubleshooting

### "Google OAuth 에러 (feature 브랜치)"

**정상입니다!** Feature 브랜치는 빌드 검증용입니다.

```
해결: 로컬에서 테스트하세요
pnpm dev → http://localhost:3000
```

### "develop에서 Google OAuth 에러"

```bash
# 1. develop secrets 확인
supabase link --project-ref <develop-project-id>
supabase secrets list

# 2. Secrets 재설정
supabase secrets set --env-file supabase/.env.secrets

# 3. Google Console Redirect URL 확인
https://uqffxkleuwgeqivimpck-preview-develop.supabase.co/auth/v1/callback
```

### "Supabase에 테이블이 없음"

```bash
# 1. GitHub Integration 확인
Dashboard → Settings → Integrations → GitHub

# 2. 마이그레이션 로그 확인
Dashboard → Branches → develop → Deployments

# 3. 수동으로 적용 (필요시)
supabase db push --project-ref <develop-project-id>
```

---

## ✅ Setup Checklist

### One-time Setup
- [ ] Main Project secrets 설정
- [ ] develop Persistent Branch 생성
- [ ] develop secrets 설정
- [ ] Vercel 환경변수 설정 (main, develop)
- [ ] Google Console Redirect URLs 추가

### Per Feature Branch
- [ ] 없음! (자동으로 빌드 검증만)

---

**최종 전략: Pragmatic Branching!** 🎉

- Feature → Build + Code Review
- develop → Full Testing
- main → Production

간단하고 효율적입니다!

---

## 🖥️ 로컬에서 Edge Function 실행 (Summary Queue 등)

한 번에 **Supabase 스택 기동 + Edge Function 서빙**까지 하려면:

```bash
cd apps/web
pnpm supabase:dev
```

- `supabase start` → `supabase functions serve --env-file supabase/.env.local` 순으로 동작합니다. **시드**는 `supabase start` 시 DB가 초기화될 때 config.toml(`[db.seed] enabled = true`)에 따라 `seed.sql`이 한 번 실행됩니다.
- env는 **supabase/.env.local** (Edge Function 전용)를 사용합니다. **supabase/.env.example** 을 복사해 **supabase/.env.local** 로 두고 값을 채우면 됩니다.
- 시드를 다시 넣고 싶을 때는 스택이 켜진 상태에서 `pnpm exec supabase db reset`을 실행하면 됩니다(마이그레이션 + 시드 재적용, 로컬 DB는 초기화됨).

**Edge Function에 필요한 env (로컬)** — `supabase/.env.example` 참고

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_APP_URL` | 앱 URL (예: `http://localhost:3000`) |
| `INTERNAL_API_SECRET` | 앱 .env.local 과 동일한 내부 API 시크릿 |
| `SUPABASE_URL` | 로컬이면 `http://127.0.0.1:54321` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | 로컬에서는 **supabase functions serve 가 자동 주입**. .env.local 에 넣지 않아도 됨 (넣으면 "skipping" 로그만 나옴) |

팀원: `cp supabase/.env.example supabase/.env.local` 후 위 변수만 채우면 `pnpm supabase:dev` 로 동작합니다. (supabase/.env.local 은 .gitignore 대상)

---

## 📋 Dashboard에서 추가해야 하는 것 (순서)

로컬·Remote 공통으로 **UI 대시보드에서** 설정할 때는 아래 순서를 지키면 됩니다.

| 순서 | 항목 | 설명 |
|------|------|------|
| 1 | 마이그레이션 1차 적용 | `20260205140000` (pgmq extension + summary_queue) 적용 |
| 2 | (Remote만) 수동 확인 | 필요 시 **Database → Extensions**에서 pgmq 확인, **Expose Queues via PostgREST** 토글 |
| 3 | 마이그레이션 2차 적용 | `20260205140100` (pgmq_public, summary_jobs, pg_cron 등) 적용 |
| 4 | **Edge Function 배포** | `process-summary-queue` 함수를 **먼저** 배포. Cron 설정 전에 필수. (로컬: `pnpm supabase:dev` 또는 배포 후) |
| 5 | **Cron** | 마이그레이션에 이미 등록됨. 배포 환경만 **한 번** `config.edge_function_cron_config` 에 INSERT (base_url, anon_key). 로컬은 seed에서 넣음. |
| 6 | **Edge Function Secrets** (Remote) | `process-summary-queue`가 쓰는 `NEXT_PUBLIC_APP_URL`, `INTERNAL_API_SECRET` 을 **Supabase**에 설정. Dashboard → Project Settings → Edge Functions → **Secrets** 또는 `supabase secrets set NEXT_PUBLIC_APP_URL=... INTERNAL_API_SECRET=...` |
| 7 | 앱 환경변수 (앱 호출 시) | 앱(Vercel 등)에 `INTERNAL_API_SECRET`, `NEXT_PUBLIC_APP_URL` 설정. Edge Function이 `POST {APP_URL}/api/youtube/process-summary-job` 호출 시 사용. |

**요약**: Cron을 쓰려면 **먼저 Edge Function을 배포한 뒤**, Cron Job에서 그 Edge Function을 선택해야 합니다.

---

## 🌐 Remote(Production/Preview)에서 필요한 UI·수동 설정

로컬에서는 **config.toml + migration만**으로 대시보드를 거의 건드리지 않고 개발할 수 있습니다.
**Remote**(Supabase 호스팅: main, develop 브랜치 등)에서는 마이그레이션이 자동 적용된 뒤에도, 아래 항목은 **Dashboard에서 직접 설정**이 필요할 수 있습니다.

### 1. Queues API (Summary Queue 사용 시) — 2단계 마이그레이션

Summary Queue 관련 마이그레이션은 **두 번** 나뉘어 적용됩니다.

1. **1차** (`20260205140000_create_youtube_summary_queue_extension.sql`): **pgmq extension** 활성화 + **summary_queue** 생성만 수행.
2. **수동**: Remote(dev/main)에서는 이 시점에서 필요한 Dashboard 설정을 합니다 (예: **Database → Extensions**에서 pgmq 확인, **Expose Queues via PostgREST** 토글 등).
3. **2차** (`20260205140100_create_youtube_summary_queue_public_schema.sql`): `pgmq_public` 스키마·래퍼 함수, `summary_jobs` 테이블, RLS, pg_cron 확장이 적용됩니다.

로컬에서는 `supabase db reset` 또는 순차 push 시 1차 → 2차가 연속 실행되므로 별도 수동 단계 없이 동작합니다. Remote에서 GitHub 연동으로 자동 적용 시에는 1차 적용 후 수동 설정할 시간을 두고, 2차는 그다음 배포/푸시에 포함되면 됩니다.

### 2. Cron Job (Summary Queue 워커) — 마이그레이션에 포함, 환경마다 한 번 설정

마이그레이션에 **pg_cron + pg_net**으로 `invoke-process-summary-queue` 가 등록되어 있고, **config.edge_function_cron_config** 에서 base_url/anon_key를 읽어 Edge Function을 HTTP로 호출합니다. **환경마다 한 번만** 설정하면 됩니다.

- **로컬**: seed.sql에서 `http://kong:8000` 으로 한 번 넣음. 별도 설정 없음.
- **배포 환경**: 마이그레이션에는 INSERT가 없으므로, 배포 후 **한 번** 아래 SQL 실행 (Dashboard → SQL Editor 또는 서비스 역할로).

```sql
INSERT INTO config.edge_function_cron_config (id, base_url, anon_key)
VALUES (1, 'https://<project-ref>.supabase.co', '<anon key>')
ON CONFLICT (id) DO UPDATE SET base_url = EXCLUDED.base_url, anon_key = EXCLUDED.anon_key;
```

Cron이 호출하는 앱 API(`/api/youtube/process-summary-job`)가 동작하려면 **앱(Vercel 등) 환경변수**에 다음이 필요합니다.

- **INTERNAL_API_SECRET**: 내부 API 인증용 시크릿 (Cron/Edge Function에서 `X-Internal-Secret` 헤더로 전달).
- **NEXT_PUBLIC_APP_URL** (또는 앱 베이스 URL): Edge Function이 `POST {APP_URL}/api/youtube/process-summary-job` 호출 시 사용.

### 3. GitHub 연동 (마이그레이션 자동 적용)

Remote 브랜치에 마이그레이션이 자동 적용되려면:

- **Dashboard** → **Settings** → **Integrations** → **GitHub** 에서 저장소 연동.
- **Branches** 에서 해당 브랜치가 연결되어 있는지 확인.
- 마이그레이션 실패 시 **Branches → [브랜치] → Deployments** 에서 로그 확인 후, 필요 시 `supabase db push --project-ref <project-id>` 로 수동 적용.

### 요약

| 환경     | 설정 방식 |
|----------|-----------|
| **로컬** | `config.toml` + `supabase/migrations` 만으로 동작 (UI 최소 사용) |
| **Remote** | 마이그레이션 자동 적용 후, 위 1~3 항목 중 필요한 것만 **Dashboard에서 수동 설정** (Cron 사용 시 앱 env에 `INTERNAL_API_SECRET`, `NEXT_PUBLIC_APP_URL` 설정) |

---

## YouTube Summary Queue Cron (선택)

Summary Queue 사용 시 Cron은 **마이그레이션**에 포함되어 있습니다 (5초마다 config.edge_function_cron_config 의 URL로 Edge Function HTTP 호출). 로컬은 seed에서 config 행이 들어가고, **배포 환경은 배포 후 위 2번처럼 config INSERT 한 번** 실행하면 됩니다.  
대시보드(Integrations → Cron)에서는 이 job이 "database function"으로 표시될 수 있는데, pg_cron이 SQL로만 등록되기 때문이며 실제 동작은 **HTTP Request**(net.http_post)와 동일합니다.

- **앱 측 환경변수**(Vercel 등): `INTERNAL_API_SECRET`, `NEXT_PUBLIC_APP_URL`. Edge Function이 `POST {APP_URL}/api/youtube/process-summary-job` 호출 시 사용.
- **Edge Function이 쓰는 값**: Remote는 **Supabase Dashboard → Project Settings → Edge Functions → Secrets** (또는 `supabase secrets set`)에 `NEXT_PUBLIC_APP_URL`, `INTERNAL_API_SECRET` 설정. 로컬은 `pnpm supabase:dev` (내부적으로 `--env-file supabase/.env.local` 사용). supabase/.env.example 을 supabase/.env.local 로 복사 후 값 설정. **로컬에서 Edge Function은 Docker 안에서 실행되므로**, Next.js(호스트의 3000 포트)를 가리키려면 `NEXT_PUBLIC_APP_URL=http://host.docker.internal:3000` 으로 두어야 함. `localhost:3000` 이면 Connection refused 발생.

---

## 🚀 Edge Functions 자동 배포 (CI/CD)

Edge Functions는 GitHub Actions를 통해 자동으로 배포됩니다.

### 배포 전략

```
dev branch  ──────► Staging Environment (xtknhwadrjyosghqseoe)
    ↓
    PR (with release label)
    ↓
main branch ──────► Production Environment
```

### 자동 배포 워크플로우

1. **Staging 배포** (`.github/workflows/deploy-edge-functions-staging.yml`)
   - Trigger: `dev` 브랜치에 push
   - 경로: `apps/web/supabase/functions/**` 변경 시
   - 환경: Staging Supabase Project

2. **Production 배포** (`.github/workflows/deploy-edge-functions-production.yml`)
   - Trigger: `main` 브랜치에 push 또는 release tag (`v*.*.*`)
   - 경로: `apps/web/supabase/functions/**` 변경 시
   - 환경: Production Supabase Project

### 필요한 GitHub Secrets

Edge Functions 자동 배포를 위해 다음 secrets를 설정해야 합니다:

```bash
# Supabase
SUPABASE_ACCESS_TOKEN              # Supabase CLI access token
SUPABASE_STAGING_PROJECT_ID        # Staging project ID (xtknhwadrjyosghqseoe)
SUPABASE_PRODUCTION_PROJECT_ID     # Production project ID

# App URLs
STAGING_APP_URL                    # Staging app URL (e.g., https://staging.yourapp.com)
PRODUCTION_APP_URL                 # Production app URL (e.g., https://yourapp.com)

# API Secrets
STAGING_INTERNAL_API_SECRET        # Staging internal API secret
PRODUCTION_INTERNAL_API_SECRET     # Production internal API secret
```

### 상세 가이드

자세한 설정 및 사용 방법은 다음 문서를 참고하세요:

- **[Setup Checklist](../../docs/deployment/edge-functions-setup-checklist.md)** - 초기 설정 단계별 가이드
- **[Deployment Guide](../../docs/deployment/edge-functions-deployment.md)** - 배포 프로세스 상세 설명
- **[Functions README](./functions/README.md)** - Edge Functions 개요 및 사용법

### 수동 배포 (필요시)

자동 배포 외에도 로컬에서 수동으로 배포할 수 있습니다:

```bash
cd apps/web

# Staging에 배포
supabase functions deploy --project-ref xtknhwadrjyosghqseoe

# Production에 배포 (project ID 확인 필요)
supabase functions deploy --project-ref YOUR_PRODUCTION_PROJECT_ID

# Secrets 설정
supabase secrets set \
  NEXT_PUBLIC_APP_URL="https://yourapp.com" \
  INTERNAL_API_SECRET="your-secret" \
  --project-ref YOUR_PROJECT_ID
```

