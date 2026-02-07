# Supabase Edge Functions Deployment Guide

## 📖 Overview

이 가이드는 `dev`와 `main` 브랜치를 기반으로 Supabase Edge Functions를 자동 배포하는 방법을 설명합니다.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Git Branch Strategy                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  dev branch  ──────────────►  Staging Environment          │
│      │                          (Canary Releases)           │
│      │                                                      │
│      └─► PR with labels                                    │
│             │                                               │
│             ▼                                               │
│  main branch ──────────────►  Production Environment       │
│                                (Stable Releases)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Edge Function Deployment Flow                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Code Push (dev/main)                                   │
│      │                                                      │
│      ▼                                                      │
│  2. GitHub Actions Trigger                                 │
│      │                                                      │
│      ▼                                                      │
│  3. Deploy Functions                                       │
│      ├─► Deploy all functions in supabase/functions/      │
│      └─► Set environment secrets                           │
│      │                                                      │
│      ▼                                                      │
│  4. Verification                                           │
│      └─► Test deployment                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Deployment Workflows

### 1. Staging Deployment (dev → Staging)

**Trigger:** Push to `dev` branch with changes in:
- `apps/web/supabase/functions/**`
- `apps/web/supabase/config.toml`

**Workflow:** `.github/workflows/deploy-edge-functions-staging.yml`

**Environment:**
- Supabase Project: Staging (from `config.toml`)
- App URL: Staging URL
- Purpose: Testing and validation

**Steps:**
1. Checkout code
2. Deploy Edge Functions to staging project
3. Set environment secrets for staging
4. Verify deployment

### 2. Production Deployment (main → Production)

**Trigger:**
- Push to `main` branch with changes in Edge Functions
- Release tag creation (`v*.*.*`)

**Workflow:** `.github/workflows/deploy-edge-functions-production.yml`

**Environment:**
- Supabase Project: Production
- App URL: Production URL
- Purpose: Live production environment

**Steps:**
1. Checkout code
2. Deploy Edge Functions to production project
3. Set environment secrets for production
4. Verify deployment
5. Notify success

## ⚙️ Configuration

### Supabase config.toml

Edge Function 설정은 `apps/web/supabase/config.toml`에서 관리합니다:

```toml
[remotes.staging]
project_id = "xtknhwadrjyosghqseoe"

# 추가 예정: production remote
# [remotes.production]
# project_id = "your-production-project-id"

# Edge Function 설정
[edge_runtime]
enabled = true
policy = "per_worker"
inspector_port = 8083
deno_version = 2

# 함수별 설정 (예시)
# [functions.process-summary-queue]
# verify_jwt = false  # JWT 검증 비활성화 (필요한 경우)
```

### GitHub Secrets Configuration

다음 secrets를 GitHub Repository에 설정해야 합니다:

#### Required Secrets

1. **SUPABASE_ACCESS_TOKEN**
   - Supabase CLI/Management API 인증용 **Personal Access Token** (프로젝트가 아닌 **계정** 단위)
   - **생성 위치 (대시보드)**  
     - **직접 URL**: [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)  
     - **메뉴 경로**: Supabase 대시보드 로그인 → 우측 상단 **Account**(프로필/계정) → **Access Tokens** → **Generate new token**
   - **로컬에서 이미 로그인한 경우**: 터미널에서 `supabase login` 후 토큰이 저장된 경로 확인  
     - `~/.supabase/access-token` (네이티브 credential 저장이 없을 때)  
     - 또는 OS별 credential 저장소에 저장됨
   - **참고**: 프로젝트별 **Settings → API**의 anon key/service role key와는 다름. 이 토큰은 CLI 배포·Management API용입니다.

2. **SUPABASE_STAGING_PROJECT_ID**
   - Staging 환경의 Supabase Project ID
   - 예: `xtknhwadrjyosghqseoe`

3. **SUPABASE_PRODUCTION_PROJECT_ID**
   - Production 환경의 Supabase Project ID

4. **STAGING_APP_URL**
   - Staging 환경의 앱 URL
   - 예: `https://staging.yourapp.com` 또는 `https://preview-branch.vercel.app`

