# User Flow: User Management Domain

## 🎯 개요

**도메인**: User Management  
**작성자**: UX/UI 디자이너 + 기획자  
**작성일**: 2025-10-11  
**버전**: v1.0

**Process Model 참조**: `02-process-model.md`  
**다음 단계**: `04-frontend-specification.md`

---

### 문서 목적

이 문서는 User Management Domain의 사용자 여정을 정의합니다.  
Process Model의 비즈니스 프로세스를 기반으로 실제 화면 흐름과 사용자 인터랙션을 상세히 설명합니다.

**범위**:
- 사용자 화면 흐름 정의
- UI 컴포넌트 및 인터랙션 명세
- 에러 처리 및 피드백 방법

**제외 사항** (Frontend Specification에서 다룸):
- React 컴포넌트 구현 상세
- 상태 관리 방법 (useState, Context API 등)
- Server Actions 연동 상세

---

## 📍 Scenario 1: 유저 가입 및 온보딩

### 비즈니스 컨텍스트

- **Process Model 참조**: Scenario 1 in `02-process-model.md`
- **사용자 목표**: 구글 계정으로 빠르게 서비스에 가입하고 사용 시작
- **주요 제약**: 
  - 구글 OAuth 로그인만 지원
  - 프로필 + 기본 조직 자동 생성 (백엔드 트랜잭션)
  - 가입 실패 시 재시도 가능

---

### Screen 1: 로그인 화면

**화면 구성**:
- **좌측 영역** (데스크톱) / **상단 영역** (모바일):
  - 서비스 로고
  - 서비스 소개 텍스트
  - 주요 기능 소개
- **우측 영역** (데스크톱) / **하단 영역** (모바일):
  - 로그인 카드
  - 구글 로그인 버튼
  - 이용약관 및 개인정보처리방침 링크

**UI 컴포넌트**:
- **서비스 소개 영역**:
  - 헤드라인: "xBowl에 오신 것을 환영합니다"
  - 서브텍스트: 주요 기능 설명
  - (선택사항) 서비스 후기 또는 스크린샷
  
- **로그인 카드**:
  - 카드 컨테이너 (중앙 정렬, 최대 너비 제한)
  - 제목: "로그인"
  - 구글 로그인 버튼 (`OAuthButtons` 컴포넌트)
    - 구글 아이콘 + "Google로 계속하기" 텍스트
    - 버튼 스타일: 흰색 배경, 테두리, 호버 효과
  - 하단: "계속 진행하면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다"

**인터랙션**:
- 구글 로그인 버튼 클릭 → Google OAuth 페이지 이동
- OAuth 인증 완료 → 온보딩 화면으로 리다이렉트
- 이용약관 링크 클릭 → 새 탭에서 이용약관 페이지 열기
- 개인정보처리방침 링크 클릭 → 새 탭에서 개인정보처리방침 페이지 열기

**화면 전환**:
- **조건**: OAuth 인증 성공
- **전환**: Screen 1 → Screen 2 (온보딩 화면)
- **전환 방식**: 페이지 리다이렉트 (`/auth/callback` → `/onboarding`)

**접근성**:
- 키보드 네비게이션: Tab 키로 버튼 이동, Enter로 실행
- 스크린 리더: "Google로 로그인" 읽기
- 포커스 인디케이터: 버튼 포커스 시 아웃라인 표시

---

### Screen 2: 온보딩 화면 (프로필 + 조직 생성 처리)

**화면 구성**:
- **중앙 정렬 컨테이너**:
  - 상태 아이콘 (로딩/성공/실패)
  - 상태 메시지 (제목 + 설명)
  - 액션 버튼 (실패 시만 표시)

**UI 컴포넌트** (실제 구현 기준):

**1) 로딩 상태** (`status === 'loading'`):
- **스피너**:
  - 크기: h-12 w-12
  - 스타일: 회전 애니메이션 (animate-spin)
  - 색상: 파란색 테두리 (border-b-2 border-blue-600)
  - 위치: 중앙 상단
- **제목**: "계정을 설정하고 있습니다" (text-xl font-semibold)
- **설명**: "잠시만 기다려주세요..." (text-gray-600)

**2) 성공 상태** (`status === 'success'`):
- **체크 아이콘**:
  - 컨테이너: 녹색 배경 원형 (bg-green-100, h-12 w-12)
  - 아이콘: 체크마크 SVG (text-green-600)
- **제목**: "설정이 완료되었습니다!" (text-xl font-semibold)
- **설명**: "잠시 후 홈페이지로 이동합니다..." (text-gray-600)
- **자동 리다이렉트**: 1.5초 후 `/` (메인 대시보드)로 이동

**3) 실패 상태** (`status === 'error'`):
- **X 아이콘**:
  - 컨테이너: 빨간색 배경 원형 (bg-red-100, h-12 w-12)
  - 아이콘: X 마크 SVG (text-red-600)
- **제목**: "설정 중 오류가 발생했습니다" (text-xl font-semibold)
- **에러 메시지**: 
  - 서버에서 받은 에러 메시지 표시
  - 기본 메시지: "알 수 없는 오류가 발생했습니다."
  - 색상: text-gray-600
