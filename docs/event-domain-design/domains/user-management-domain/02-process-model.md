# User Management Domain - Process Model

## 🎯 Process Modeling Overview
User Management Domain의 핵심 시나리오를 실제 상호작용 순서에 따라 정의

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

## 📍 Scenario 0: 유저 가입 및 온보딩

### Sequence 1: 방문자가 구글 로그인으로 서비스에 가입

- 방문자와 유저의 차이: 방문자는 서비스에 가입한 자와 가입되지 않은 자를 일컬음. 유저는 방문자 중 서비스에 가입한 자를 의미
- 가입 = Sign up

**Entry Point**: 로그인 페이지 이동함

```
👤 사용자: "구글 계정으로 로그인해서 서비스에 가입하고 싶어"
```

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 로그인 방식
- 서비스 후기 확인
- 개인정보 처리방침 및 이용약관 (자동 동의)

**Command**: 구글 로그인 선택

**System**: Google OAuth
- 구글 로그인 창과 OAuth 로직 진행
- 구글에서 처리

**Events**:
- 구글 OAuth 코드 전달받음 (구글 로그인 성공)

**Policy**:
- "Whenever 구글 OAuth 코드 전달됨, then always 유저 가입 처리하기"

**Command**: 유저 가입 처리하기
- 구글 인증 코드

**System**: User Authentication System  → Supabase Database
- "구글 인증 코드 성공 시에만 Supabase 유저 생성" (Supabase Auth System 처리)
- "기존 프로필이 있는지 확인 후 없으면 프로필 생성"
- "프로필 생성 실패 시 즉시 재시도 (동기 처리)"
- "기본 조직 자동 생성 (유저가 소유자)" → **Organization System 커맨드 실행**

**Events**:
1. 유저 가입 완료됨 (User Registration Completed)
2. 유저 가입 실패함 (User Registration Failed)

**Policy**:
- "Whenever 사용자 등록 처리 완료됨 with Onboarding Policy (Search Query로 처리), then always 온보딩 진행하기"
- "Whenever 사용자 등록 처리 실패함, then immediately 오류 화면 표시하기"

**Read Model** (온보딩 관련 추가 정보):
- 온보딩 시작 버튼
- 온보딩 건너뛰기 옵션
- 사용자 가이드 및 튜토리얼 안내

**Command**: 온보딩 진행하기

**System**: 프론트엔드

**Events**:
- 온보딩이 완료됨


### Sequence 2: User Authentication System 내부 처리 과정

**Trigger Event**: 유저 가입 처리 시작됨

```
🔧 시스템: "User Authentication Manager 내부에서 구글 인증부터 계정 생성까지 처리"
```

**Policy**: Google OAuth Code Policy
- "Whenever 사용자 등록 처리 시작됨 with Google OAuth Code Policy, then always Supabase Auth에서 유저 생성하기"

**Command**: Supabase 유저 생성하기

**System**: Supabase Auth System (*Event 연결하는 ACL 필요)

**Event**: Supabase 유저 생성됨

---

**Policy**:
- "Whenever 유저 생성됨, then always 프로필 생성하기"

**Read Model** (내부 처리 2단계):
- 구글 계정 정보
- 기존 프로필 조회 결과
- 프로필 생성 상태

**Command**: 프로필 생성 처리하기

**System**: Profile System
- id는 고유한 uuid로 처리
- 구글 계정 정보에서 name 가지고 와서 이름 설정

**Event**: 유저 프로필이 생성됨 (User Profile Created)

---

**Policy**:
- "Whenever 유저 프로필이 생성됨, then always 기본 조직 생성하기"

**Command**: 기본 조직 생성하기

**System**: Organization Management Domain
- 이미 기본 조직이 존재하는지 체크
- org_ 첨자가 붙은 id로 설정
- 동일한 id가 존재하는지 확인
- 유저를 소유자로 설정

**Event**: 기본 조직이 생성됨 (Default Organization Created)

---

**Policy**: 
- "Whenever 기본 조직이 생성됨, then always 사용자 등록 처리 완료됨"

**Events** (최종 결과):
- 유저 가입 완료됨 (User Registration Completed)
- 유저 가입 실패함 (User Registration Failed)

---

## 📍 Scenario 1: 조직 조회 및 선택

### Sequence 1: 로그인된 유저와 관련된 조직 (소유, 소속) 모두 조회하기

**Trigger Event**: 로그인이 완료됨

```
🔧 시스템: "로그인된 유저와 관련된 조직을 모두 조회해야해"
```

**Policy**: Dashboard Policy
- "Whenever 로그인이 완료됨 with Dashboard Policy, then always 유저 관련 조직을 조회하기"

**Command**: 유저 관련 조직을 조회하기
- 유저 세션

**System**: Organization System
- 유저가 소유한 조직 조회
- 유저가 소속된 조직 조회
- 유저의 조직 권한도 함께 로드

