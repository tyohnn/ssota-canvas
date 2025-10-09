# User Management Domain - Event Storming

## 📊 Domain Overview
**비즈니스 가치**: 사용자 인증, 프로필 관리를 통해 안전하고 체계적인 플랫폼 접근 관리를 제공. 모든 도메인의 기반이 되는 핵심 보안 및 인증 레이어 역할.

## 📝 핵심 개념 정리

### 사용자 인증 및 데이터 관리 전략
- **사용자**: 플랫폼 인증 시스템에서 기본 사용자 관리, 추가 프로필 정보 및 개인 설정 저장
- **인증 방식**: 자동 로그인 유지, 백그라운드에서 세션 관리

### 사용자-조직 계층 구조
```
사용자 (플랫폼 계정)
├── 기본 조직 (소유자 관계) - Organization Management Domain에서 관리
└── 소속 조직 (멤버 관계) - Organization Management Domain에서 관리
```

### 도메인 범위 및 경계
- **사용자**: 플랫폼 계정으로 연결된 사용자 정보 (인증 + 프로필)
- **기본 조직 생성**: 사용자 등록 시 개인 조직 자동 생성 (Organization Management Domain으로 이벤트 발행)

### 비즈니스 규칙 및 정책
- **기본 조직 정책**: 사용자 등록 시 개인 조직 자동 생성 (사용자가 소유자)
- **인증 정책**: 구글 OAuth를 통한 유일한 로그인 방식

---

## 🟠 Domain Events (시간 순서)

### 유저 가입 & 온보딩 Events
- 구글 OAuth 코드 전달받음 (Google Login 외부 시스템)
- Supabase 유저 생성됨 (Supabase Auth 외부 시스템)
- 유저 프로필이 생성됨 (User Profile Created)
- 유저 가입 완료됨 (User Registration Completed) → **Organization Management Domain으로 이벤트 발행**
- 유저 가입 실패함 (User Registration Failed)
- 온보딩이 완료됨 (프론트엔드) (Onboarding Completed)

### 사용자 & 세션 Events
- Supabase Auth에서 처리
- 유저가 로그인함 (User Logged In)
- 유저가 로그아웃함 (User Logged Out)
- 유저의 세션이 갱신됨 (User Session Refreshed)

### 프로필 관리 Events
- 유저 프로필이 수정됨 (User Profile Updated)
- 유저 프로필 이미지가 변경됨 (User Profile Image Changed)
- 유저 기본 정보가 변경됨 (User Basic Information Changed)

---

## 🔵 Commands & Actors (Phase 2.2 결과)

### 주요 커맨드 목록

#### Scenario 0: 유저 가입 및 온보딩 Commands
- **구글 로그인 선택** (방문자) → 구글 OAuth 코드 전달받음
- **유저 가입 처리하기** (User Authentication System) → 유저 가입 완료됨/실패함
- **Supabase 유저 생성하기** (Supabase Auth System) → Supabase 유저 생성됨
- **프로필 생성 처리하기** (Profile System) → 유저 프로필이 생성됨
- **온보딩 진행하기** (유저) → 온보딩이 완료됨

#### Scenario 1: 프로필 관리 Commands
- **프로필 정보 수정하기** (유저) → 유저 프로필이 수정됨
- **프로필 이미지 변경하기** (유저) → 유저 프로필 이미지가 변경됨
- **기본 정보 변경하기** (유저) → 유저 기본 정보가 변경됨

### 식별된 액터 분류

#### Primary Actors (직접 사용자)
- **방문자 (Visitor)**: 서비스에 방문한 가입하지 않은 자와 가입자 모두 일컬는 말
- **유저 (User)**: 방문자 중 서비스에 가입한 자

#### System Actors (내부 시스템)
- **User Authentication System**: 유저 가입 처리 및 인증 관리
- **Profile System**: 유저 프로필 생성 및 관리 (UUID 기반)

#### External Systems (외부 시스템)
- **Google OAuth**: 구글 로그인 인증 처리
- **Supabase Auth System**: 구글 인증 코드 검증, 유저 계정 생성 (SSOT)
- **프론트엔드 (Frontend)**: UI 상태 관리, 온보딩 로직
- **Organization System**: 조직 관리

---

## 🟠 Bounded Context 정의