- **"다시 시도" 버튼**:
  - 스타일: bg-blue-600 hover:bg-blue-700, text-white
  - 패딩: py-2 px-4
  - 모서리: rounded-md
  - 트랜지션: transition-colors

**인터랙션**:
- **자동 실행**: 화면 진입 시 자동으로 `processUserRegistrationAction()` 호출
  - Supabase Auth 유저 생성
  - 프로필 생성 (profiles 테이블)
  - 기본 조직 생성 (Organization Domain)
  
- **성공 시**:
  - 로딩 → 성공 상태로 전환
  - 1.5초 대기 (사용자가 성공 메시지 확인)
  - 자동으로 `/` (메인 대시보드)로 리다이렉트
  
- **실패 시**:
  - 로딩 → 실패 상태로 전환
  - 에러 메시지 표시
  - "다시 시도" 버튼 활성화
  
- **"다시 시도" 버튼 클릭**:
  - 페이지 새로고침 (`window.location.reload()`)
  - 처음부터 다시 시작

**화면 전환**:
- **조건**: 프로필 + 조직 생성 성공
- **전환**: Screen 2 → 메인 대시보드 (`/`)
- **전환 방식**: 자동 페이지 리다이렉트 (1.5초 후)

**애니메이션**:
- **로딩 스피너**: 
  - 회전 애니메이션 (animate-spin, Tailwind 기본 애니메이션)
  - 무한 반복
- **성공 아이콘**: 
  - 페이드인 효과 (implicit, 상태 전환 시)
- **실패 아이콘**: 
  - 페이드인 효과 (implicit, 상태 전환 시)
- **자동 리다이렉트**: 
  - 1.5초 딜레이 (사용자가 성공 메시지 읽을 시간 제공)

**에러 처리**:
- **프로필 생성 실패**: "프로필 생성에 실패했습니다" 메시지
- **기본 조직 생성 실패**: "기본 조직 생성에 실패했습니다" 메시지
- **네트워크 오류**: "네트워크 연결을 확인해주세요" 메시지
- **알 수 없는 오류**: "알 수 없는 오류가 발생했습니다" 기본 메시지

**접근성**:
- 스피너에 aria-label: "로딩 중"
- 성공/실패 상태 변경 시 스크린 리더 알림
- "다시 시도" 버튼 포커스 가능

---

### Screen 3: 메인 대시보드 (리다이렉트)

**화면 구성**:
- 성공 후 자동으로 이동
- Organization Management Domain에서 조직 선택 UI 표시
- Workspace Domain에서 워크스페이스 구조 표시

**Note**: 이 화면은 Organization Management Domain과 Workspace Structure Domain에서 정의됨

---

## 📱 반응형 고려사항

### 데스크톱 (1024px 이상)
- **로그인 화면**: 좌우 2단 레이아웃 (서비스 소개 | 로그인 카드)
- **온보딩 화면**: 중앙 정렬 카드 (max-width: 28rem)

### 태블릿 (768px - 1023px)
- **로그인 화면**: 상하 레이아웃 (서비스 소개 위, 로그인 카드 아래)
- **온보딩 화면**: 중앙 정렬 카드 (패딩 조정)

### 모바일 (767px 이하)
- **로그인 화면**: 단일 컬럼 레이아웃
- **온보딩 화면**: 전체 화면 사용 (패딩: p-4)

---

## 🔗 다음 단계

User Flow 정의가 완료되었습니다. 다음 단계로 진행합니다:

### Frontend Specification 작성
- **입력 문서**: 
  - `02-process-model.md` (비즈니스 프로세스)
  - `03-user-flow.md` (화면 흐름 및 UI 정의)
- **담당자**: 프론트엔드 개발자
- **산출물**: `04-frontend-specification.md`

### Frontend Specification에서 다룰 내용:
- React Context 설계 (`UserContext`)
- Custom Hooks (`useUser`)
- UI 컴포넌트 구현 (`OAuthButtons`, `OnboardingPage`)
- Server Actions 연동 (`processUserRegistrationAction`)
- DTO 직렬화 (User → UserProfileView)

---

## 📝 작성 노트

### Scenario 1 구현 상태
- ✅ **Screen 1 (로그인)**: `OAuthButtons` 컴포넌트 구현 완료
- ✅ **Screen 2 (온보딩)**: `onboarding/page.tsx` 구현 완료
  - 로딩/성공/실패 상태 처리
  - 자동 리다이렉트
  - 재시도 기능
- ✅ **OAuth 콜백**: `/auth/callback/route.ts` 구현 완료

### Scenario 2 (계정 삭제)
- 📋 미구현 (향후 작성 예정)

### 조직 조회 및 선택
- ℹ️ Organization Management Domain으로 이관
- User Management Domain은 가입 및 프로필 관리에만 집중

---

*이 User Flow 문서는 User Management Domain의 Frontend Specification 작성을 위한 기반 자료입니다.*

