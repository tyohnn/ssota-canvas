# User Management Domain - Process Model

## 🎯 Process Modeling Overview
User Management Domain의 핵심 시나리오를 실제 상호작용 순서에 따라 정의

### 📝 작성 원칙 (하이브리드 접근법)

#### ✅ 항상 작성된 내용 (비즈니스 프로세스)
- 비즈니스 정책 및 규칙 (자동 프로필 생성, 기본 조직 생성, 계정 삭제 규칙)
- 권한 기반 필터링 로직 (인증된 사용자만 접근 가능)
- 시스템 처리 흐름 (OAuth 인증, 프로필 생성, 조직 생성)
- 데이터 검증 규칙 (이메일 검증, 프로필 중복 검증)
- 외부 시스템 통합 (Supabase Auth, Organization Management)

#### ✅ 선택적으로 작성된 내용 (최소 UX 힌트)
- `*UI Hint:` 형태로 Frontend 팀을 위한 최소 힌트 제공
- 예시: `*UI Hint: 로그인 화면*`, `*UI Hint: 온보딩 화면*`
- `*Layered Authorization:` Frontend/Backend 역할 구분 명시 (필요 시)

#### ❌ 작성하지 않은 내용 (UI 과도 종속)
- 구체적인 컴포넌트 이름 (Supabase UI, shadcn/ui Button 등)
- 색상, 크기, 패딩 등 스타일 세부사항
- 애니메이션, 트랜지션 효과

> **참고**: 구체적인 UI/UX 설계는 `03-user-flow.md`에서 진행합니다.

### 🔄 시퀀스 기반 상호작용 순서
각 시나리오는 여러 시퀀스로 구성되며, 이벤트에 의해 다음 시퀀스가 트리거됩니다:

**Event** → **Policy** → **Read Model** → **Command** → **System** → **Event** → **Policy** → ...

1. **Event** (이전 시퀀스의 결과) → 2. **Policy** (이벤트에 따른 정책 적용) → 3. **Read Model** (시스템에서 사용자에게 제공하는 정보) → 4. **Command** (사용자가 입력하는 정보) → 5. **System** (처리 시스템) → 6. **Event** (결과 이벤트)

### 🟪 External System: Supabase Auth
User Management Domain은 Supabase Auth를 인증 시스템으로 사용합니다:
- **역할**: 사용자 인증, 세션 관리, 자동 토큰 갱신
- **SSOT**: Supabase Auth가 User의 Single Source of Truth
- **통합**: Supabase Auth ↔ public.profiles 테이블 간 실시간 동기화 필요

---

## 📍 Scenario 1: 유저 가입 및 온보딩

### Sequence 1: 방문자가 구글 로그인으로 서비스에 가입

**Trigger Event**: 로그인 페이지에 접근함
*UI Hint: 로그인 화면을 통해 트리거*

```
👤 방문자: "구글 계정으로 로그인해서 서비스에 가입하고 싶어"
```
*Note: 방문자 = 서비스 미가입 사용자, 유저 = 서비스 가입 완료 사용자*

**Policy**: 
- "Whenever 로그인 페이지에 접근됨, then always 로그인 옵션을 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 로그인 방식 선택 (구글 로그인)
- 서비스 소개 및 후기
- 개인정보 처리방침 및 이용약관 링크
- *UI Hint: 로그인 화면 (OAuth 버튼)*

**Command**: 구글 로그인 선택

**System**: Google OAuth System (External)
- 구글 OAuth 인증 프로세스 실행
- 사용자 동의 및 인증 코드 생성

**Events**:
1. 구글 OAuth 코드 전달받음 (Google OAuth Code Received)

---

**Policy**:
- "Whenever 구글 OAuth 코드 전달됨, then always 유저 가입 처리하기"

**Command**: 유저 가입 처리
- 구글 인증 코드

**System**: User Authentication System (Backend - Security Enforcement)
- **Supabase Auth 연동**:
  - 구글 인증 코드로 Supabase 유저 생성
  - 세션 토큰 생성 및 저장