### Context 1: Authentication & Session Context 🟦
**책임**: 유저 인증, 세션 관리
**핵심 언어**: User, Session, Login, Authentication

**핵심 용어 및 개념:**
- **User**: 서비스 사용자 (Supabase Auth로 식별)
- **Authentication**: 유저 신원 확인 과정
- **Google Login**: 구글 계정을 통한 로그인 방식 (유일한 로그인 방법)
- **Google Integration**: 구글 OAuth 연동 과정
- **Session**: 로그인 상태 유지 기간
- **Login/Logout**: 인증 시작/종료 액션
- **Sign up**: 새 유저 가입 과정
- **Profile**: 유저 프로필 정보 관리
- **Token**: 인증 상태를 나타내는 토큰
- **Auto-Refresh**: 세션이 유효한 동안 자동으로 토큰 갱신
- **Session Expiration**: 세션 만료 시점 및 처리
- **Re-Authentication**: 만료된 세션으로 재접속 시 재인증 요구

**포함 이벤트:**
- 구글 OAuth 코드 전달받음 (Google Login 외부 시스템)
- Supabase 유저 생성됨 (Supabase Auth 외부 시스템)
- 유저 프로필이 생성됨 (User Profile Created)
- 유저 가입 완료됨 (User Registration Completed)
- 유저 가입 실패함 (User Registration Failed)
- 온보딩이 완료됨 (프론트엔드)
- 유저가 로그인함 (User Logged In)
- 유저가 로그아웃함 (User Logged Out)
- 유저의 세션이 갱신됨 (User Session Refreshed)

### Context 2: Profile Management Context 🟩
**책임**: 유저 프로필 관리, 개인 정보 관리
**핵심 언어**: Profile, Personal Information, Avatar, Settings

**핵심 용어 및 개념:**
- **Profile**: 유저 프로필 정보 관리
- **Personal Information**: 개인 정보 (이름, 이메일, 프로필 이미지)
- **Avatar**: 프로필 이미지
- **Profile Settings**: 프로필 설정
- **Basic Information**: 기본 정보 (이름, 이메일)
- **Profile Image**: 프로필 이미지 URL

**포함 이벤트:**
- 유저 프로필이 생성됨 (User Profile Created)
- 유저 프로필이 수정됨 (User Profile Updated)
- 유저 프로필 이미지가 변경됨 (User Profile Image Changed)
- 유저 기본 정보가 변경됨 (User Basic Information Changed)

### Context 간 관계 및 통합점

#### User Management ↔ Organization Management
- **연결점**: 사용자 등록 시 기본 조직 생성
- **통합 방식**: User Management에서 "기본 조직 생성하기" 커맨드 실행
- **공유 개념**: User ID, User Profile Data

#### User Management ↔ Notification Management
- **연결점**: 사용자 프로필 변경 시 관련 알림 정리
- **통합 방식**: User Management에서 "프로필 변경 알림 생성하기" 커맨드 실행
- **공유 개념**: User ID, Profile Context

### 도메인 전체 공통 용어
- **유저 ID**: 플랫폼에서 관리하는 유저 고유 식별자
- **프로필 데이터**: 유저의 개인 정보 및 설정
- **인증 상태**: 유저의 로그인 상태 및 세션 정보

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음

1. **구글 OAuth 연동 실패**
   - 문제: 구글 OAuth 연동 실패 시 사용자 경험 저하
   - 영향: 사용자 가입 실패, 서비스 접근 불가
   - 해결: ✅ **재시도 메커니즘 구현** - OAuth 실패 시 자동 재시도 및 사용자 안내

### 우선순위: 중간

2. **프로필 데이터 동기화**
   - 문제: 구글 계정 정보와 플랫폼 프로필 간 동기화 이슈
   - 영향: 프로필 정보 불일치, 사용자 혼란
   - 해결: ✅ **실시간 동기화** - 구글 계정 정보 변경 시 자동 동기화

### 우선순위: 낮음

3. **세션 관리 복잡성**
   - 문제: 세션 만료 시 사용자 경험 저하
   - 영향: 사용자 경험 저하, 재로그인 필요
   - 해결: ✅ **자동 세션 갱신** - Supabase Auth의 자동 토큰 갱신 활용

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)

1. **기본 프로필 관리 시스템**
   - 기회: 사용자 프로필 정보 관리 체계 구축
   - 구현: 프로필 생성/수정/조회 기능, 구글 계정 정보 동기화

