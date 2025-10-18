# Organization Management Domain - Process Model

## 🎯 Process Modeling Overview
Organization Management Domain의 핵심 시나리오를 실제 상호작용 순서에 따라 정의

### 📝 작성 원칙 (하이브리드 접근법)

#### ✅ 항상 작성된 내용 (비즈니스 프로세스)
- 비즈니스 정책 및 규칙 (계층적 권한 시스템, 멤버십 관리 규칙)
- 권한 기반 필터링 로직 (소유자/관리자/멤버 권한 구분)
- 시스템 처리 흐름 (멤버 초대, 역할 변경, 제거 프로세스)
- 데이터 검증 규칙 (중복 검증, 권한 검증)
- 외부 시스템 통합 (User Management, Notification Management)

#### ✅ 선택적으로 작성된 내용 (최소 UX 힌트)
- `*UI Hint:` 형태로 Frontend 팀을 위한 최소 힌트 제공
- 예시: `*UI Hint: 옵션 선택 UI*`, `*UI Hint: 확인 다이얼로그*`
- `*Layered Authorization:` Frontend/Backend 역할 구분 명시

#### ❌ 작성하지 않은 내용 (UI 과도 종속)
- 구체적인 컴포넌트 이름 (MUI Select, shadcn/ui Dialog 등)
- 색상, 크기, 패딩 등 스타일 세부사항
- 애니메이션, 트랜지션 효과

> **참고**: 구체적인 UI/UX 설계는 `03-user-flow.md`에서 진행합니다.

### 🔄 시퀀스 기반 상호작용 순서
각 시나리오는 여러 시퀀스로 구성되며, 이벤트에 의해 다음 시퀀스가 트리거됩니다:

**Event** → **Policy** → **Read Model** → **Command** → **System** → **Event** → **Policy** → ...

1. **Event** (이전 시퀀스의 결과) → 2. **Policy** (이벤트에 따른 정책 적용) → 3. **Read Model** (시스템에서 사용자에게 제공하는 정보) → 4. **Command** (사용자가 입력하는 정보) → 5. **System** (처리 시스템) → 6. **Event** (결과 이벤트)

### 🟪 External System: User Management Domain
Organization Management Domain은 User Management Domain과 통합됩니다:
- **역할**: 사용자 정보 참조, 기본 조직 생성 요청 수신
- **통합**: User Management Domain에서 "기본 조직 생성하기" 커맨드 실행
- **알림**: Notification Management Domain으로 "초대 알림 생성하기" 커맨드 실행

---

## 📍 Scenario 0: 조직 조회 및 선택 (User Management Domain 연동)

**Trigger Event**: 유저 가입 완료됨 (User Management Domain)
*UI Hint: 메인 화면 진입 시 자동 트리거*

```
👤 사용자: "내가 속한 조직들을 확인하고 작업할 조직을 선택하고 싶어"
```

**Policy**: 
- "Whenever 유저 가입 완료됨 또는 로그인 완료됨, then always 유저 관련 조직을 조회하고 초기 조직을 선택하기"

**Read Model**:
- 유저 관련 조직 목록:
  - 소유한 조직 (역할: 소유자)
  - 소속된 조직 (역할: 관리자/멤버)
- 각 조직 정보 (이름, 타입, 역할, 기본 조직 여부)
- 초기 선택 규칙:
  - 쿠키에 저장된 이전 선택 조직 우선
  - 없으면 기본 조직 선택
  - 기본 조직 없으면 첫 번째 소유 조직 선택
- *UI Hint: 조직 선택 UI (드롭다운 또는 사이드바)*

**Command**: 조직 조회 및 선택
- 선택할 조직 ID (자동 선택의 경우 시스템이 결정)

**System**: Organization System
- **Backend (Data Retrieval)**:
  - 유저가 소유한 조직 조회 (organizations 테이블)
  - 유저가 멤버인 조직 조회 (organization_members 테이블)
  - 중복 제거 및 정렬 (소유 조직 우선 → 참여일 순)
- **Frontend (State Management)**:
  - 조직 목록을 OrganizationContext에 저장
  - 초기 조직 선택 로직 실행
  - 선택된 조직 ID를 쿠키에 저장
  - 조직 컨텍스트 전환

