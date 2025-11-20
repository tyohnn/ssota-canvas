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