- **프로필 생성**:
  - 기존 프로필 확인 (중복 방지)
  - 구글 계정 정보에서 이름, 이메일 추출
  - 고유 UUID로 프로필 생성
  - 프로필 생성 실패 시 재시도 (동기 처리)
- **기본 조직 생성**:
  - Organization Management Domain에 기본 조직 생성 요청
  - 유저를 조직 소유자로 설정
  - 트랜잭션 처리 (프로필 + 조직)

**Events**:
1. 유저 가입 완료됨 (User Registration Completed)
2. 유저 가입 실패함 (User Registration Failed)

---

**Policy**:
- "Whenever 유저 가입 완료됨, then if 온보딩 필요하면 then 온보딩 옵션 제공하기"
- "Whenever 유저 가입 실패함, then immediately 오류 화면 표시하기"

**Read Model** (온보딩 옵션):
- 온보딩 진행 옵션
- 온보딩 건너뛰기 옵션
- 사용자 가이드 링크
- *UI Hint: 온보딩 화면 또는 다이얼로그*

**Command**: 온보딩 선택
- 온보딩 시작 또는 건너뛰기 선택

**System**: (웹) - Frontend
- 선택된 옵션에 따라 온보딩 화면 또는 메인 화면으로 이동

**Events**:
1. 온보딩이 시작됨 (Onboarding Started)
2. 온보딩을 건너뛰었음 (Onboarding Skipped)

---
*Frontend Implementation Details: `03-user-flow.md` 참조*
*Note: 가입 완료 후 조직 조회 및 선택은 Organization Management Domain에서 진행*

---

## 📍 Scenario 2: 사용자 계정 삭제 처리

**Trigger Event**: 사용자가 계정 설정에서 계정 삭제를 시작함
*UI Hint: 설정 페이지의 Danger Zone 영역을 통해 트리거*

```
👤 사용자: "서비스를 더 이상 사용하지 않아서 계정을 완전히 삭제하고 싶어"
```

**Policy**: 
- "Whenever 계정 삭제가 시작됨, then always 삭제 영향을 안내하고 확인을 받기"

**Read Model**:
- 계정 삭제 전 안내 정보:
  - 삭제 시 영향받는 데이터 목록
  - 사용자의 조직 소유권 목록
  - 사용자의 조직 멤버십 목록
  - 관련 워크스페이스 및 데이터 목록
- 계정 삭제 제약 사항:
  - **기본 조직이 아닌 소유 조직이 있는 경우**: 삭제 불가
  - 다른 관리자에게 소유권 이전 후 삭제 가능
  - 기본 조직은 30일 유예 후 완전 삭제
- 삭제 확인 옵션:
  - 삭제 사유 선택 (선택사항)
  - 확인 체크박스 (필수)
  - "DELETE" 문자열 입력 (필수)
- *UI Hint: 계정 삭제 확인 다이얼로그 (Danger Zone 경고 스타일)*

**Command**: 사용자 계정 삭제
- 삭제 사유 (선택사항)
- 확인 체크박스
- "DELETE" 문자열 확인
- 계정 삭제 최종 확인

**System**: User Deletion System
- **Backend (Security Enforcement)**:
  - 현재 인증된 사용자 확인
  - 삭제 제약 조건 검증:
    - 기본 조직이 아닌 소유 조직 존재 여부 확인
    - 존재하면 삭제 차단 (소유권 이전 필요)
  - "DELETE" 문자열 입력 검증
- **계정 삭제 프로세스**:
  - 소유하지 않은 조직 멤버십 즉시 제거 (Organization Domain)
  - 기본 조직을 orphaned 상태로 전환
  - 기본 조직 30일 후 완전 삭제 예약
  - 사용자 프로필 소프트 삭제 (deleted_at 타임스탬프)
  - Supabase Auth 계정 삭제
  - 세션 무효화 및 캐시 삭제
  - 데이터 보존 안내 이메일 발송 (선택사항)