**Events**:
1. 유저 관련 조직이 조회됨 (User Organizations Retrieved)
2. 초기 조직이 선택됨 (Initial Organization Selected)

---
*Frontend Implementation Details: `03-user-flow.md` 참조*
*Note: 조직 선택 후 워크스페이스 조회는 Workspace Domain에서 진행*

---

## 📍 Scenario 1: 새로운 조직 생성

### Sequence 1: 사용자가 새로운 조직을 생성하고 소유자가 됨

**Trigger Event**: 조직 목록 화면에서 "새 조직 만들기" 선택함
*UI Hint: 조직 선택 드롭다운 또는 버튼을 통해 트리거*

```
👤 사용자: "새로운 프로젝트를 위해 별도의 조직을 만들고 싶어"
```

**Policy**: 
- "Whenever 새 조직 만들기가 선택됨, then always 조직 생성 폼을 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 조직 생성에 필요한 입력 필드:
  - 조직 이름 (필수)
  - 조직 타입 (개인, 교육, 스타트업, 에이전시, 컴퍼니, N/A)
- 생성 진행 상태
- 생성 취소 옵션
- *UI Hint: 생성 폼 다이얼로그*

**Command**: 새로운 조직 생성 요청
- 조직 이름 (필수)
- 조직 타입 (필수)
- 조직 생성 확인

**System**: Organization System (Backend - Security Enforcement)
- 사용자의 조직 생성 권한 확인
- 새로운 UUID 기반 조직 ID 생성
- 사용자를 조직 소유자로 자동 설정
- 조직 기본 설정 자동 적용 (멤버 초대 권한, 워크스페이스 생성 권한 등)
- 조직 데이터베이스 저장

**Events**:
1. 새로운 조직이 생성됨 (New Organization Created)

---

**Policy**: 
- "Whenever 조직 생성이 완료됨, then always 조직 목록을 갱신하고 새 조직으로 컨텍스트 전환하기"

**Read Model** (조직 생성 완료 후):
- 업데이트된 조직 목록 (새 조직 포함)
- 새로운 조직으로 자동 선택된 상태
- 조직 생성 완료 알림

**Events**:
- 조직이 선택됨 (Organization Selected)

---
*Frontend Implementation Details: `03-user-flow.md` 참조*

---

## 📍 Scenario 2: 멤버 초대 및 수락

### Sequence 1: 조직 소유자/관리자가 새 멤버를 초대

**Trigger Event**: 멤버 관리 화면 접근함
*UI Hint: 설정 다이얼로그의 멤버 메뉴를 통해 트리거*

```
👤 조직 관리자: "새 팀원을 우리 조직에 초대하고 싶어"
```

**Policy**: 
- "Whenever 멤버 관리 화면이 접근됨, then always 멤버 초대 폼과 현재 멤버 목록을 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 현재 조직 멤버 목록 (이름, 이메일, 역할, 가입일)
- 진행 중인 초대 목록 (초대 대상 이메일, 역할, 상태)
- 멤버 초대 입력 필드:
  - 이메일 주소 입력 (자동 검색 기능)
  - 부여할 역할 선택 (관리자/멤버)
- 권한 기반 필터링:
  - 소유자와 관리자만 멤버 초대 가능
  - 이미 멤버인 경우 선택 불가
  - 초대 진행 중인 경우 선택 불가
- *Layered Authorization: Frontend에서 권한 기반 UI 표시*
- *UI Hint: 멤버 초대 폼 (이메일 검색 + 역할 선택)*

**Command**: 멤버 초대 요청
- 초대할 이메일 주소
- 부여할 역할 (관리자/멤버)
- 초대 확인

**System**: Invitation System (Backend - Security Enforcement)
- **Application-level 권한 체크**: 소유자/관리자만 초대 가능
- 이메일로 사용자 검색 (프로필 조회)
- 중복 멤버 검증
- 중복 초대 검증
- 초대 정보 데이터베이스 저장 (invitations 테이블)
- Notification System에 초대 알림 생성 요청

**Events**:
1. 멤버 초대 요청됨 (Member Invitation Requested)
2. 초대 알림 생성됨 (Invitation Notification Created)

