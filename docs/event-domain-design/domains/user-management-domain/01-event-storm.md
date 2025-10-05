# User Management Domain - Event Storming

## 📊 Domain Overview
**비즈니스 가치**: 사용자 인증, 조직 관리, 멤버 권한 제어를 통해 안전하고 체계적인 플랫폼 접근 관리를 제공. 모든 도메인의 기반이 되는 핵심 보안 및 인증 레이어 역할.

## 📝 핵심 개념 정리

### 사용자 인증 및 데이터 관리 전략
- **사용자**: 플랫폼 인증 시스템에서 기본 사용자 관리, 추가 프로필 정보 및 개인 설정 저장
- **조직**: 플랫폼에서 직접 조직 관리, 조직별 설정 및 메타데이터 저장
- **초대**: 플랫폼에서 초대 생성/관리, 초대 상태 및 메타데이터 저장
- **인증 방식**: 자동 로그인 유지, 백그라운드에서 세션 관리

### 사용자-조직 계층 구조
```
사용자 (플랫폼 계정)
├── 소유 조직 (소유자 관계)
│   ├── 조직 A (소유)
│   └── 조직 B (소유)
└── 소속 조직 (멤버 관계)
    ├── 조직 C (멤버)
    └── 조직 D (멤버)
```

### 도메인 범위 및 경계
- **사용자**: 플랫폼 계정으로 연결된 사용자 정보 (인증 + 프로필)
- **조직**: 플랫폼에서 관리하는 조직 정보 (기본 정보 + 설정)
- **멤버십**: 사용자-조직 간 관계 (역할: 소유자, 관리자, 멤버)
- **초대**: 조직 멤버 초대 링크 및 상태 관리

### 비즈니스 규칙 및 정책
- **기본 조직 정책**: 사용자 등록 시 개인 조직 자동 생성 (사용자가 소유자)
- **초대 정책**: 이메일 기반 초대, 30일 후 자동 만료
- **삭제 정책**: 조직 소프트 삭제 후 30일 보관, 이후 완전 삭제
- **권한 정책**: 소유자 > 관리자 > 멤버 (현재 3단계 역할만 지원)

---

## 🟠 Domain Events (시간 순서)

### 유저 가입 & 온보딩 Events
- 구글 OAuth 코드 전달받음 (Google Login 외부 시스템)
- Supabase 유저 생성됨 (Supabase Auth 외부 시스템)
- 유저 프로필이 생성됨 (User Profile Created)
- 기본 조직이 생성됨 (Default Organization Created)
- 유저 가입 완료됨 (User Registration Completed)
- 유저 가입 실패함 (User Registration Failed)
- 온보딩이 완료됨 (프론트엔드) (Onboarding Completed)

### 사용자 & 세션 Events
- Supabase Auth에서 처리
- 유저가 로그인함 (User Logged In)
- 유저가 로그아웃함 (User Logged Out)
- 유저의 세션이 갱신됨 (User Session Refreshed)

### 조직 관리 Events
- 유저 관련 조직이 조회됨 (Related Organization Retrieved)
- 초기 조직이 선택됨 (프론트엔드) (Default Organization Selected)
- 유저가 조직을 선택함 (프론트엔드) (Organization Selected)
- 새로운 조직이 생성됨 (New Organization Created)
2025-09-29
-----

### 멤버 초대 & 관리 Events
- 이메일로 멤버 초대가 전송됨 (Member Invitation Sent via Email)
- 초대 링크가 생성됨 (Invitation Link Generated)
- 초대 정보가 저장됨 (Invitation Info Stored)
- 초대받은 사용자가 링크를 클릭함 (Invitation Link Clicked)
- 초대가 수락됨 (Invitation Accepted)
- 초대가 거절됨 (Invitation Rejected)
- 초대가 만료됨 (Invitation Expired - 30일)
- 새 멤버가 조직에 추가됨 (New Member Added to Organization)
- 멤버 역할이 설정됨 (Member Role Assigned)
- 멤버 역할이 변경됨 (Member Role Changed)
- 멤버가 조직에서 제거됨 (Member Removed from Organization)

### 조직 관리 & 삭제 Events
- 조직 정보가 수정됨 (Organization Information Updated)
- 조직 소유권 이전이 요청됨 (Organization Ownership Transfer Requested)
- 조직 소유권이 이전됨 (Organization Ownership Transferred)
- 조직 삭제가 요청됨 (Organization Deletion Requested)
- 조직이 소프트 삭제됨 (Organization Soft Deleted)
- 조직 관련 데이터가 정리됨 (Organization Related Data Cleaned Up)
- 조직이 완전히 삭제됨 (Organization Permanently Deleted - 30일 후)

