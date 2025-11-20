# 📚 Database Migration Workflow

Supabase Branching을 사용한 데이터베이스 마이그레이션 워크플로우 가이드

## 🎯 개요

이 프로젝트는 **Drizzle ORM**과 **Supabase Branching**을 함께 사용합니다:
- **Drizzle**: TypeScript 타입 안전성 + 마이그레이션 생성
- **Supabase**: 실제 마이그레이션 실행 + GitHub 연동

**SSOT (Single Source of Truth)**: `supabase/migrations/` 폴더

---

## 🔄 스키마 변경 워크플로우

### 1️⃣ 스키마 파일 수정

```typescript
// src/db/schema.ts 또는 src/db/schemas/*.ts 수정
export const newTable = pgTable('new_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // ...
});
```

### 2️⃣ 마이그레이션 생성 및 자동 복사

```bash
# 방법 1: 자동 설명 (Drizzle이 생성한 이름 사용)
pnpm db:migrate

# 방법 2: 커스텀 설명 추가
pnpm db:migrate:copy add_user_preferences_table
```

**내부 동작:**
1. `drizzle-kit generate` 실행 → `drizzle-temp/0001_xxx.sql` 생성
2. 자동으로 `supabase/migrations/YYYYMMDDHHmmss_description.sql`로 복사

### 3️⃣ 로컬에서 테스트

```bash
# 로컬 Supabase 데이터베이스 리셋 (마이그레이션만 적용)
pnpm supabase:reset

# Seed 데이터가 필요한 경우 (E2E 테스트 등)
supabase db reset --seed

# Supabase Studio에서 확인
pnpm supabase:studio
# → http://127.0.0.1:54323 자동 열림
```

### 4️⃣ 코드 변경 사항 확인

```bash
# Next.js 개발 서버 실행
pnpm dev

# 브라우저에서 기능 테스트
# → http://localhost:3000
```

### 5️⃣ Git Commit & Push

```bash
# 변경사항 추가
git add supabase/migrations/
git add src/db/schema*.ts

# 커밋
git commit -m "feat: add user preferences table"

# Push (Supabase가 자동으로 Preview Branch에 배포)
git push origin feature/user-preferences
```

### 6️⃣ 자동 배포 확인

**GitHub Integration이 자동으로:**
1. Feature 브랜치용 Supabase Preview Branch 생성
2. 마이그레이션 자동 적용
3. Vercel Preview Deployment에 해당 credentials 주입

---

## 📂 폴더 구조

```
apps/web/
├── src/db/
│   ├── schema.ts                    # 메인 스키마 (public)
│   └── schemas/
│       └── image-app-space-schema.ts # 추가 스키마 (image_app_space)
│
├── drizzle-temp/                    # ❌ Git 제외 (임시)
│   └── 0001_xxx.sql                 # Drizzle 생성 파일
│
├── supabase/
│   ├── config.toml                  # Supabase 설정
│   ├── migrations/                  # ✅ SSOT (Git 포함)
│   │   ├── 20240101000000_initial_schema.sql
│   │   ├── 20240102120000_add_user_prefs.sql
│   │   └── ...
│   └── seed.sql                     # 초기 데이터
│
├── scripts/
│   └── migrate-to-supabase.ts       # 자동화 스크립트
│
└── drizzle.config.ts                # Drizzle 설정
```

---

## 🛠️ 유용한 명령어

### Database

```bash
# 마이그레이션 생성 및 복사 (자동)
pnpm db:migrate

# 커스텀 설명과 함께 복사
pnpm db:migrate:copy "add_feature_x"

# Drizzle Studio 열기 (현재 DB 상태 확인)
pnpm db:studio
```

### Supabase

```bash
# 로컬 Supabase 시작
pnpm supabase:start

# 로컬 Supabase 중지
pnpm supabase:stop

# DB 리셋 (마이그레이션 + seed 재적용)
pnpm supabase:reset

# 상태 확인
pnpm supabase:status

# Supabase Studio 열기
pnpm supabase:studio
```

---

## 🔍 트러블슈팅

### "마이그레이션 파일이 없습니다"

```bash
# 먼저 Drizzle로 마이그레이션 생성
pnpm db:generate

# 그 다음 복사
pnpm db:migrate:copy
```

### "타임스탬프 충돌"

1초 기다렸다가 다시 시도:

```bash
sleep 1 && pnpm db:migrate:copy
```

### 마이그레이션 실패

```bash
# 로컬에서 디버그 모드로 실행
supabase db reset --debug

# 특정 마이그레이션 파일 확인
cat supabase/migrations/20240101000000_problematic.sql
```

### 스키마가 반영되지 않음

`drizzle.config.ts`에 스키마 파일이 포함되어 있는지 확인:

```typescript
export default defineConfig({
  schema: [
    './src/db/schema.ts',
    './src/db/schemas/*.ts', // ✅ 모든 스키마 포함
  ],
  // ...
});
```

---

## 🌿 Branch 전략

```
main (Production)
  ↓ Supabase Main Project
  ↓ Vercel Production

develop (Staging)
  ↓ Supabase Persistent Preview Branch
  ↓ Vercel Preview

feature/* (Feature Branches)
  ↓ Supabase Preview Branches (자동 생성/삭제)
  ↓ Vercel Preview Deployments
```

---

## 📊 환경별 데이터베이스

| 환경 | 데이터베이스 | Credentials | 데이터 |
|------|------------|-------------|--------|
| **로컬** | `localhost:54322` | 표준 로컬 키 | `seed.sql` |
| **Develop** | Preview Branch | 자동 생성 | 비어있음 (seed 선택) |
| **Feature** | Preview Branch | 자동 생성 | 비어있음 (seed 선택) |
| **Production** | Main Project | Dashboard에서 관리 | 실제 데이터 |

---

## 💡 Best Practices

### ✅ DO

- 항상 `supabase/migrations/`에 마이그레이션 저장
- 의미있는 마이그레이션 설명 사용
- 로컬에서 먼저 테스트 (`pnpm supabase:reset`)
- 작은 단위로 마이그레이션 작성
- Git commit message와 마이그레이션 설명 일치

### ❌ DON'T

- `drizzle-temp/` 파일을 Git에 커밋하지 말 것
- Production에서 직접 마이그레이션 실행하지 말 것
- 큰 변경사항을 한 번에 마이그레이션하지 말 것
- 이미 배포된 마이그레이션 파일 수정하지 말 것

---

## 📚 참고 자료

- [Supabase Branching 문서](https://supabase.com/docs/guides/deployment/branching)
- [Drizzle ORM 문서](https://orm.drizzle.team/docs/overview)
- [프로젝트 Architecture 문서](../../docs/README.md)

---

## 🆘 도움이 필요하신가요?

1. `MIGRATION_WORKFLOW.md` (이 파일) 확인
2. `supabase status` 실행하여 환경 확인
3. `supabase db reset --debug` 로 디버깅
4. 팀에 문의

---

**마지막 업데이트**: 2024-11-20