---

### Sequence 2: 초대받은 사용자가 초대를 확인하고 수락/거절

**Trigger Event**: 초대받은 사용자가 인박스를 확인함
*UI Hint: 사이드바 인박스 버튼을 통해 트리거*

```
👤 초대받은 사용자: "초대 알림을 받았는데 조직에 참여하고 싶어"
```

**Policy**: 
- "Whenever 인박스가 확인됨, then if 초대 알림 있으면 then 초대 내용을 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 초대 알림 목록 (읽지 않은 알림 우선)
- 초대 상세 정보:
  - 초대한 사람 이름
  - 조직 이름
  - 부여될 역할
  - 초대 시간
- 초대 응답 옵션 (승낙/거절)
- *UI Hint: 인박스 패널 (알림 목록 + 응답 버튼)*

**Command**: 초대 응답
- 초대 승낙 또는 초대 거절 선택
- 응답 확인

**System**: Invitation System (Backend - Security Enforcement)
- 초대 상태 확인 (유효성 검증)
- 초대 승낙인 경우:
  - organization_members 테이블에 멤버 추가 (adminDb)
  - 초대 상태를 'accepted'로 업데이트
- 초대 거절인 경우:
  - 초대 상태를 'rejected'로 업데이트
- Notification System에 알림 읽음 처리 요청
- 멤버 권한 캐시 무효화 (승낙 시)

**Events**:
1. 초대 승낙됨 (Invitation Accepted) - 멤버 추가 완료
2. 초대 거절됨 (Invitation Rejected)
3. 알림 읽혀짐 (Notification Read)

---
*Frontend Implementation Details: `03-user-flow.md` 참조*

2025-10-07
---

## 📍 Scenario 3: 멤버 역할 변경

**Trigger Event**: 사용자가 멤버 역할 변경을 시작함
*UI Hint: 멤버 목록의 역할 표시 영역 버튼을 통해 트리거*

```
👤 조직 관리자 (소유자/어드민): "팀원의 권한을 Admin으로 승격시키고 싶어"
👤 조직 관리자 (소유자): "어드민의 권한을 Member로 강등시키고 싶어"
```

**Policy**: 
- "Whenever 역할 변경이 시작됨, then always 계층적 권한을 검증하고 확인을 받기"

**Read Model**:
- 선택된 멤버 정보 (이름, 이메일, 현재 역할)
- 변경 가능한 역할 옵션 (권한 기반 필터링 적용됨):
  - **소유자가 보는 옵션**: "관리자", "멤버", "조직에서 제외"
  - **어드민이 보는 옵션**: "관리자" (대상이 멤버인 경우만)
  - **현재 역할**: 체크 표시 및 선택 불가
  - **소유자 역할**: 변경 불가 (버튼 자체를 표시 안 함)
- 역할 변경 확인 정보:
  - 현재 역할 → 새 역할
  - 권한 변경 안내 메시지 (승격/강등에 따라 다름)
- *Layered Authorization: Frontend에서 권한 기반 옵션 계산 및 필터링*
- *UI Hint: 옵션 선택 UI (드롭다운 메뉴) + 확인 다이얼로그*

**Command**: 멤버 역할 변경
- 대상 멤버 ID
- 새로운 역할 (관리자/멤버)
- 확인 여부

**System**: Organization System
- **Layered Authorization**:
  - **Frontend (UX 최적화)**: 
    - 사용자 권한에 따라 변경 가능한 옵션 필터링
    - 소유자 역할 변경 버튼 숨김
    - 현재 역할 체크 표시 및 비활성화
    - 권한별 옵션 활성화/비활성화 결정
  - **Backend (Security Enforcement)**: 
    - 현재 유저가 역할 변경 권한이 있는지 검증 (DB 조회)
    - 변경 대상 멤버가 소유자가 아닌지 검증
    - 계층적 권한 시스템 규칙 재검증:
      - 소유자만 어드민을 멤버로 다운그레이드 가능
      - 어드민은 멤버를 어드민으로 승격만 가능
    - 현재 역할과 새 역할이 다른지 검증
    - 자기 자신 역할 변경 방지