---

## 🔵 Commands & Actors (Phase 2.2 결과)

### 주요 커맨드 목록 (Process Model Scenario 0-1 기준)

#### Scenario 0: 유저 가입 및 온보딩 Commands
- **구글 로그인 선택** (방문자) → 구글 OAuth 코드 전달받음
- **유저 가입 처리하기** (User Authentication System) → 유저 가입 완료됨/실패함
- **Supabase 유저 생성하기** (Supabase Auth System) → Supabase 유저 생성됨
- **프로필 생성 처리하기** (Profile System) → 유저 프로필이 생성됨
- **기본 조직 생성하기** (Organization System) → 기본 조직이 생성됨
- **온보딩 진행하기** (유저) → 온보딩이 완료됨

#### Scenario 1: 조직 조회 및 선택 Commands
- **유저 관련 조직을 조회하기** (Organization System) → 유저 관련 조직이 조회됨
- **초기 조직을 선택하기** (프론트엔드) → 초기 조직이 선택됨
- **조직 선택하기** (유저) → 조직 선택됨

#### Scenario 2: 새로운 조직 생성 Commands  
- **새로운 조직 생성하기** (유저) → 새로운 조직이 생성됨
- **조직 생성 처리하기** (Organization System) → 조직 생성이 완료됨

#### 기존 Commands (Scenario 3-8)
- **멤버 초대하기** (조직 소유자/관리자) → 이메일로 멤버 초대가 전송됨
- **초대 링크 생성하기** (플랫폼 시스템) → 초대 링크가 생성됨
- **초대 정보 저장하기** (시스템) → 초대 정보가 저장됨
- **초대 링크 클릭하기** (초대받은 사용자) → 초대받은 사용자가 링크를 클릭함
- **초대 수락하기** (초대받은 사용자) → 초대가 수락됨
- **초대 거절하기** (초대받은 사용자) → 초대가 거절됨
- **초대 만료 처리하기** (시스템 배치 작업) → 초대가 만료됨
- **멤버 추가하기** (플랫폼 시스템) → 새 멤버가 조직에 추가됨
- **멤버 역할 설정하기** (조직 소유자/관리자) → 멤버 역할이 설정됨
- **멤버 역할 변경하기** (조직 소유자/관리자) → 멤버 역할이 변경됨
- **멤버 제거하기** (조직 소유자/관리자) → 멤버가 조직에서 제거됨
- **조직 정보 수정하기** (조직 소유자/관리자) → 조직 정보가 수정됨
- **조직 소유권 이전 요청하기** (조직 소유자) → 조직 소유권 이전이 요청됨
- **조직 소유권 이전 승인하기** (새 소유자, 즉시 처리) → 조직 소유권이 이전됨
- **조직 삭제 요청하기** (조직 소유자) → 조직 삭제가 요청됨
- **조직 소프트 삭제하기** (시스템) → 조직이 소프트 삭제됨
- **조직 데이터 정리하기** (시스템) → 조직 관련 데이터가 정리됨
- **조직 완전 삭제하기** (시스템 배치 작업) → 조직이 완전히 삭제됨

### 식별된 액터 분류 (Process Model 기준)

#### Primary Actors (직접 사용자)
- **방문자 (Visitor)**: 서비스에 방문한 가입하지 않은 자와 가입자 모두 일컬는 말
- **유저 (User)**: 방문자 중 서비스에 가입한 자
- **조직 소유자/관리자**: 조직 관리 권한을 가진 유저
- **조직 소유자**: 조직 소유자만 가능한 작업 (소유권 이전, 조직 삭제)
- **초대받은 유저**: 아직 조직에 속하지 않았지만 참여 권한이 있는 유저

#### System Actors (내부 시스템)
- **User Authentication System**: 유저 가입 처리 및 인증 관리
- **Profile System**: 유저 프로필 생성 및 관리 (UUID 기반)
- **Organization System**: 조직 생성, 조회, 권한 관리 (org_ 접두사)
- **프론트엔드 (Frontend)**: UI 상태 관리, 초기 조직 선택 로직

#### External Systems (외부 시스템)
- **Google OAuth**: 구글 로그인 인증 처리
- **Supabase Auth System**: 구글 인증 코드 검증, 유저 계정 생성 (SSOT)

---

## 🟠 Bounded Context 정의 (Phase 2.4 결과)

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
- 유저 관련 조직이 조회됨 (Related Organization Retrieved)
- 초기 조직이 선택됨 (프론트엔드)
- 유저가 조직을 선택함 (프론트엔드)

### Context 2: Organization Management Context 🟩
**책임**: 조직 생성/관리, 조직 선택, 소유권 이전, 삭제
**핵심 언어**: Organization, Owner, Context, Transfer, Deletion

