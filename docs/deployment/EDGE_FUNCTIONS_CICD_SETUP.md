# 🚀 Supabase Edge Functions CI/CD Setup Complete

Supabase Edge Functions를 위한 자동 배포 시스템이 설정되었습니다!

## 📁 생성된 파일들

### 1. GitHub Actions Workflows

```
.github/workflows/
├── deploy-edge-functions-staging.yml    # dev → Staging 자동 배포
└── deploy-edge-functions-production.yml # main → Production 자동 배포
```

### 2. Documentation

```
docs/deployment/
├── edge-functions-deployment.md         # 상세 배포 가이드
└── edge-functions-setup-checklist.md    # 설정 체크리스트

apps/web/supabase/
├── functions/README.md                  # Edge Functions 개요
├── SUPABASE_SETUP.md                    # Supabase 전체 설정 (업데이트)
└── config.toml                          # Supabase 설정 (업데이트)
```

## 🎯 배포 전략

```
┌─────────────────────────────────────────────┐
│         Git Branch Strategy                 │
├─────────────────────────────────────────────┤
│                                             │
│  Feature Branch                             │
│       ↓                                     │
│  [PR] → dev branch                          │
│       ↓                                     │
│  🔄 Auto Deploy to Staging                  │
│       ↓                                     │
│  [Test & Verify]                            │
│       ↓                                     │
│  [PR with release label] → main branch     │
│       ↓                                     │
│  🚀 Auto Deploy to Production               │
│                                             │
└─────────────────────────────────────────────┘
```

## ✅ 다음 단계

### 1. GitHub Secrets 설정

Repository Settings → Secrets and variables → Actions에서 다음을 추가하세요:

```bash
# Required Secrets
SUPABASE_ACCESS_TOKEN              # Supabase CLI token
SUPABASE_STAGING_PROJECT_ID        # xtknhwadrjyosghqseoe
SUPABASE_PRODUCTION_PROJECT_ID     # Your production project ID
STAGING_APP_URL                    # Staging app URL
PRODUCTION_APP_URL                 # Production app URL
STAGING_INTERNAL_API_SECRET        # Generate: openssl rand -hex 32
PRODUCTION_INTERNAL_API_SECRET     # Generate: openssl rand -hex 32
```

자세한 설정 방법은 [Setup Checklist](edge-functions-setup-checklist.md)를 참고하세요.

### 2. Production Project ID 설정

`apps/web/supabase/config.toml`에 production project ID를 추가하세요:

```toml
[remotes.production]
project_id = "your-production-project-id"
```

### 3. 테스트 배포

1. **로컬 테스트**
   ```bash
   cd apps/web
   pnpm supabase:dev
   ```

2. **Staging 테스트 배포**
   - Feature 브랜치 생성
   - 테스트 변경사항 추가
   - `dev` 브랜치로 PR & Merge
   - GitHub Actions에서 자동 배포 확인

3. **Production 배포**
   - Staging 테스트 완료 후
   - `main` 브랜치로 PR & Merge
   - Production 자동 배포 확인

## 📚 주요 문서

1. **[Setup Checklist](edge-functions-setup-checklist.md)** 
   - 초기 설정 단계별 가이드
   - GitHub Secrets 설정 방법
   - 테스트 배포 절차

2. **[Deployment Guide](edge-functions-deployment.md)**
   - 배포 아키텍처 상세 설명
   - CI/CD 워크플로우 설명
   - Troubleshooting 가이드

3. **[Functions README](../apps/web/supabase/functions/README.md)**
   - Edge Functions 개요
   - 로컬 개발 방법
   - 함수별 설명

4. **[Supabase Setup](../apps/web/supabase/SUPABASE_SETUP.md)**
   - Supabase 전체 설정 가이드
   - Branch 전략
   - OAuth 설정

## 🔑 핵심 기능

### ✅ 자동 배포
- `dev` 브랜치 push → Staging 자동 배포
- `main` 브랜치 push → Production 자동 배포
- Release tag 생성 → Production 배포

### ✅ 환경 분리
- Staging과 Production 환경 완전 분리
- 각 환경별 독립적인 secrets 관리
- 환경별 앱 URL 설정

### ✅ 안전한 배포
- 배포 전 검증 단계
- 배포 후 자동 테스트
- Workflow 실행 로그 및 Summary

### ✅ 기존 워크플로우 통합
- Canary Release (dev → Staging)
- Release Automation (main → Production)
- Edge Functions 배포와 자연스럽게 통합

## 🎉 완료!

이제 Edge Functions를 수정하고 `dev` 또는 `main` 브랜치에 push하면 자동으로 배포됩니다.

### 바로 시작하기

```bash
# 1. Feature 브랜치 생성
git checkout -b feat/update-edge-function

# 2. Edge Function 수정
vim apps/web/supabase/functions/process-summary-queue/index.ts

# 3. Commit & Push
git add .
git commit -m "feat: update edge function"
git push origin feat/update-edge-function

# 4. PR 생성 및 dev로 머지
# → 자동으로 Staging에 배포됩니다!
```

## 🆘 문제가 발생하면?

1. [Setup Checklist](edge-functions-setup-checklist.md)의 Troubleshooting 섹션 확인
2. [Deployment Guide](edge-functions-deployment.md)의 Troubleshooting 섹션 확인
3. GitHub Actions 로그 확인
4. Supabase Dashboard의 Edge Functions Logs 확인

---

**Happy Deploying! 🚀**