**Events**:
1. 사용자 계정이 삭제되었다 (User Account Deleted)
2. 소유 조직이 orphaned 상태로 전환되었다 (Owned Organizations Orphaned)
3. 멤버십이 제거되었다 (Memberships Removed)
4. 기본 조직 완전 삭제가 예약되었다 (Default Organization Deletion Scheduled)

---
*Frontend Implementation Details: `03-user-flow.md` 참조*

---

## 💡 핵심 Policy 정리

### 사용자 인증 및 등록 관련 (Scenario 1)
1. **구글 로그인 전용**: 구글 OAuth를 통한 유일한 로그인 방식
2. **자동 프로필 생성**: 구글 계정 정보를 기반으로 프로필 자동 생성
3. **트랜잭션 처리**: 프로필 생성 + 기본 조직 생성 트랜잭션
4. **장애 복구**: 프로필 생성 실패 시 즉시 재시도 (동기 처리)
5. **기본 조직 자동 생성**: 사용자 등록 시 개인 조직 자동 생성 (Organization Management Domain 통합)
6. **온보딩 옵션**: 가입 완료 후 온보딩 시작 또는 건너뛰기 선택 가능

### 계정 삭제 관련 (Scenario 2)
7. **삭제 제약**: 기본 조직 외 소유 조직이 있으면 삭제 불가
8. **소유권 이전 필수**: 삭제 전 모든 조직 소유권 이전 필요
9. **소프트 삭제**: 사용자 계정은 소프트 삭제 (deleted_at)
10. **조직 보존**: 기본 조직은 orphaned 상태로 30일 보존
11. **멤버십 제거**: 다른 조직의 멤버십은 즉시 제거

---

## 🔧 기술 권장사항

### Supabase Auth 통합 처리
- **Queue System**: 대량 사용자 등록 시 Queue 활용 (Supabase Queue 사용)
- **Idempotency**: 중복 요청 방지를 위한 idempotency key
- **Monitoring**: 계정 생성 실패율 모니터링 및 알림

### 성능 최적화
- **Caching**: 사용자 프로필 정보 캐싱
- **Database Indexing**: 사용자-프로필 관계 쿼리 최적화를 위한 복합 인덱스
- **Session Management**: 사용자 세션 최적화
- **Auto-Refresh**: 세션 자동 갱신을 위한 백그라운드 처리

---

## 🚀 Next Steps

이제 User Management Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환 (Supabase Auth는 External System으로 유지)
2. **Bounded Context 식별**: User, Profile 경계 확인
3. **Integration Points**: Organization Management Domain과의 연결점 정의
4. **Anti-Corruption Layer**: Supabase Auth ↔ Database 변환 레이어 설계

---

## 📝 Process Model 워크샵 정보 (참고용)

**일시**: 2024년 10월 1일 (Domain 1 Event Storming 완료 후)
**참가자**: 
- **도메인 전문가**: CEO (User Management 정책 결정)
- **시니어 개발자**: 개발 리드 (Supabase Auth 통합 전문가)
- **PM**: 프로젝트 매니저 (프로세스 정의)

**워크샵 결과물**:
- [x] 모든 핵심 사용자 여정이 시나리오로 정의됨 (2개 시나리오)
- [x] Event → Policy → Read Model → Command → System → Event 순서가 일관되게 적용됨
- [x] Supabase Auth와의 통합점이 명확히 정의됨 (OAuth, Database, Session Management)
- [x] Organization Management Domain과의 통합점 정의 (기본 조직 생성, 계정 삭제 처리)
- [x] 비즈니스 규칙(Policy)이 구체적으로 명시됨 (11개 핵심 정책)
- [x] 하이브리드 접근법 적용 (UI Hint 최소화, 비즈니스 프로세스 중심)
- [x] Software Design 작성을 위한 충분한 정보 확보
- [x] 조직 조회/선택은 Organization Management Domain으로 이관

---

*이 Process Model 문서는 User Management Domain의 Software Design 작성을 위한 기반 자료입니다.*