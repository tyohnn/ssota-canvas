# 🎨 SSOTA Web Application

Event-driven 화이트보드 협업 플랫폼

---

## 🚀 빠른 시작

```bash
# 1. 의존성 설치
pnpm install

# 2. Supabase 로컬 시작
pnpm supabase:start

# 3. 개발 서버 시작
pnpm dev

# 4. Google 계정으로 로그인
# → http://localhost:3000
```

**새로운 팀원이라면?** → [ONBOARDING.md](./ONBOARDING.md) 참조

---

## 📚 주요 문서

- **[ONBOARDING.md](./ONBOARDING.md)** - 팀원 온보딩 가이드 (필독)
- **[DB_MIGRATION_WORKFLOW.md](./DB_MIGRATION_WORKFLOW.md)** - 데이터베이스 마이그레이션 워크플로우
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Supabase Branching 설정 가이드
- **[Architecture Docs](../../docs/README.md)** - 전체 아키텍처 문서

---

## 🏗️ 기술 스택

### Core

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom Components

### Backend & Database

- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Auth**: Supabase Auth (Google OAuth)
- **Branching**: Supabase Branching (GitHub Integration)

### Canvas & Collaboration

- **Canvas**: React Flow (@xyflow/react)
- **Real-time**: Supabase Realtime
- **Editor**: Tiptap (Markdown/Rich Text)

### AI & Automation

- **AI SDK**: Vercel AI SDK
- **Providers**: OpenAI, Anthropic, Google AI

---

## 📂 프로젝트 구조

```
apps/web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # 인증 관련 페이지
│   │   ├── (dashboard)/         # Dashboard 페이지
│   │   └── (main)/              # 메인 페이지
│   │
│   ├── components/              # 공통 컴포넌트
│   │
│   ├── db/                      # 데이터베이스
│   │   ├── schema.ts            # 메인 스키마 (public)
│   │   └── schemas/             # 추가 스키마 (image_app_space 등)
│   │
│   ├── domains/                 # 도메인별 비즈니스 로직
│   │   ├── user-management/
│   │   ├── organization-management/
│   │   ├── workspace-management/
│   │   ├── canvas-management/
│   │   ├── block-management/
│   │   └── ai-management/
│   │
│   ├── lib/                     # 공통 라이브러리
│   ├── hooks/                   # React Hooks
│   ├── utils/                   # 유틸리티 함수
│   └── types/                   # 공통 타입 정의
│
├── supabase/                    # Supabase 설정
│   ├── config.toml              # 로컬 Supabase 설정
│   ├── migrations/              # DB 마이그레이션 (SSOT)
│   └── seed.sql                 # 테스트 데이터 (Optional)
│
├── scripts/                     # 자동화 스크립트
│   └── migrate-to-supabase.ts   # 마이그레이션 자동화
│
├── drizzle-temp/                # Drizzle 임시 폴더 (.gitignore)
├── .env.local                   # 로컬 환경변수 (.gitignore)
└── drizzle.config.ts            # Drizzle ORM 설정
```

---

## 🛠️ 개발 명령어

### 일상적인 개발

```bash
pnpm dev          # 개발 서버 시작 (http://localhost:3000)
pnpm build        # 프로덕션 빌드
pnpm start        # 프로덕션 서버 시작
pnpm lint         # Lint 검사
pnpm lint:fix     # Lint 자동 수정
pnpm typecheck    # TypeScript 타입 체크
```

### 테스트

```bash
pnpm test                # Unit 테스트
pnpm test:watch          # Watch 모드
pnpm test:coverage       # 커버리지 리포트
pnpm test:e2e            # E2E 테스트 (Playwright)
pnpm test:e2e:ui         # E2E UI 모드
```

### Supabase

```bash
pnpm supabase:start      # 로컬 Supabase 시작
pnpm supabase:stop       # 로컬 Supabase 중지
pnpm supabase:reset      # DB 리셋 (마이그레이션 재적용)
pnpm supabase:status     # 상태 확인
pnpm supabase:studio     # Supabase Studio 열기
```

### Database

```bash
pnpm db:generate         # Drizzle 마이그레이션 생성
pnpm db:migrate          # 마이그레이션 생성 + Supabase로 복사
pnpm db:migrate:copy     # 마이그레이션 복사만 (커스텀 설명 가능)
pnpm db:studio           # Drizzle Studio 열기
pnpm db:push             # DB에 직접 Push (주의!)
```

---

## 🌿 Git Workflow

### 브랜치 전략

```
main            # Production (Full OAuth + Real Data)
  ↓
develop         # Staging (Full OAuth + Complete Testing)
  ↓
feature/*       # Feature 개발 (Build Validation Only)
```