5. **PRODUCTION_APP_URL**
   - Production 환경의 앱 URL
   - 예: `https://yourapp.com`

6. **STAGING_INTERNAL_API_SECRET**
   - Staging 환경의 내부 API 인증 시크릿
   - Edge Function이 앱 API를 호출할 때 사용

7. **PRODUCTION_INTERNAL_API_SECRET**
   - Production 환경의 내부 API 인증 시크릿

### Setting GitHub Secrets

```bash
# GitHub CLI를 사용한 설정
gh secret set SUPABASE_ACCESS_TOKEN
gh secret set SUPABASE_STAGING_PROJECT_ID
gh secret set SUPABASE_PRODUCTION_PROJECT_ID
gh secret set STAGING_APP_URL
gh secret set PRODUCTION_APP_URL
gh secret set STAGING_INTERNAL_API_SECRET
gh secret set PRODUCTION_INTERNAL_API_SECRET
```

또는 GitHub UI에서:
1. Repository → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. 각 secret 추가

## 📦 Edge Function Structure

```
apps/web/supabase/functions/
├── process-summary-queue/
│   ├── index.ts           # Main function handler
│   ├── deno.json          # Deno configuration
│   └── deno.lock          # Dependencies lock file
└── [other-functions]/
```

### Function Configuration

각 Edge Function은 `config.toml`에서 개별 설정 가능:

```toml
[functions.process-summary-queue]
# JWT 검증 비활성화 (webhook 등에 필요)
verify_jwt = false

# Import map 위치 지정
# import_map = "./import_map.json"
```

## 🔐 Environment Variables & Secrets

### Edge Function에서 사용하는 환경 변수

1. **NEXT_PUBLIC_APP_URL**
   - Edge Function이 앱 API를 호출할 때 사용
   - GitHub Actions에서 자동 설정

2. **INTERNAL_API_SECRET**
   - 내부 API 인증용 시크릿
   - GitHub Actions에서 자동 설정

3. **SUPABASE_URL** (자동 주입)
   - Supabase에서 자동으로 주입
   - 함수 내에서 `Deno.env.get("SUPABASE_URL")`로 접근

4. **SUPABASE_SERVICE_ROLE_KEY** (자동 주입)
   - Supabase에서 자동으로 주입
   - 함수 내에서 `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")`로 접근

### Local Development

로컬 개발 시 `apps/web/supabase/.env.local` 사용:

```bash
# apps/web/supabase/.env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
INTERNAL_API_SECRET=your-local-secret
```

로컬 실행:
```bash
cd apps/web
pnpm supabase:dev
```

## 🧪 Testing

### Local Testing

```bash
# 1. Supabase 로컬 환경 시작
cd apps/web
pnpm supabase:dev

# 2. Edge Function 테스트
curl -X POST http://127.0.0.1:54321/functions/v1/process-summary-queue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"test": "data"}'
```

### Staging Testing

Staging 배포 후:

```bash
# Staging Edge Function 호출
curl -X POST https://xtknhwadrjyosghqseoe.supabase.co/functions/v1/process-summary-queue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAGING_ANON_KEY" \
  -d '{"test": "data"}'
```

## 🔄 Deployment Process

### Staging 배포 (dev branch)

1. **Feature 브랜치에서 작업**
   ```bash
   git checkout -b feat/edge-function-update
   # Edge Function 수정
   git add apps/web/supabase/functions/
   git commit -m "feat: update edge function"
   git push origin feat/edge-function-update
   ```

2. **dev로 PR 생성 및 머지**
   - PR 생성
   - 리뷰 및 승인
   - `dev` 브랜치로 머지

3. **자동 배포**
   - GitHub Actions가 자동으로 Staging에 배포
   - 배포 완료 후 Summary 확인

4. **테스트**
   - Staging 환경에서 기능 테스트
   - 문제 발견 시 수정 후 반복

### Production 배포 (main branch)

1. **dev에서 main으로 PR 생성**
   ```bash
   # Staging 테스트 완료 후
   git checkout dev
   git pull origin dev
   # main으로 PR 생성
   ```

2. **Release Label 추가** (선택사항)
   - `release:patch` - 버그 수정
   - `release:minor` - 새 기능
   - `release:major` - Breaking changes