- adminDb로 멤버 역할 데이터베이스 업데이트
- 멤버 권한 캐시 무효화

**Events**:
1. 멤버가 Admin으로 승격되었다 (Member Promoted to Admin)
2. Admin이 Member로 강등되었다 (Admin Demoted to Member)

---
*Frontend Implementation Details: `03-user-flow.md` 참조*

---

## 📍 Scenario 4: 멤버 제거

### Sequence 1: 조직 소유자가 다른 멤버를 제거

**Trigger Event**: Scenario 3에서 "조직에서 제외" 옵션이 선택됨
*UI Hint: 역할 옵션 메뉴의 "조직에서 제외" 항목 선택*

```
👤 조직 소유자: "더 이상 필요없는 멤버를 조직에서 제거하고 싶어"
```

**Policy**: 
- "Whenever 다른 멤버 '조직에서 제외' 옵션이 선택됨, then always 제거 영향을 안내하고 확인을 받기"

**Read Model**:
- 제거할 멤버 정보 (이름, 이메일, 역할)
- 제거 시 영향 안내:
  - 멤버의 개인 워크스페이스 이전 안내
  - 멤버의 초대 및 세션 무효화 안내
  - 되돌릴 수 없음 경고
- 확인/취소 옵션
- 권한 기반 표시:
  - **소유자만** 다른 멤버를 제거할 수 있음
  - 어드민은 이 옵션을 볼 수 없음
- *Layered Authorization: Frontend에서 소유자 권한 기반 옵션 표시*
- *UI Hint: 확인 다이얼로그 (Danger Zone 경고 스타일)*

**Command**: 멤버 제거
- 대상 멤버 ID
- 제거 확인 여부

**System**: Organization System
- **Layered Authorization**:
  - **Frontend (UX 최적화)**: 
    - 소유자만 "조직에서 제외" 옵션 표시
    - 어드민 및 일반 멤버는 옵션 숨김
    - 다른 멤버 제거 경고 메시지 표시
  - **Backend (Security Enforcement)**: 
    - 현재 유저가 소유자인지 검증 (DB 조회)
    - 제거 대상 멤버가 소유자가 아닌지 검증
    - 자기 자신 제거 방지
- **멤버 제거 프로세스**:
  - 멤버의 개인 워크스페이스를 조직 소유자에게 이전 (Workspace Domain)
  - 멤버를 조직에서 제거 (organization_members 테이블, adminDb)
  - 멤버의 모든 초대 무효화 (invitations 테이블)
  - 멤버 세션 무효화 (세션 캐시 삭제)
  - 멤버 권한 캐시 무효화

**Events**:
1. 멤버가 조직에서 제거되었다 (Member Removed from Organization)
2. 멤버 워크스페이스가 소유자에게 이전되었다 (Member Workspaces Transferred to Owner)

---

### Sequence 2: 자신이 조직을 나감 (자발적 탈퇴)

**Trigger Event**: 자신의 역할 메뉴에서 "조직 나가기" 옵션이 선택됨
*UI Hint: 자신의 프로필 또는 설정 메뉴를 통해 트리거*

```
👤 조직 멤버 (어드민/멤버): "더 이상 이 조직에 참여하고 싶지 않아"
```

**Policy**: 
- "Whenever 자신의 '조직 나가기' 옵션이 선택됨, then always 나가기 영향을 안내하고 확인을 받기"

**Read Model**:
- 현재 조직 정보 (조직 이름, 자신의 역할)
- 나가기 시 영향 안내:
  - 자신의 워크스페이스 처리 방법 (조직 소유자에게 이전 또는 삭제)
  - 조직 데이터 접근 권한 상실 안내
  - 되돌릴 수 없음 경고
- 확인/취소 옵션
- 권한 기반 제약:
  - **소유자는 나갈 수 없음** (소유권 이전 후에만 가능)
  - 어드민과 일반 멤버만 나갈 수 있음
- *Layered Authorization: Frontend에서 소유자 나가기 옵션 숨김*
- *UI Hint: 확인 다이얼로그 (Danger Zone 경고 스타일)*

**Command**: 조직 나가기
- 조직 ID
- 나가기 확인 여부