**실용적 접근:**
- **feature/***: 로컬 테스트 + 빌드 검증 + 코드 리뷰
- **develop**: 완전한 기능 테스트 (Google OAuth 작동)
- **main**: Production 배포

**자세한 내용**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### 일반적인 개발 흐름

```bash
# 1. develop에서 새 브랜치 생성
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 2. 개발 진행
# - 코드 작성
# - 스키마 변경 시: pnpm db:migrate

# 3. 로컬 테스트
pnpm supabase:reset
pnpm test
pnpm test:e2e

# 4. Commit & Push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 5. PR 생성
# → Supabase Preview Branch 자동 생성
# → Vercel Preview Deployment 자동 생성
```

---

## 🗄️ Database Migration

### 스키마 변경 시

```bash
# 1. schema.ts 수정
vim src/db/schema.ts

# 2. 마이그레이션 생성 + 자동 복사
pnpm db:migrate

# 또는 커스텀 설명과 함께
pnpm db:migrate:copy "add_user_preferences"

# 3. 로컬 테스트
pnpm supabase:reset

# 4. Commit & Push
git add supabase/migrations/ src/db/
git commit -m "feat: add user preferences table"
git push
```

**자세한 내용**: [DB_MIGRATION_WORKFLOW.md](./DB_MIGRATION_WORKFLOW.md)

---

## 🔐 환경 변수

### 로컬 개발

`.env.local` 파일은 자동으로 생성되어 있거나 `.env.example`을 복사하여 생성합니다.

```bash
# .env.local 생성 (필요시)
cp .env.example .env.local
```

**표준 Supabase 로컬 키 (모든 팀원 동일):**
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
POSTGRES_URL_NON_POOLING=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**선택적 API 키들 (필요시 추가):**
```env
# AI Services (로컬 개발에는 선택사항)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
AI_GATEWAY_API_KEY=...
HELICONE_API_KEY=...

# Other Providers
UNSPLASH_ACCESS_KEY=...
YOUTUBE_API_KEY=...

# Analytics (로컬 개발에는 선택사항)
NEXT_PUBLIC_MIXPANEL_TOKEN=...
NEXT_PUBLIC_SENTRY_DSN=...
```

**기본 설정만으로도 충분합니다!** AI나 Analytics 키 없이도 개발 가능합니다.

### Production/Preview

Vercel 환경변수로 관리:
- **Production (main)**: Supabase Main Project credentials (자동 주입)
- **Preview (develop/feature)**: Supabase Preview Branch credentials (자동 주입)
- **API Keys**: Vercel Dashboard에서 환경별로 설정

**Supabase-Vercel Integration**이 credentials를 자동으로 주입합니다.

---

## 🧪 테스트

### Unit Tests

```bash
# 전체 테스트
pnpm test

# Watch 모드
pnpm test:watch

# 커버리지
pnpm test:coverage

# 특정 도메인만
pnpm test --testPathPattern=user-management
```

### E2E Tests

```bash
# Headless 모드
pnpm test:e2e

# UI 모드
pnpm test:e2e:ui

# Headed 모드 (브라우저 표시)
pnpm test:e2e:headed
```

**E2E 테스트에 seed 필요시:**
```bash
supabase db reset --seed
pnpm test:e2e
```

---

## 🐛 트러블슈팅

### 자주 발생하는 문제

**Docker 관련:**
```bash
# Docker가 실행되지 않음
open -a Docker

# 포트 충돌
pnpm supabase:stop
lsof -i :54321
```

**Supabase 관련:**
```bash
# 마이그레이션 실패
pnpm supabase:stop
docker volume prune -f
pnpm supabase:start

# 로그 확인
docker logs supabase_db_web
```

**빌드/실행 관련:**
```bash
# node_modules 재설치
rm -rf node_modules .next
pnpm install

# 타입 에러
pnpm typecheck
```

**자세한 트러블슈팅**: [ONBOARDING.md](./ONBOARDING.md#-트러블슈팅)

---

## 📊 아키텍처

### 도메인 기반 설계

프로젝트는 Event-Driven Architecture와 Domain-Driven Design을 따릅니다:

- **User Management** - 사용자 프로필 및 인증
- **Organization Management** - 조직 및 멤버 관리
- **Workspace Management** - 워크스페이스 및 페이지 관리
- **Canvas Management** - 캔버스 viewport 및 렌더링
- **Block Management** - 블록 생성, 편집, 마운트
- **AI Management** - Event Log 및 AI 자동화

**자세한 내용**: [Architecture Overview](../../docs/project-technical-design/architecture-overview.md)

---

## 🔄 Supabase Branching

### 브랜치 전략

```
Git Branch       → Supabase Branch        → Vercel
─────────────────────────────────────────────────────
main             → Main Project           → Production
develop          → Persistent Preview     → Preview (dev.ssota.ai)
feature/*        → Preview Branches       → Preview Deployments
```

### 자동 배포 Flow

1. **코드 Push** → GitHub
2. **GitHub Integration** → Supabase가 감지
3. **마이그레이션 적용** → 해당 브랜치의 Supabase 인스턴스
4. **Vercel 배포** → 올바른 Supabase credentials 자동 주입

**완전한 SSOT**: Git → Supabase → Vercel 모두 자동 동기화

---

## 🤝 기여하기

1. [ONBOARDING.md](./ONBOARDING.md)로 환경 설정
2. [CONTRIBUTING.md](../../CONTRIBUTING.md)로 기여 가이드 확인
3. 이슈 선택 또는 생성
4. Feature 브랜치에서 개발
5. PR 생성

---

## 📞 문의

- **문서**: [docs/README.md](../../docs/README.md)
- **트러블슈팅**: [ONBOARDING.md](./ONBOARDING.md#-트러블슈팅)
- **마이그레이션**: [DB_MIGRATION_WORKFLOW.md](./DB_MIGRATION_WORKFLOW.md)
- **아키텍처**: [Architecture Docs](../../docs/project-technical-design/)

---

**Built with ❤️ by SSOTA Team**