3. **PR 머지**
   - 리뷰 및 승인
   - `main` 브랜치로 머지

4. **자동 배포**
   - GitHub Actions가 Production에 배포
   - Release 자동 생성 (label 사용 시)

5. **검증**
   - Production 환경에서 기능 확인
   - 모니터링 체크

## 🛠️ Manual Deployment

필요시 수동으로 배포할 수 있습니다:

### Staging 수동 배포

```bash
cd apps/web

# Staging에 배포
supabase functions deploy \
  --project-ref xtknhwadrjyosghqseoe

# Secrets 설정
supabase secrets set \
  NEXT_PUBLIC_APP_URL="https://staging.yourapp.com" \
  INTERNAL_API_SECRET="your-staging-secret" \
  --project-ref xtknhwadrjyosghqseoe
```

### Production 수동 배포

```bash
cd apps/web

# Production에 배포
supabase functions deploy \
  --project-ref your-production-project-id

# Secrets 설정
supabase secrets set \
  NEXT_PUBLIC_APP_URL="https://yourapp.com" \
  INTERNAL_API_SECRET="your-production-secret" \
  --project-ref your-production-project-id
```

### 특정 함수만 배포

```bash
# 특정 함수만 배포
supabase functions deploy process-summary-queue \
  --project-ref PROJECT_ID
```

## 📊 Monitoring

### Supabase Dashboard

1. **Functions Logs**
   - Supabase Dashboard → Edge Functions → Logs
   - 실시간 로그 확인
   - 에러 모니터링

2. **Invocations**
   - 함수 호출 횟수
   - 응답 시간
   - 에러율

### GitHub Actions

1. **Workflow 실행 이력**
   - Repository → Actions
   - 각 배포의 성공/실패 확인

2. **Deployment Summary**
   - 각 워크플로우 실행 후 Summary 확인
   - 배포된 함수 목록
   - 환경 정보

## 🐛 Troubleshooting

### 배포 실패

1. **Authentication 에러**
   ```
   Error: Authentication failed
   ```
   - `SUPABASE_ACCESS_TOKEN` 확인
   - 토큰 재발급: `supabase login`

2. **Project not found**
   ```
   Error: Project not found
   ```
   - `SUPABASE_STAGING_PROJECT_ID` 또는 `SUPABASE_PRODUCTION_PROJECT_ID` 확인
   - `config.toml`의 `project_id` 확인

3. **Function deployment failed**
   - Edge Function 코드 문법 확인
   - `deno.json` 및 `deno.lock` 확인
   - 로컬에서 먼저 테스트: `supabase functions serve`

### Secret 설정 확인

```bash
# 설정된 secrets 목록 확인
supabase secrets list --project-ref PROJECT_ID

# 특정 secret 값 확인은 불가능 (보안)
```

### 로그 확인

```bash
# 함수 로그 확인 (로컬)
supabase functions serve process-summary-queue --debug

# 원격 로그는 Dashboard에서 확인
```

## 📝 Best Practices

1. **Branch 전략**
   - `dev` 브랜치에서 먼저 테스트
   - Staging 환경에서 충분히 검증
   - `main`으로 머지 전 리뷰 필수

2. **Secret 관리**
   - Production과 Staging의 secret 분리
   - 주기적인 secret 로테이션
   - Secret 값은 절대 코드에 포함하지 않기

3. **배포 검증**
   - 배포 후 즉시 기능 테스트
   - Logs에서 에러 확인
   - 중요 기능은 Staging에서 먼저 검증

4. **Rollback 준비**
   - 문제 발생 시 이전 버전으로 롤백 가능
   - Git tag를 사용한 버전 관리
   - Manual deployment로 이전 커밋 배포 가능

## 🔗 Related Documentation

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- Project README: `../README.md`
- Supabase Setup: `apps/web/supabase/SUPABASE_SETUP.md`

## 🆘 Getting Help

문제가 발생하면:
1. 이 문서의 Troubleshooting 섹션 확인
2. GitHub Issues에서 검색
3. 팀 채널에 문의
4. Supabase 공식 Discord 또는 포럼 활용