**핵심 용어 및 개념:**
- **Organization**: 유저들이 소속되는 조직 단위
- **Default Organization**: 유저 가입 시 자동 생성되는 개인 조직
- **Owner**: 조직의 최고 권한자 (소유권 이전, 조직 삭제 가능)
- **Organization Context**: 현재 작업 중인 조직 환경
- **Organization Selection**: 유저가 작업할 조직을 선택하는 행위
- **Ownership Transfer**: 조직 소유권을 다른 유저에게 이전
- **Soft Delete**: 조직을 즉시 삭제하지 않고 30일간 보관
- **Permanent Delete**: 30일 후 조직과 관련 데이터 완전 삭제

**포함 이벤트:**
- 기본 조직이 생성됨 (Default Organization Created)
- 조직 정보가 수정됨 (Organization Information Updated)
- 조직 소유권 이전이 요청됨 (Organization Ownership Transfer Requested)
- 조직 소유권이 이전됨 (Organization Ownership Transferred)
- 조직 삭제가 요청됨 (Organization Deletion Requested)
- 조직이 소프트 삭제됨 (Organization Soft Deleted)
- 조직 관련 데이터가 정리됨 (Organization Related Data Cleaned Up)
- 조직이 완전히 삭제됨 (Organization Permanently Deleted - 30일 후)

### Context 3: Member & Invitation Management Context 🟨
**책임**: 멤버 초대, 초대 링크 관리, 멤버십 관리, 역할 관리
**핵심 언어**: Member, Invitation, Role, Admin, Invite

**핵심 용어 및 개념:**
- **Member**: 조직에 소속된 유저 (Owner, Admin, Member 역할 보유)
- **Invitation**: 조직에 새 멤버를 초대하는 과정 및 상태
- **Invitation Link**: 플랫폼에서 생성된 초대 전용 링크 (30일 유효)
- **Email Verification**: 초대 링크 보안을 위한 이메일 주소 검증
- **Role**: 조직 내 유저 권한 수준
  - **Owner**: 조직 소유자 (모든 권한, 소유권 이전/조직 삭제 가능)
  - **Admin**: 조직 관리자 (멤버 초대/관리, 조직 정보 수정 가능)
  - **Member**: 일반 멤버 (기본 사용 권한)
- **Membership**: 유저와 조직 간의 소속 관계
- **Invitation Status**: 초대 상태 (Pending, Accepted, Rejected, Expired)
- **Role Assignment**: 멤버에게 역할을 부여하는 과정
- **Member Removal**: 조직에서 멤버를 제거하는 과정

**포함 이벤트:**
- 이메일로 멤버 초대가 전송됨
- 초대 링크가 생성됨
- 초대 정보가 저장됨
- 초대받은 사용자가 링크를 클릭함
- 초대가 수락됨 / 거절됨 / 만료됨
- 새 멤버가 조직에 추가됨
- 멤버 역할이 설정됨 / 변경됨
- 멤버가 조직에서 제거됨

### Context 간 관계 및 통합점

#### Authentication ↔ Organization Management
- **연결점**: 인증된 유저의 조직 접근 권한 확인
- **통합 방식**: User ID 기반 조직 목록 조회
- **공유 개념**: User ID, Authentication Status, User Context

#### Organization Management ↔ Member & Invitation
- **연결점**: 조직 컨텍스트에서 멤버 관리 작업 수행
- **통합 방식**: Organization ID 기반 멤버십 관리
- **공유 개념**: Organization ID, Organization Context, Owner/Admin 권한

#### Authentication ↔ Member & Invitation
- **연결점**: 초대받은 유저의 인증 상태 확인
- **통합 방식**: User ID 기반 멤버십 확인
- **공유 개념**: User ID, Email Address, Authentication Status

#### 모든 Context ↔ 플랫폼 데이터 관리
- **연결점**: 플랫폼 데이터 관리가 모든 Context에 영향
- **통합 방식**: 각 Context 내에서 데이터 관리 이벤트 처리
- **공유 개념**: 유저 ID, 플랫폼 이벤트, 데이터 상태, 오류 처리

### 도메인 전체 공통 용어
- **유저 ID**: 플랫폼에서 관리하는 유저 고유 식별자
- **조직 ID**: 플랫폼에서 관리하는 조직 고유 식별자  
- **데이터 관리**: 플랫폼 내 데이터 일관성을 유지하는 과정
- **Context**: 현재 작업 환경 또는 상태를 나타내는 개념

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음