**System**: Organization System
- **Layered Authorization**:
  - **Frontend (UX 최적화)**: 
    - 소유자는 "조직 나가기" 옵션 숨김
    - 어드민/멤버만 옵션 표시
    - 자발적 탈퇴 경고 메시지 표시
  - **Backend (Security Enforcement)**: 
    - 현재 유저가 해당 조직의 멤버인지 검증 (DB 조회)
    - 나가려는 유저가 소유자가 아닌지 검증
    - 마지막 남은 멤버인지 확인 (조직 고아 방지)
- **조직 나가기 프로세스**:
  - 자신의 워크스페이스를 조직 소유자에게 이전 (Workspace Domain)
  - 자신을 조직에서 제거 (organization_members 테이블, adminDb)
  - 자신이 보낸 초대 처리 (소유자에게 이전 또는 무효화)
  - 자신의 세션에서 조직 컨텍스트 제거
  - 권한 캐시 무효화

**Events**:
1. 멤버가 자발적으로 조직을 나갔다 (Member Left Organization Voluntarily)
2. 멤버 워크스페이스가 소유자에게 이전되었다 (Member Workspaces Transferred to Owner)

---
*Frontend Implementation Details: `03-user-flow.md` 참조*

---

## 📍 Scenario 5: 조직 소유권 이전 (핵심 시나리오)

### Sequence 1: 조직 소유자가 다른 멤버에게 소유권을 이전

**Trigger Event**: 사용자 권한이 확인됨

```
👤 현재 소유자: "조직 소유권을 다른 멤버에게 넘기고 싶어"
👤 새 소유자: "조직 소유권을 받아서 관리하고 싶어"
```

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 조직 멤버 목록 (소유권 이전 가능한 멤버들)
- 소유권 이전 안내 메시지 및 주의사항
- 확인 코드 입력 필드
- 이전 사유 입력 필드 (선택사항)
- 소유권 이전 진행 상태 표시

**Command**: 소유권 이전 요청 (사용자가 입력하는 정보)
- 이전할 대상 멤버 선택
- 확인 코드 입력
- 이전 사유 (선택사항)
- 소유권 이전 확인

**Policy**: 소유권 이전 규칙 (핵심)
- "현재 소유자만 소유권 이전 가능"
- "새 소유자는 반드시 기존 조직 멤버여야 함"
- "소유권 이전 시 확인 코드 입력 필수"
- "이전 즉시 새 소유자는 소유자 권한, 기존 소유자는 관리자 권한으로 변경"
- "모든 워크스페이스 소유권도 함께 이전"
- "진행 중인 초대는 새 소유자 명의로 변경"

**System**: Ownership Transfer Manager → Database

**Events**:
1. 소유권 이전이 요청되었다 (Ownership Transfer Requested)
2. 이전 확인이 완료되었다 (Transfer Confirmation Completed)
3. 새 소유자가 Owner 권한으로 승격되었다 (New Owner Promoted)
4. 기존 소유자가 Admin 권한으로 변경되었다 (Previous Owner Demoted to Admin)
5. 워크스페이스 소유권이 이전되었다 (Workspace Ownership Transferred)
6. 소유권 이전이 완료되었다 (Ownership Transfer Completed)

---

## 📍 Scenario 6: 조직 삭제 (Danger Zone)

### Sequence 1: 조직 Owner가 조직을 완전 삭제

**Trigger Event**: 멤버 제거가 완료됨

```
👤 Owner: "더 이상 필요없는 조직을 완전히 삭제하고 싶어"
```

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 삭제 가능한 조직 목록
- 조직 삭제 안내 메시지 및 주의사항
- 삭제 유형 선택 옵션 (소프트 삭제/완전 삭제)
- 조직 이름 확인 입력 필드
- 조직 삭제 진행 상태 표시

**Command**: 조직 삭제 요청 (사용자가 입력하는 정보)
- 삭제할 조직 선택
- 조직 이름 확인 입력
- 삭제 유형 선택 (소프트 삭제/완전 삭제)
- 조직 삭제 확인