### 향후 구현 (Post-MVP)

2. **고급 프로필 기능**
   - 프로필 이미지 업로드
   - 개인 설정 관리
   - 계정 연동 관리

3. **보안 강화**
   - 2단계 인증
   - 로그인 이력 추적
   - 보안 알림

---

## ❓ Process Modeling을 위한 주요 질문들

### 1. 유저 가입 및 데이터 관리 (핵심)
- Q: 유저 가입 실패 시 어떤 재시도 전략을 사용할 것인가?
- Q: 유저 가입 실패를 방문자에게 어떻게 알리고 복구할 것인가?
- Q: 플랫폼 내 데이터 불일치를 어떻게 감지하고 해결할 것인가?

### 2. 구글 로그인 및 인증 처리
- Q: 구글 로그인 실패 시 사용자에게 어떤 오류 메시지를 표시할 것인가?
- Q: 구글 OAuth 연동 실패 시 재시도 메커니즘은 어떻게 구현할 것인가?
- Q: 구글 계정 정보(이름, 이메일, 프로필 이미지)를 어떻게 플랫폼 프로필에 동기화할 것인가?

### 3. 세션 관리 및 자동 갱신
- Q: 유저가 활성 상태일 때 세션 자동 갱신은 어떤 주기로 수행할 것인가? -> Supabase Auth에서 처리
- Q: 세션 만료 시 사용자에게 어떤 방식으로 알림을 표시할 것인가? -> Supabase Auth에서 처리
- Q: 만료된 세션으로 재접속 시 로그인 페이지로 리다이렉트할 것인가, 아니면 모달로 처리할 것인가? -> 리다이렉션

### 4. 프로필 관리
- Q: 구글 계정 정보 변경 시 플랫폼 프로필을 어떻게 동기화할 것인가?
- Q: 프로필 이미지 변경 시 기존 이미지는 어떻게 처리할 것인가?
- Q: 사용자가 계정을 삭제하려 할 때 어떤 과정을 거쳐야 하는가?

---

## 📝 Process Model 준비 상태

User Management Domain의 핵심 이벤트와 문제점들이 정리되었으므로, 다음 단계로:

1. **Command** 식별: 각 이벤트를 트리거하는 유저 액션 (로그인, 프로필 수정 등)
2. **Policy** 정의: Supabase Auth 동기화 규칙, 프로필 관리 정책
3. **Read Model** 명시: 프로필 정보 조회, 인증 상태 확인에 필요한 정보
4. **External System**: Supabase Auth API 호출, 구글 OAuth 처리

Process Modeling으로 진행하시겠습니까?

---

## 📋 Event Storming 워크샵 정보 (참고용)

**1차 일시**: 2025년 9월 28일 19:00 (온라인)
**2차 일시**: 2025년 9월 29일 19:00 (온라인)
**참가자**: 
- **도메인 전문가**: CEO (사용자 관리 및 보안 정책)
- **PM**: AI Assistant
- **기획자**: AI Assistant
- **시니어 개발자**: AI Assistant

**워크샵 결과물**:
- [x] 도메인 이벤트 목록 완성 (사용자 인증/프로필 관련 이벤트 식별)
- [x] 커맨드 및 액터 식별 완료 (Supabase Auth + 구글 로그인 기반)
- [x] Bounded Context 경계 정의 완료 (User Management Domain)
- [x] 핵심 Hotspot 및 Opportunity 정리 완료
- [x] Process Modeling을 위한 질문 정리 완료

---

## 🔗 연관 도메인

### Organization Management Domain과의 관계
- **연결점**: 사용자 등록 시 기본 조직 생성
- **커맨드 실행**: User Management → Organization Management ("기본 조직 생성하기" 커맨드)
- **통합 방식**: 도메인 간 커맨드 실행 기반 통합


### 모든 다른 도메인과의 관계
- **연결점**: 모든 도메인에서 사용자 인증 및 프로필 정보 필요
- **커맨드 실행**: All Domains → User Management ("사용자 정보 조회하기" 커맨드)
- **통합 방식**: 도메인 간 커맨드 실행 기반 통합

---

*이 Event Storming 문서는 User Management Domain의 Process Model 작성을 위한 기반 자료입니다.*