**Events**:
- 유저 관련 조직이 조회됨 (Related Organization Retrieved)

---

**Policy**: Initial Selection Policy
- "Whenever 유저 관련 조직 로드됨 with Initial Selection Policy, then always 초기 조직을 선택하기"

**Command**: 초기 조직을 선택하기

**System**: 프론트엔드
- 이전 선택된 조직 정보 쿠키에서 확인
- 해당 조직 정보가 있으면 선택
- 없으면 첫번째 소유 조직 선택

**Events**:
- 초기 조직이 선택됨

---

**Policy**: Dashboard Policy
- "Whenever 초기 조직 선택됨 with Dashboard Policy, then always 페이지 조회하기"

(이어서 페이지 도메인에서 진행해야 함)


### Sequence 2: User Authentication System 내부 처리 과정

```
👤 사용자: "현재 보고 있는 조직을 변경하고 싶어."
```

**Read Model**:
- 조회된 조직 리스트

**Command**: 조직 선택하기

**System**: 프론트엔드

**Events**:
- 조직 선택됨

---

**Policy**: Dashboard Policy
- "Whenever 조직 선택됨 with Dashboard Policy, then always 페이지 조회하기"

(이 이후 과정은 페이지 도메인에서 진행해야 함)

2025-09-29
-----------------


---

## 📍 Scenario 8: 사용자 계정 삭제 처리

### Sequence 1: 사용자가 계정을 삭제함 (계정 탈퇴)

**Trigger Event**: 사용자가 계정 삭제 요청함

```
👤 사용자: "계정을 완전히 삭제하고 싶어"
```

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 계정 삭제 안내 메시지 및 주의사항
- 사용자의 모든 조직 소유권 목록
- 사용자의 모든 조직 멤버십 목록
- 관련 워크스페이스 및 데이터 목록
- 계정 삭제 확인 체크박스

**Command**: 사용자 계정 삭제 요청 (사용자가 입력하는 정보)
- 계정 삭제 사유 선택 (사용자 요청/관리자 조치)
- 계정 삭제 확인 체크박스
- 계정 삭제 최종 확인

**Policy**: 사용자 계정 삭제 시 보존 규칙
- "사용자 삭제 시 소유 조직은 보존하되 orphaned 상태로 전환"
- "기본 조직의 경우 30일 후 완전 삭제 경고"
- "다른 조직의 멤버십은 즉시 제거"
- "기본 조직이 아닌 소유 조직이 있으면 삭제 불가 / 다른 관리자에게 소유권 이전해야 가능"

**System**: User Deletion Cleanup Manager

**Events**:
1. 사용자 계정이 삭제되었다 (User Account Deleted)
2. 사용자 삭제 경고가 표시되었다 (User Deletion Warning Shown)
3. 소유 조직들이 orphaned 상태로 전환되었다 (Owned Organizations Orphaned)
4. 멤버십들이 제거되었다 (Memberships Removed)
5. 데이터 보존 안내가 발송되었다 (Data Preservation Guide Sent)

---

## 💡 핵심 Policy 정리

### 사용자 인증 및 등록 관련
1. **구글 로그인 전용**: 구글 OAuth를 통한 유일한 로그인 방식
2. **자동 프로필 생성**: 구글 계정 정보를 기반으로 프로필 자동 생성
3. **장애 복구**: 계정 생성 실패 시 3회 재시도 + exponential backoff (5s → 25s → 125s)
4. **데이터 보존**: 사용자 계정 삭제 시에도 30일 유예

### 조직 및 멤버십 관리 관련
5. **기본 조직 자동 생성**: 사용자 등록 시 개인 조직 자동 생성 (Organization Management Domain 커맨드 실행)
6. **조직 조회**: 사용자 관련 조직 조회는 Organization Management Domain에서 처리
7. **계정 삭제**: 사용자 계정 삭제 시 소유 조직은 Organization Management Domain에서 처리

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
- **시니어 개발자**: 개발 리드 (Clerk 통합 전문가)
- **PM**: 프로젝트 매니저 (프로세스 정의)

**워크샵 결과물**:
- [x] 모든 핵심 사용자 여정이 시나리오로 정의됨 (3개 시나리오)
- [x] Event → Policy → Read Model → Command → System → Event 순서가 일관되게 적용됨
- [x] System 블랙박스 내부 처리 과정 세분화 (User Authentication Manager 상세 분석)
- [x] Supabase Auth와의 통합점이 명확히 정의됨 (OAuth, Database, Session Management)
- [x] 비즈니스 규칙(Policy)이 구체적으로 명시됨 (7개 핵심 정책)
- [x] Software Design 작성을 위한 충분한 정보 확보

---

*이 Process Model 문서는 User Management Domain의 Software Design 작성을 위한 기반 자료입니다.*