1. **초대 링크 보안 취약점**
   - 문제: 초대 링크 유출 시 무단 접근 가능성
   - 영향: 조직 보안 침해, 민감한 데이터 접근
   - 해결: ✅ **이메일 검증 단계 추가** - 초대받은 이메일 주소 확인으로 링크 유출 시에도 안전

### 우선순위: 중간
3. **조직 삭제 시 데이터 정리 복잡성**
   - 문제: 조직 완전 삭제 시 연관된 모든 도메인 데이터 정리 필요
   - 영향: 데이터 불일치, 고아 레코드 발생 가능성
   - 해결: ✅ **완전 삭제 시에만 전체 데이터 정리** - 소프트 삭제는 단순 상태 변경

### 우선순위: 낮음
4. **조직 컨텍스트 전환 UX**
   - 문제: 여러 조직 소속 시 컨텍스트 전환 혼란
   - 영향: 사용자 경험 저하, 잘못된 조직에서 작업
   - 해결: ✅ **Organization Switcher UI** - 명확한 조직 전환 인터페이스 제공

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)

1. **기본 3단계 역할 시스템**
   - 기회: 단순하고 명확한 권한 관리 체계 구축
   - 구현: 소유자/관리자/멤버 역할 정의, 권한 매트릭스 구현

### 향후 구현 (Post-MVP)
2. **고급 초대 기능** *(메모)*
   - 벌크 초대 기능 (CSV 업로드)
   - 초대 템플릿 관리
   - 조건부 초대 (특정 이메일 도메인 제한)

3. **감사 로그 및 모니터링** *(메모)*
   - 사용자/조직 변경 이력 추적
   - 보안 이벤트 모니터링
   - 컴플라이언스 리포팅

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

### 4. 초대 및 멤버십 관리
- Q: 초대 링크 클릭 시 사용자가 이미 다른 계정으로 로그인된 경우 어떻게 처리할 것인가?
- Q: 조직 소유자가 실수로 자신을 제거하려 할 때 어떻게 방지할 것인가?
- Q: 멤버 역할 변경 시 기존 권한은 즉시 반영되는가, 아니면 다음 로그인 시 반영되는가?

### 5. 조직 삭제 및 데이터 정리
- Q: 조직 삭제 시 다른 도메인의 데이터(워크스페이스, 페이지 등)는 어떤 순서로 정리할 것인가?
- Q: 30일 대기 기간 중 조직 복구는 어떤 과정을 거쳐야 하는가?
- Q: 조직 완전 삭제 시 백업 데이터는 얼마나 보관할 것인가?

### 6. 보안 및 권한 통합
- Q: 다른 도메인에서 사용자 권한을 확인할 때 어떤 API를 사용할 것인가?
- Q: 조직 컨텍스트 변경 시 다른 도메인의 캐시된 권한 정보는 어떻게 무효화할 것인가?
- Q: 플랫폼 인증 시스템을 어떻게 통합하여 일관된 권한 체계를 만들 것인가?

---

## 📝 Process Model 준비 상태

User Management Domain의 핵심 이벤트와 문제점들이 정리되었으므로, 다음 단계로:

1. **Command** 식별: 각 이벤트를 트리거하는 유저 액션 (로그인, 초대 전송, 조직 삭제 등)
2. **Policy** 정의: Supabase Auth 동기화 규칙, 권한 제약사항, 조직 삭제 정책
3. **Read Model** 명시: 조직 목록 조회, 멤버 목록, 권한 확인에 필요한 정보
4. **External System**: Supabase Auth API 호출, 구글 OAuth 처리, 이메일 발송

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
- [x] 도메인 이벤트 목록 완성 (33개 이벤트 식별)
- [x] 커맨드 및 액터 식별 완료 (Supabase Auth + 구글 로그인 기반)
- [x] Bounded Context 경계 정의 완료 (User Management Domain)
- [x] 핵심 Hotspot 및 Opportunity 정리 완료 (5개 핫스팟, 4개 기회)
- [x] Process Modeling을 위한 질문 정리 완료 (18개 핵심 질문)

---

## 🔗 연관 도메인

### Workspace Structure Domain과의 관계
- **연결점**: 사용자/조직 권한을 기반으로 워크스페이스 접근 제어
- **이벤트 흐름**: User Management → Workspace Structure (권한 확인)
- **통합 방식**: API 호출 기반 권한 검증

### 모든 다른 도메인과의 관계
- **연결점**: 모든 도메인에서 사용자 인증 및 조직 컨텍스트 필요
- **이벤트 흐름**: User Management → All Domains (인증/권한 정보 제공)
- **통합 방식**: 공통 인증 레이어, 권한 확인 API

---

*이 Event Storming 문서는 User Management Domain의 Process Model 작성을 위한 기반 자료입니다.*

