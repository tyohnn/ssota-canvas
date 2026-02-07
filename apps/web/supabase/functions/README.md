# 🚀 Supabase Edge Functions Deployment

자동 배포 시스템으로 `dev` 브랜치는 Staging에, `main` 브랜치는 Production에 배포됩니다.

## 📚 Quick Links

- **[Setup Checklist](../../docs/deployment/edge-functions-setup-checklist.md)** - 초기 설정 가이드
- **[Deployment Guide](../../docs/deployment/edge-functions-deployment.md)** - 상세 배포 가이드
- **[Supabase Setup](./SUPABASE_SETUP.md)** - Supabase 전체 설정 가이드

## 🏗️ Architecture

```
dev branch  ──────► Staging Environment
    ↓
    PR (with release label)
    ↓
main branch ──────► Production Environment
```

## 🚀 Quick Start

### 1. 로컬 개발

```bash
# Supabase 로컬 환경 시작 (Edge Functions 포함)
cd apps/web
pnpm supabase:dev

# Edge Function 테스트
curl -X POST http://127.0.0.1:54321/functions/v1/process-summary-queue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"test": "data"}'
```

### 2. Staging 배포 (자동)

```bash
# Feature 브랜치에서 작업
git checkout -b feat/update-edge-function
# 코드 수정...
git commit -m "feat: update edge function"
git push

# dev로 PR 머지하면 자동 배포
```

### 3. Production 배포 (자동)

```bash
# dev에서 main으로 PR 생성 및 머지
# 자동으로 Production에 배포됨
```

## 📦 Available Functions

### process-summary-queue

YouTube 동영상 요약을 백그라운드로 처리하는 Edge Function

- **위치**: `functions/process-summary-queue/`
- **Trigger**: pgmq queue
- **Environment**:
  - `NEXT_PUBLIC_APP_URL` - 앱 API URL
  - `INTERNAL_API_SECRET` - 내부 API 인증

## ⚙️ Configuration

### config.toml

Edge Function 설정:

```toml
[edge_runtime]
enabled = true
policy = "per_worker"  # Hot reload 지원
deno_version = 2

# Function별 설정
# [functions.process-summary-queue]
# verify_jwt = false
```

### Environment Variables

Edge Functions는 다음 환경 변수를 사용합니다:

- `NEXT_PUBLIC_APP_URL` - GitHub Actions에서 자동 설정
- `INTERNAL_API_SECRET` - GitHub Actions에서 자동 설정
- `SUPABASE_URL` - Supabase에서 자동 주입
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase에서 자동 주입

## 🔐 Required GitHub Secrets

배포를 위해 다음 secrets가 필요합니다:

```
SUPABASE_ACCESS_TOKEN
SUPABASE_STAGING_PROJECT_ID
SUPABASE_PRODUCTION_PROJECT_ID
STAGING_APP_URL
PRODUCTION_APP_URL
STAGING_INTERNAL_API_SECRET
PRODUCTION_INTERNAL_API_SECRET
```

자세한 설정 방법은 [Setup Checklist](../../docs/deployment/edge-functions-setup-checklist.md)를 참고하세요.

## 🧪 Testing

### Local Testing

```bash
# 1. 로컬 환경 시작
pnpm supabase:dev

# 2. 함수 호출
curl -X POST http://127.0.0.1:54321/functions/v1/process-summary-queue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"jobId": "test-job-id"}'
```

### Staging Testing

```bash
curl -X POST https://xtknhwadrjyosghqseoe.supabase.co/functions/v1/process-summary-queue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAGING_ANON_KEY" \
  -d '{"jobId": "test-job-id"}'
```

## 📊 Monitoring

### Supabase Dashboard

- **Staging**: [Edge Functions Logs](https://supabase.com/dashboard/project/xtknhwadrjyosghqseoe/functions)
- **Production**: Edge Functions → Logs

### GitHub Actions

- [Workflows](../../../.github/workflows/) - 배포 상태 확인

## 🐛 Troubleshooting

### 배포 실패

1. GitHub Actions 로그 확인
2. Supabase Access Token 검증
3. Project ID 확인
4. 로컬에서 함수 테스트

자세한 내용은 [Deployment Guide](../../docs/deployment/edge-functions-deployment.md)의 Troubleshooting 섹션을 참고하세요.

## 📝 Development Workflow

1. **Feature 개발**
   - Feature 브랜치 생성
   - Edge Function 수정
   - 로컬 테스트
   - Commit & Push

2. **Staging 배포**
   - `dev`로 PR 생성 및 머지
   - 자동 배포 (GitHub Actions)
   - Staging에서 테스트

3. **Production 배포**
   - Staging 테스트 완료
   - `main`으로 PR 생성 및 머지
   - 자동 배포 (GitHub Actions)
   - Production 검증

## 🔗 Related Documentation

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deployment Guide](../../docs/deployment/edge-functions-deployment.md)
- [Setup Checklist](../../docs/deployment/edge-functions-setup-checklist.md)
- [Supabase Setup](./SUPABASE_SETUP.md)

## 🆘 Getting Help

문제가 발생하면:
1. Troubleshooting 가이드 확인
2. GitHub Issues 검색
3. 팀 채널에 문의
4. Supabase Discord/포럼 활용