**Policy**: 조직 삭제 규칙 (Danger Zone)
- "소유자만 삭제 가능"
- "정확한 조직 이름 입력 필수"
- "모든 워크스페이스와 관련 데이터 함께 삭제"
- "소프트 삭제 후 30일 보관"
- "30일 후 완전 삭제 (영구 삭제)"
- "멤버들에게 삭제 알림 발송"
- "기본 조직은 삭제 불가 (사용자 계정과 연동)"

**System**: Organization Deletion Manager → Database

**Events**:
1. 조직 삭제가 요청되었다 (Organization Deletion Requested)
2. 삭제 확인이 완료되었다 (Deletion Confirmed)
3. 모든 워크스페이스가 삭제되었다 (All Workspaces Deleted)
4. 모든 멤버가 제거되었다 (All Members Removed)
5. 조직이 소프트 삭제되었다 (Organization Soft Deleted)
6. 완전 삭제가 예약되었다 (Permanent Deletion Scheduled)

---

## 💡 핵심 Policy 정리

### 조직 및 멤버십 관리 관련
1. **새로운 조직 생성**: 모든 인증된 사용자는 새 조직을 생성할 수 있음
2. **조직 이름 고유성**: 조직 이름은 플랫폼 내에서 고유해야 함
3. **3단계 역할 시스템**: 소유자 > 관리자 > 멤버 권한 체계
4. **소유권 이전**: 소유자 역할은 이전을 통해서만 변경 가능

### 초대 및 멤버 관리 관련 (핵심)
5. **권한 기반 초대**: 소유자와 관리자만 멤버 초대 가능
6. **이메일 검증**: 초대 수락 시 이메일 주소 검증 필수
7. **30일 초대 유효기간**: 초대 링크 30일 후 자동 만료

### 삭제 및 보안
8. **소프트 삭제**: 30일 유예 기간 제공
9. **계층적 삭제**: 조직 삭제 시 하위 요소 함께 처리
10. **Danger Zone**: 조직 삭제는 이름 확인 + 소유자 권한 필수

---

## 🔧 기술 권장사항

### 조직 및 멤버십 최적화
- **Background Jobs**: 조직 삭제 등 무거운 작업은 백그라운드 처리 (추후)
- **Progress Tracking**: 소유권 이전 등 진행률 실시간 표시 (추후)

### 성능 최적화
- **Caching**: 조직 멤버 목록 및 권한 정보 캐싱
- **Database Indexing**: 조직-멤버 관계 쿼리 최적화를 위한 복합 인덱스
- **Session Management**: 조직 컨텍스트 세션 최적화
- **Auto-Refresh**: 세션 자동 갱신을 위한 백그라운드 처리

---

## 🚀 Next Steps

이제 Organization Management Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환
2. **Bounded Context 식별**: Organization, Member, Invitation 경계 확인
3. **Integration Points**: User Management Domain, Notification Management Domain과의 연결점 정의
4. **Anti-Corruption Layer**: 도메인 간 커맨드 실행 레이어 설계

---

## 📝 Process Model 워크샵 정보 (참고용)

**일시**: 2024년 10월 1일 (Domain 1 Event Storming 완료 후)
**참가자**: 
- **도메인 전문가**: CEO (Organization Management 정책 결정)
- **시니어 개발자**: 개발 리드 (조직 관리 전문가)
- **PM**: 프로젝트 매니저 (프로세스 정의)

**워크샵 결과물**:
- [x] 모든 핵심 조직 관리 여정이 시나리오로 정의됨 (6개 시나리오)
- [x] Event → Policy → Read Model → Command → System → Event 순서가 일관되게 적용됨
- [x] System 블랙박스 내부 처리 과정 세분화 (Organization Manager 상세 분석)
- [x] User Management Domain과의 통합점이 명확히 정의됨 (기본 조직 생성, 사용자 정보 참조)
- [x] Notification Management Domain과의 통합점이 명확히 정의됨 (초대 알림 생성)
- [x] 비즈니스 규칙(Policy)이 구체적으로 명시됨 (10개 핵심 정책)
- [x] Software Design 작성을 위한 충분한 정보 확보

---

*이 Process Model 문서는 Organization Management Domain의 Software Design 작성을 위한 기반 자료입니다.*
