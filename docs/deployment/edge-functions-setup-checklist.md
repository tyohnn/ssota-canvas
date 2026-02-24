# Edge Functions Deployment Setup Checklist

이 체크리스트를 따라 Supabase Edge Functions 자동 배포를 설정하세요.

## 📋 Prerequisites

- [ ] Supabase CLI 설치 완료
- [ ] Staging Supabase 프로젝트 생성
- [ ] Production Supabase 프로젝트 생성 (또는 계획)
- [ ] GitHub Actions 사용 가능한 repository

## 🔐 Step 1: Supabase Access Token 생성

- [ ] Supabase에 로그인
  ```bash
  supabase login
  ```

- [ ] Access Token 확인
  ```bash
  cat ~/.supabase/access-token
  ```
  
  또는 Supabase Dashboard에서 새로 생성:
  - **직접 URL**: https://supabase.com/dashboard/account/tokens
  - **메뉴**: 로그인 → 우측 상단 **Account** → **Access Tokens** → **Generate new token**
  - (주의: 프로젝트의 Settings → API가 아니라 **계정(Account)** 메뉴입니다.)

## 🏗️ Step 2: Supabase Projects 확인

### Staging Project

- [ ] Staging 프로젝트 ID 확인
  - 현재 설정: `xtknhwadrjyosghqseoe`
  - `apps/web/supabase/config.toml`에 설정됨

### Production Project

- [ ] Production 프로젝트 ID 확인
- [ ] `config.toml`에 production remote 추가
  ```toml
  [remotes.production]
  project_id = "your-production-project-id"
  ```

## 🔑 Step 3: GitHub Secrets 설정

Repository Settings → Secrets and variables → Actions에서 다음을 설정:

### Required Secrets

- [ ] `SUPABASE_ACCESS_TOKEN`
  - 값: Step 1에서 확인한 access token
  
- [ ] `SUPABASE_STAGING_PROJECT_ID`
  - 값: `xtknhwadrjyosghqseoe`
  
- [ ] `SUPABASE_PRODUCTION_PROJECT_ID`
  - 값: Production 프로젝트 ID
  
- [ ] `STAGING_APP_URL`
  - 예시: `https://staging.yourapp.com` 또는 Vercel preview URL
  
- [ ] `PRODUCTION_APP_URL`
  - 예시: `https://yourapp.com`
  
- [ ] `STAGING_INTERNAL_API_SECRET`
  - 생성 방법: `openssl rand -hex 32`
  - Staging 앱의 `.env`에도 동일한 값 설정 필요
  
- [ ] `PRODUCTION_INTERNAL_API_SECRET`
  - 생성 방법: `openssl rand -hex 32`
  - Production 앱의 `.env`에도 동일한 값 설정 필요

### Secrets 설정 명령어 (선택)

```bash
# GitHub CLI 사용
gh secret set SUPABASE_ACCESS_TOKEN
gh secret set SUPABASE_STAGING_PROJECT_ID -b "xtknhwadrjyosghqseoe"
gh secret set SUPABASE_PRODUCTION_PROJECT_ID -b "your-production-project-id"
gh secret set STAGING_APP_URL -b "https://staging.yourapp.com"
gh secret set PRODUCTION_APP_URL -b "https://yourapp.com"

# INTERNAL_API_SECRET 생성 및 설정
openssl rand -hex 32 | gh secret set STAGING_INTERNAL_API_SECRET
openssl rand -hex 32 | gh secret set PRODUCTION_INTERNAL_API_SECRET
```

## 📦 Step 4: Edge Functions 준비

- [ ] Edge Function 코드 확인
  - 위치: `apps/web/supabase/functions/process-source-job-queue/`
  - 파일: `index.ts`, `deno.json`

- [ ] 로컬에서 테스트
  ```bash
  cd apps/web
  pnpm supabase:dev
  ```

- [ ] 함수 정상 작동 확인
  ```bash
  curl -X POST http://127.0.0.1:54321/functions/v1/process-source-job-queue \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_ANON_KEY" \
    -d '{}'
  ```

## 🚀 Step 5: GitHub Actions Workflows 확인

- [ ] Staging workflow 파일 존재 확인
  - 파일: `.github/workflows/deploy-edge-functions-staging.yml`
  - Trigger: `dev` 브랜치 push

- [ ] Production workflow 파일 존재 확인
  - 파일: `.github/workflows/deploy-edge-functions-production.yml`
  - Trigger: `main` 브랜치 push

## 🧪 Step 6: 테스트 배포 (Staging)

- [ ] Feature 브랜치에서 테스트 커밋
  ```bash
  git checkout -b test/edge-function-deployment
  echo "# Test" >> apps/web/supabase/functions/process-source-job-queue/README.md 2>/dev/null || true
  git add .
  git commit -m "test: edge function deployment"
  git push origin test/edge-function-deployment
  ```

- [ ] PR 생성하여 `dev` 브랜치로 머지

- [ ] GitHub Actions에서 workflow 실행 확인
  - Repository → Actions → "Deploy Edge Functions (Staging)"
  - 녹색 체크 확인

- [ ] Supabase Dashboard에서 배포 확인
  - Staging Project → Edge Functions
  - `process-source-job-queue` 함수 확인

- [ ] 배포된 함수 테스트
  ```bash
  curl -X POST https://xtknhwadrjyosghqseoe.supabase.co/functions/v1/process-source-job-queue \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_STAGING_ANON_KEY" \
    -d '{}'
  ```

## 📝 Step 7: Documentation 확인

- [ ] 배포 가이드 읽기
  - 문서: `docs/deployment/edge-functions-deployment.md`

- [ ] 팀원들과 공유
  - Slack/Discord 등에 가이드 링크 공유
  - 질문 사항 정리

## ✅ Step 8: Production 배포 준비

- [ ] Staging 테스트 완료
- [ ] Production secrets 모두 설정
- [ ] Production 배포 계획 수립
  - 배포 시간 결정
  - 롤백 계획 준비
  - 모니터링 준비

- [ ] `dev` → `main` PR 생성 및 머지
- [ ] Production 배포 확인
  - GitHub Actions workflow 확인
  - Supabase Dashboard 확인
  - Production 함수 테스트

## 🔄 Step 9: 일상적인 워크플로우

이제 다음 워크플로우로 작업하세요:

1. **Feature 개발**
   ```bash
   git checkout -b feat/new-feature
   # Edge Function 수정
   git commit -m "feat: add new feature"
   git push
   ```

2. **Staging 배포**
   - `dev` 브랜치로 PR 머지
   - 자동으로 Staging에 배포
   - Staging에서 테스트

3. **Production 배포**
   - `main` 브랜치로 PR 머지
   - 자동으로 Production에 배포
   - Production에서 검증

## 🆘 Troubleshooting

문제가 발생하면 다음을 확인하세요:

- [ ] GitHub Secrets가 모두 설정되었는지 확인
- [ ] Workflow 파일의 프로젝트 ID 확인
- [ ] Supabase Access Token이 유효한지 확인
- [ ] Edge Function 코드에 문법 에러가 없는지 확인
- [ ] `docs/deployment/edge-functions-deployment.md`의 Troubleshooting 섹션 참고

## 📚 Additional Resources

- [Edge Functions Deployment Guide](../deployment/edge-functions-deployment.md)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

## ✅ Setup Complete!

모든 체크박스를 완료했다면, Edge Functions 자동 배포가 설정되었습니다! 🎉

이제 `dev`와 `main` 브랜치로 push하면 자동으로 배포됩니다.
