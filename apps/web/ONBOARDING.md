# 🚀 팀원 온보딩 가이드

새로운 팀원을 위한 로컬 개발 환경 설정 가이드입니다.

---

## ⏱️ 예상 소요 시간

- **전체 설정**: 약 30분
- **첫 실행**: 약 10분 (Docker 이미지 다운로드)

---

## 📋 사전 요구사항

### 필수 설치

- [ ] **Node.js** v18+ ([다운로드](https://nodejs.org/))
- [ ] **pnpm** v8+ ([설치 가이드](https://pnpm.io/installation))
- [ ] **Docker Desktop** ([다운로드](https://www.docker.com/products/docker-desktop))
- [ ] **Git**

### 계정 필요

- [ ] **GitHub** 계정 (저장소 접근)
- [ ] **Google** 계정 (로그인용)

---

## 🏁 빠른 시작 (5분)

```bash
# 1. 저장소 클론
git clone <repository-url>
cd ssota/apps/web

# 2. 의존성 설치
pnpm install

# 3. Docker Desktop 실행 확인
# → 상단 메뉴바에서 Docker 아이콘 확인

# 4. Supabase 로컬 시작
pnpm supabase:start

# 5. 개발 서버 시작
pnpm dev

# 6. 브라우저에서 열기
# → http://localhost:3000
# → Google 계정으로 로그인
```

**끝! 🎉** 이제 개발을 시작할 수 있습니다.

---

## 📖 상세 설정 가이드

### Step 1: 저장소 클론 및 의존성 설치

```bash
# 저장소 클론
git clone <repository-url>
cd ssota

# 루트에서 모든 워크스페이스 설치
pnpm install

# apps/web으로 이동
cd apps/web
```

### Step 2: Docker Desktop 설정

1. **Docker Desktop 설치**
   - [공식 사이트](https://www.docker.com/products/docker-desktop)에서 다운로드
   - 설치 후 실행

2. **Docker 실행 확인**
   ```bash
   docker ps
   # 에러 없이 실행되면 OK
   ```

### Step 3: Supabase CLI 설치 (자동)

```bash
# Mac/Linux (Homebrew)
brew install supabase/tap/supabase

# 또는 npm
npm install -g supabase

# 설치 확인
supabase --version
```

### Step 4: 로컬 Supabase 시작

```bash
cd apps/web

# Supabase 로컬 환경 시작 (최초 10분 소요 가능)
pnpm supabase:start

# 성공하면 다음과 같이 출력됩니다:
# API URL: http://127.0.0.1:54321
# DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# Studio URL: http://127.0.0.1:54323
# anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5: 환경 변수 설정

`.env.local`은 이미 생성되어 있습니다. (표준 로컬 Supabase 키 사용)

**필요한 경우에만 수정:**
- Google OAuth 개발 키 (로컬은 기본 설정으로 작동)

### Step 6: 개발 서버 시작

```bash
# Next.js 개발 서버 시작
pnpm dev

# 브라우저에서 자동으로 열립니다:
# http://localhost:3000
```

### Step 7: 첫 로그인

1. `http://localhost:3000` 접속
2. **"Sign in with Google"** 클릭
3. Google 계정으로 로그인
4. 자동으로 생성됩니다:
   - ✅ 사용자 프로필
   - ✅ 개인 조직
   - ✅ General 워크스페이스 (팀용)
   - ✅ Personal 워크스페이스
   - ✅ Welcome 페이지들

**완료! 🎉** 이제 개발을 시작할 수 있습니다.

---

## 🛠️ 유용한 명령어

### 일상적인 개발

```bash
# 개발 서버 시작
pnpm dev

# Lint 검사
pnpm lint

# 타입 체크
pnpm typecheck

# 테스트 실행
pnpm test
```

### Supabase 관리

```bash
# Supabase 시작
pnpm supabase:start

# Supabase 중지
pnpm supabase:stop

# DB 리셋 (마이그레이션 재적용)
pnpm supabase:reset

# Supabase Studio 열기
pnpm supabase:studio

# 상태 확인
pnpm supabase:status
```

### 데이터베이스

```bash
# 스키마 변경 후 마이그레이션 생성
pnpm db:migrate

# Drizzle Studio (현재 DB 상태 확인)
pnpm db:studio
```

---

## 📁 프로젝트 구조

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # 공통 컴포넌트
│   ├── db/
│   │   ├── schema.ts     # 메인 DB 스키마
│   │   └── schemas/      # 추가 스키마들
│   ├── domains/          # 도메인별 비즈니스 로직
│   └── lib/              # 유틸리티
│
├── supabase/
│   ├── config.toml       # Supabase 설정
│   ├── migrations/       # DB 마이그레이션 (SSOT)
│   └── seed.sql          # 테스트 데이터 (옵션)
│
├── scripts/              # 자동화 스크립트
├── .env.local            # 로컬 환경변수 (Git 제외)
└── package.json          # 프로젝트 설정
```

---

## 🐛 트러블슈팅

### Docker 관련

**문제: "Cannot connect to the Docker daemon"**

```bash
# 해결: Docker Desktop이 실행 중인지 확인
# 상단 메뉴바에서 Docker 아이콘 확인
# 또는 Applications에서 Docker Desktop 실행
```

**문제: "port is already allocated"**

```bash
# 해결: 기존 Supabase 중지
pnpm supabase:stop

# 포트 확인
lsof -i :54321

# 재시작
pnpm supabase:start
```

### Supabase 관련

**문제: "supabase_storage_web container is not ready"**

```bash
# 해결: Storage API 버전 충돌
# supabase/config.toml에서 storage를 비활성화했습니다
# 필요시 Supabase CLI 업데이트
brew upgrade supabase/tap/supabase
```

**문제: 마이그레이션 실패**

```bash
# 해결: DB 완전 리셋
pnpm supabase:stop
docker volume prune -f
pnpm supabase:start
```

### 개발 서버 관련

**문제: "Module not found"**

```bash
# 해결: 의존성 재설치
rm -rf node_modules
pnpm install
```

**문제: 로그인 후 리디렉션 안 됨**

```bash
# 해결: Supabase Redirect URLs 확인
# supabase/config.toml에서:
# - http://localhost:3000/** 포함되어 있는지 확인
```

---

## 🔐 로컬 계정 정보

### Google OAuth (Production과 동일)

- **로그인**: Google 계정 사용
- **자동 생성**: Profile, Organization, Workspaces, Pages

### 테스트 계정 (선택사항)

E2E 테스트나 특정 시나리오 테스트가 필요한 경우:

```bash
# Seed 데이터 활성화
supabase db reset --seed

# 테스트 계정:
# 1. admin@test.com / password123 (ADMIN)
# 2. user@test.com / password123 (GENERAL)
# 3. dev@test.com / password123 (GENERAL)

# 주의: Email/Password 로그인 UI는 없습니다
# Supabase Studio 또는 Magic Link 사용
```

---

## 🎓 학습 자료

### 필수 읽기

- [DB_MIGRATION_WORKFLOW.md](./DB_MIGRATION_WORKFLOW.md) - 스키마 변경 시 필독
- [프로젝트 Architecture](../../docs/README.md) - 전체 아키텍처

### 외부 문서

- [Supabase Branching](https://supabase.com/docs/guides/deployment/branching)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Next.js 15](https://nextjs.org/docs)

---

## 📞 도움 요청

### 막힐 때

1. **이 문서 확인** (트러블슈팅 섹션)
2. **터미널 로그 확인** (`--debug` 플래그 사용)
3. **팀원에게 문의** (Slack/Discord)
4. **이슈 생성** (GitHub Issues)

### 유용한 디버깅 명령어

```bash
# Supabase 상태
pnpm supabase:status

# Docker 상태
docker ps

# 로그 확인
docker logs supabase_db_web

# 데이터베이스 직접 접속
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

---

## ✅ 온보딩 체크리스트

환경 설정이 완료되었는지 확인하세요:

- [ ] 저장소 클론 완료
- [ ] `pnpm install` 성공
- [ ] Docker Desktop 실행 중
- [ ] `pnpm supabase:start` 성공
- [ ] Supabase Studio 접속 가능 (http://127.0.0.1:54323)
- [ ] `pnpm dev` 성공
- [ ] localhost:3000 접속 가능
- [ ] Google 로그인 성공
- [ ] Dashboard에 Organization/Workspace 생성됨
- [ ] 첫 번째 Page 생성 가능

**모두 체크했다면 축하합니다! 🎉**

이제 본격적인 개발을 시작할 수 있습니다.

---

## 🚀 다음 단계

1. [DB_MIGRATION_WORKFLOW.md](./DB_MIGRATION_WORKFLOW.md) 읽기
2. 도메인별 README 확인 (`src/domains/*/README.md`)
3. 첫 번째 이슈 선택하여 개발 시작
4. PR 생성 시 프로세스 확인

**Happy Coding! 🎨**

---

**마지막 업데이트**: 2024-11-20
**버전**: 1.0

