# Process Model: Workspace Management Domain

## 🎯 개요

**도메인**: Workspace Management  
**작성자**: 도메인전문가 + 시니어개발자  
**작성일**: 2025-10-11  
**버전**: v1.0

**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: `03-software-design.md` (Backend), `03-user-flow.md` (Frontend)

---

## 🎯 Process Modeling Overview
Workspace Management Domain의 핵심 프로세스를 실제 상호작용 순서에 따라 정의

### 📝 작성 원칙 (하이브리드 접근법)

#### ✅ 항상 작성해야 할 내용 (비즈니스 프로세스)
- 비즈니스 정책 및 규칙
- 권한 기반 필터링 로직
- 시스템 처리 흐름
- 데이터 검증 규칙
- 외부 도메인 통합

#### ✅ 선택적으로 작성 가능 (최소 UX 힌트)
- `*UI Hint:` 형태로 Frontend 팀을 위한 최소 힌트 제공
- 예시: `*UI Hint: 옵션 선택 UI*`, `*UI Hint: 확인 다이얼로그*`
- 원칙:
  - **최소성**: 꼭 필요한 힌트만
  - **추상성**: 구체적 컴포넌트 이름 금지
  - **선택성**: `*` 표시로 선택적 정보임을 명시

#### ❌ 작성 금지 (UI 과도 종속)
- 버튼 위치, 색상, 크기
- 애니메이션, 트랜지션 효과
- 구체적인 컴포넌트 이름 (Material-UI Select, shadcn/ui Dialog 등)
- 반응형 레이아웃 세부사항

> **참고**: 구체적인 UI/UX 설계는 `03-user-flow.md`에서 진행합니다.

### 🔄 시퀀스 기반 상호작용 순서
각 시나리오는 여러 시퀀스로 구성되며, 이벤트에 의해 다음 시퀀스가 트리거됩니다:

**Event** → **Policy** → **Read Model** → **Command** → **System** → **Event** → **Policy** → ...

1. **Event** (이전 시퀀스의 결과) → 2. **Policy** (이벤트에 따른 정책 적용) → 3. **Read Model** (시스템에서 사용자에게 제공하는 정보) → 4. **Command** (사용자가 입력하는 정보) → 5. **System** (처리 시스템) → 6. **Event** (결과 이벤트)

---

## 🟪 External Systems

Workspace Management Domain은 다음 외부 도메인들과 통합됩니다:

### External System 1: Organization-Management Domain
**역할**: 조직 정보, 멤버 목록, 권한 관리
- **SSOT**: Organization Domain이 조직/멤버 데이터의 Single Source of Truth
- **통합 방식**: 
  - **Organization 생성 → Default Workspace 생성**: Organization Domain의 Organization Service에서 Workspace Domain의 Workspace Service를 주입하여 동기 처리
  - **트랜잭션**: Organization + Workspace + Page 생성이 하나의 트랜잭션
  - **권한 검증**: Server Action/Component에서 Organization API 호출
- **Failure Strategy**: 
  - Workspace 생성 실패 시 재시도 → 최종 실패 시 Organization 생성 중단 및 사용자에게 재시도 안내
  - 권한 검증 실패 시 접근 거부

### External System 2: Notification-Management Domain
**역할**: 알림 생성 및 전송
- **SSOT**: Notification Domain이 알림 데이터의 Single Source of Truth
- **통합 방식**: 
  - **Workspace 초대 → 알림 생성**: Workspace Service에서 Notification Service 주입하여 동기 처리
  - **트랜잭션**: 초대 생성 + 알림 생성이 하나의 트랜잭션
  - **초대 수락/거절 → 알림 상태 업데이트**: 동기 처리
- **Failure Strategy**: 
  - 알림 생성 실패 시 전체 트랜잭션 롤백 (초대도 취소)

### External System 3: Block System Domain (미래)
**역할**: 페이지 캔버스 내부의 블록 관리
- **SSOT**: Block System이 블록 데이터의 Single Source of Truth
- **통합 방식**: 
  - **Page 생성 → 빈 캔버스 초기화**: 미래 구현 (현재는 빈 상태로만 생성)
  - **Page 복제 → 블록 복제**: Scenario 5에서 비동기 처리 (Post-MVP)
- **현재 상태**: MVP에서는 미구현, Page 생성 시 블록 없이 생성

### Frontend System (쿠키 관리)
**역할**: 최근 방문 페이지 추적
- **저장 위치**: 브라우저 쿠키만 (DB 저장 X)
- **처리 방식**: 
  - Frontend에서 쿠키 읽기 → 서버에서 검증 → 유효하지 않으면 Default Workspace의 첫 번째 페이지로 Fallback
  - Server Component에서 쿠키 검증

---

## 📍 Scenario 0: Organization 생성 시 Default Workspace 자동 생성

### Sequence 1: Organization 생성 서비스 메소드 내부에서 Default Workspace 및 초기 페이지 생성

**Trigger Event**: 조직이 생성됨 (Organization Domain에서 트리거)

```
🔧 시스템: "Organization 생성 서비스 메소드 내부에서 Workspace Domain 서비스를 주입하여 동기 처리"
```

**Policy**: "Whenever 조직이 생성됨, then always Default Workspace 생성하기"

**Command**: Default Workspace 생성 (내부 시스템 호출, 사용자 개입 없음)
- 조직 ID
- 조직 이름 (Workspace 이름으로 사용)
- 생성자 ID (조직 소유자)

**System**: Organization-Management - Organization System
- **서비스 주입**: Workspace Domain의 `WorkspaceService` 주입
- **동기 처리**: 하나의 트랜잭션 내에서 순차 처리
- **트랜잭션 경계**: 
  1. Organization 생성
  2. → Workspace Service 호출: Default Workspace 생성 (is_default=true, deletable=false)
  3. → Workspace Service 내부에서 Page Service 호출: Welcome 페이지 생성
- **재시도 로직**: 
  - Workspace/Page 생성 실패 시 즉시 재시도 (최대 3회)
  - 최종 실패 시 전체 트랜잭션 롤백 (Organization 생성도 취소)
  - 사용자에게 "조직 생성 실패, 다시 시도해주세요" 안내
- **검증 로직**:
  - 조직 ID 유효성 확인
  - 조직 소유자 권한 확인
  - Default Workspace 중복 방지 (조직당 하나만)

**Events**:
1. Default Workspace가 생성됨 (Default Workspace Created)
2. Workspace 초기 페이지가 생성됨 (Workspace Initial Page Created, 페이지 이름: "Welcome")
3. 조직 생성이 완료됨 (Organization Creation Completed)

---

## 📍 Scenario 1: 사용자가 조직에 접근하여 Workspace-Page 목록 조회 및 페이지 선택

### Sequence 1: 사용자가 조직 페이지로 접근하여 Workspace-Page 목록 로드 및 페이지 선택

**Trigger Event**: 사용자가 `/r/[orgId]` 경로로 접근함

```
👤 사용자: "조직 페이지로 접근해서 모든 Workspace의 Page 목록을 보고 페이지를 열고 싶어"
```

**Policy**: "Whenever 조직 경로 접근됨, then if 권한 있음, then always 조직의 모든 Workspace-Page 목록 로드하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 해당 조직의 모든 Workspace 목록 (초대 여부 무관, 조직 멤버면 모두 표시)
  - Default Workspace (최상단)
  - 나머지 Workspace 목록 (생성/초대 구분 없이)
- 각 Workspace의 페이지 트리 구조
  - 최상위 페이지들
  - 하위 페이지들 (들여쓰기)
  - 즐겨찾기 페이지 (별도 섹션)
- 페이지가 0개인 Workspace: "페이지를 생성하세요" 안내
- 쿠키에서 읽은 최근 방문 페이지 자동 선택 (있는 경우)
- 쿠키 없으면 Default Workspace의 첫 번째 페이지 자동 선택
- *UI Hint: 사이드바 - Workspace별로 그룹화된 페이지 트리, 페이지만 클릭 가능*

**Command**: 페이지 선택 (클릭)
- 선택한 Page ID
- Page가 속한 Workspace ID

**System**: (웹) - Frontend + Workspace System (Server Component)
- **Server Component (데이터 로드)**:
  1. URL에서 orgId 추출
  2. 사용자 세션 확인
  3. Organization Domain API: 사용자가 조직 멤버인지 확인
     - 멤버 아니면 → 권한 없음 페이지 표시
  4. 해당 조직의 모든 Workspace 조회 (초대 여부 무관)
  5. 각 Workspace의 Page 트리 조회
  6. 쿠키에서 최근 방문 Page ID 읽기
  7. 최근 방문 Page 유효성 검증 (존재 여부, 조직 일치)
     - 유효하지 않으면 → Default Workspace의 첫 번째 Page로 Fallback
  8. 데이터 반환: Workspace-Page 목록 + 자동 선택할 Page ID
- **Frontend (페이지 선택 및 권한 체크)**:
  1. Workspace-Page 트리 렌더링
  2. 자동 선택된 페이지로 라우팅 (쿠키 또는 Fallback)
  3. **사용자가 다른 페이지 클릭 시**:
     - 클릭한 페이지의 URL 생성: `/r/[orgId]/workspace/[workspaceId]/page/[pageId]`
     - 현재 Workspace가 아닌 다른 Workspace의 페이지여도 이동 가능
     - Server Component에서 권한 체크 (다음 시퀀스)
  4. 쿠키에 선택한 페이지 ID 저장 (최근 방문)

**Events**:
1. 조직 Workspace-Page 목록이 로드됨 (Organization Workspace-Page List Loaded)
2. Page가 선택됨 (Page Selected)
3. 최근 방문 Page가 쿠키에 저장됨 (Recent Page Saved to Cookie)

---

### Sequence 2: 선택된 페이지 접근 권한 검증 및 로드

**Trigger Event**: 페이지가 선택됨 (URL: `/r/[orgId]/workspace/[workspaceId]/page/[pageId]`)

```
🔧 시스템: "Server Component에서 페이지 접근 권한을 검증하고 Page 데이터를 로드"
```

**Policy**: "Whenever Page가 선택됨, then always Workspace 멤버십 확인하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 권한 있는 경우: 페이지 상세 정보 (제목, 아이콘, 캔버스 내용)
- 권한 없는 경우: "이 페이지에 접근할 수 없습니다" 메시지
  - "Workspace에 초대되지 않았습니다"
  - 조직 Admin에게 초대 요청 버튼
- *UI Hint: 권한 없음 페이지 (안내 메시지 + 초대 요청 버튼)*

**Command**: 페이지 접근 요청 (자동)
- Page ID
- Workspace ID
- Organization ID
- 사용자 ID (세션에서)

**System**: Workspace System (Server Component)
- **권한 검증 로직** (Server Component 최상단):
  1. URL에서 orgId, workspaceId, pageId 추출
  2. 사용자 세션 확인
  3. Organization Domain API: 사용자가 조직 멤버인지 확인
     - 조직 멤버 아니면 → 403 Forbidden
  4. **Workspace 멤버십 확인**:
     - Default Workspace인 경우 → 조직 멤버이면 자동 허용
     - 일반 Workspace인 경우 → Workspace 멤버십 테이블 조회
       - 초대받지 않았으면 → **권한 없음 페이지 표시**
  5. 페이지가 해당 Workspace에 속하는지 확인
     - 다른 Workspace 페이지면 → 400 Bad Request
  6. 권한 통과 시 → 페이지 상세 데이터 로드
  7. 세션 기간 동안 권한 정보 캐싱
- **에러 처리**:
  - 조직 멤버 아님 → 403 Forbidden
  - Workspace 초대 안됨 → 권한 없음 페이지 표시
  - 페이지 없음 → 404 Not Found

**Events**:
1. 사용자 페이지 접근 권한이 검증됨 (User Page Access Verified) - 성공 시
2. Page 상세 정보가 로드됨 (Page Details Loaded) - 성공 시
3. Page 접근이 거부됨 (Page Access Denied) - 권한 없는 경우

---

## 📍 Scenario 2: 조직 소유자가 새 Workspace 생성

### Sequence 1: 조직 소유자가 Workspace 생성 및 첫 페이지로 이동

**Trigger Event**: 조직 소유자가 "새 Workspace 만들기" 버튼 클릭

```
👤 조직 소유자: "팀별로 작업 공간을 분리하고 싶어서 새 Workspace를 만들고 싶어"
```

**Policy**: "Whenever 새 Workspace 만들기 클릭됨, then always 조직 소유자 권한 확인하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- Workspace 생성 폼
  - Workspace 이름 입력 (필수)
  - Workspace 설명 입력 (선택)
  - Workspace 아이콘 선택 (선택, 기본값 제공)
- 권한 안내: "조직 소유자만 Workspace를 생성할 수 있습니다"
- *UI Hint: 모달 또는 전체 화면 폼*

**Command**: Workspace 생성 요청
- Workspace 이름 (필수, 1-100자)
- Workspace 설명 (선택, 최대 500자)
- Workspace 아이콘 (선택, 이모지 또는 이미지 URL)
- 조직 ID

**System**: Workspace System (Server Action) + Frontend
- **권한 검증** (Server Action 최상단):
  1. 사용자 세션 확인
  2. Organization Domain API 호출: 사용자가 조직 소유자인지 확인
  3. 조직 소유자가 아니면 → 403 Forbidden, "권한이 없습니다" 에러
- **입력 검증**:
  - Workspace 이름: 빈 문자열 불가, 1-100자
  - Workspace 설명: 최대 500자
  - Workspace 아이콘: 유효한 이모지 또는 URL
  - 조직 ID: 유효한 조직인지 확인
- **Workspace 생성 로직** (트랜잭션):
  1. Workspace 레코드 생성 (is_default=false, deletable=true)
  2. 조직 소유자를 Workspace 멤버로 자동 추가 (역할: Owner)
  3. Page Service 호출: 초기 "Untitled" 페이지 생성
  4. 트랜잭션 커밋
  5. 생성된 Workspace ID와 Page ID 반환
- **Frontend 처리** (Server Action 성공 후):
  1. 라우팅: `/r/[orgId]/workspace/[workspaceId]/page/[pageId]` (생성된 첫 페이지)
  2. 쿠키 업데이트: 최근 방문 페이지 ID 저장
  3. 성공 메시지 표시: "Workspace가 생성되었습니다" 토스트
- **에러 처리**:
  - 생성 실패 시 롤백 및 에러 메시지 반환

**Events**:
1. 새 Workspace가 생성됨 (New Workspace Created)
2. Workspace 초기 페이지가 생성됨 (Workspace Initial Page Created, 페이지 이름: "Untitled")
3. 조직 소유자가 Workspace 멤버로 추가됨 (Organization Owner Added to Workspace)
4. 생성된 페이지로 이동됨 (Navigated to New Page)
5. 최근 방문 페이지가 쿠키에 저장됨 (Recent Page Saved to Cookie)

---

## 📍 Scenario 3: Admin이 Workspace에 멤버 초대

### Sequence 1: Admin이 Workspace 멤버 초대 시작

**Trigger Event**: Admin이 "멤버 초대" 버튼 클릭

```
👤 Admin: "팀 멤버들을 이 Workspace에 초대해서 함께 작업하고 싶어"
```

**Policy**: "Whenever 멤버 초대 버튼 클릭됨, then always Admin 권한 확인하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 조직 멤버 목록 (Organization Domain에서 조회)
  - 멤버 이름, 이메일, 현재 역할
  - 이미 Workspace 멤버인 경우: "이미 멤버입니다" 표시 (선택 불가)
  - Workspace 멤버가 아닌 경우: 체크박스 활성화
- 초대 대상 선택 (다중 선택 가능)
- 권한 안내: "조직 Admin 또는 Workspace Admin만 멤버를 초대할 수 있습니다"
- *UI Hint: 모달 또는 사이드 패널, 멤버 선택 체크박스 목록*

**Command**: Workspace 멤버 초대 요청
- Workspace ID
- 초대할 멤버 ID 목록 (다중 선택)
- 초대 메시지 (선택, 최대 200자)

**System**: Workspace System (Server Action)
- **권한 검증** (Server Action 최상단):
  1. 사용자 세션 확인
  2. Organization Domain API 호출: 사용자가 조직 Admin인지 확인
  3. Workspace 멤버십 확인: 사용자가 이 Workspace의 멤버인지 확인
  4. 권한 없으면 → 403 Forbidden
- **입력 검증**:
  - Workspace ID: 유효한 Workspace인지 확인
  - 초대 대상: 모두 조직 멤버인지 확인
  - 중복 체크: 이미 Workspace 멤버인 사용자 제외
  - 초대 메시지: 최대 200자
- **초대 생성 로직** (트랜잭션):
  1. 각 대상에 대해 Workspace 초대 레코드 생성 (status: pending)
  2. Notification Service 주입: 각 대상에게 초대 알림 생성
  3. 트랜잭션 커밋
- **에러 처리**:
  - Notification 생성 실패 시 전체 롤백
  - 일부 대상 초대 실패 시 성공한 것만 처리 (부분 성공)

**Events**:
1. Workspace 멤버 초대가 요청됨 (Workspace Member Invitation Requested)
2. Workspace 초대 알림이 생성됨 (Workspace Invitation Notification Created, Notification Domain 통합)

---

### Sequence 2: 초대받은 사용자가 초대 수락 또는 거절

**Trigger Event**: 초대받은 사용자가 알림을 확인함

```
👤 초대받은 사용자: "Workspace 초대 알림을 받았는데, 수락할지 거절할지 결정하고 싶어"
```

**Policy**: "Whenever 초대 알림 확인됨, then always 초대 상세 정보 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 초대 정보
  - Workspace 이름, 아이콘, 설명
  - 초대한 사람 (Admin 이름)
  - 초대 메시지 (있는 경우)
  - 조직 정보
- 수락/거절 버튼
- *UI Hint: 알림 상세 모달 또는 전용 페이지*

**Command**: 초대 수락 또는 거절
- 초대 ID
- 수락 여부 (true/false)

**System**: Workspace System (Server Action)
- **권한 검증**:
  1. 사용자 세션 확인
  2. 초대 대상이 현재 사용자인지 확인
  3. 초대 상태가 pending인지 확인 (이미 처리된 초대는 불가)
- **수락 처리 로직** (트랜잭션):
  1. 초대 상태 업데이트: pending → accepted
  2. Workspace 멤버십 레코드 생성 (역할: Member)
  3. Notification Service 주입: 알림 상태 업데이트 (읽음 처리)
  4. 트랜잭션 커밋
- **거절 처리 로직** (트랜잭션):
  1. 초대 상태 업데이트: pending → rejected
  2. Notification Service 주입: 알림 상태 업데이트 (읽음 처리)
  3. 트랜잭션 커밋
- **에러 처리**:
  - 이미 처리된 초대: "이미 처리된 초대입니다" 에러
  - Notification 업데이트 실패 시 전체 롤백

**Events**:
1. Workspace 초대가 수락됨 (Workspace Invitation Accepted) - 수락 시
2. 멤버가 Workspace에 추가됨 (Member Added to Workspace) - 수락 시
3. Workspace 초대가 거절됨 (Workspace Invitation Rejected) - 거절 시

---

## 📍 Scenario 4: 멤버가 Page 생성 및 계층 구조 관리

### Sequence 1: 멤버가 새 페이지 생성

**Trigger Event**: 멤버가 "새 페이지 만들기" 버튼 클릭

```
👤 멤버: "새로운 작업을 시작하려고 하는데 빈 페이지를 만들고 싶어"
```

**Policy**: "Whenever 새 페이지 만들기 클릭됨, then always Workspace 멤버 권한 확인하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 페이지 생성 위치 선택
  - 최상위 페이지로 생성
  - 특정 페이지의 하위로 생성 (부모 페이지 선택)
- 기본 페이지 제목: "Untitled"
- 기본 페이지 아이콘: 📄 (기본값)
- *UI Hint: 인라인 생성 또는 간단한 폼*

**Command**: 페이지 생성 요청
- Workspace ID
- 부모 페이지 ID (선택, null이면 최상위)
- 페이지 제목 (기본값: "Untitled")
- 페이지 아이콘 (선택, 기본값 제공)

**System**: Page System (Server Action)
- **권한 검증**:
  1. 사용자 세션 확인
  2. Workspace 멤버십 확인 (Scenario 1의 검증 로직 재사용)
  3. 멤버가 아니면 → 403 Forbidden
- **입력 검증**:
  - Workspace ID: 유효한 Workspace인지 확인
  - 부모 페이지 ID: 같은 Workspace에 속하는지 확인
  - 페이지 제목: 최대 200자
- **페이지 생성 로직**:
  1. Page 레코드 생성
     - workspace_id: Workspace ID
     - parent_id: 부모 페이지 ID (null이면 최상위)
     - title: "Untitled"
     - icon: 기본 아이콘
     - order: 같은 레벨 내 마지막 순서 + 1
     - created_by: 현재 사용자 ID
  2. 빈 캔버스 초기화 (Block System 미구현, 빈 상태로만 생성)
  3. Breadcrumb 경로 계산 및 저장 (Materialized Path 패턴)
  4. 트랜잭션 커밋
- **에러 처리**:
  - 부모 페이지가 삭제된 경우: "유효하지 않은 부모 페이지입니다" 에러
  - 생성 실패 시 롤백

**Events**:
1. 새 페이지가 생성됨 (New Page Created)
2. 빈 캔버스가 초기화됨 (Empty Canvas Initialized, Block System 미구현)
3. 페이지 경로가 업데이트됨 (Page Path Updated)

---

### Sequence 2: 멤버가 페이지를 다른 위치로 이동

**Trigger Event**: 멤버가 페이지를 드래그 앤 드롭으로 이동

```
👤 멤버: "페이지 구조를 정리하고 싶어서 페이지를 다른 위치로 옮기고 싶어"
```

**Policy**: "Whenever 페이지 이동 시작됨, then always 순환 참조 방지 확인하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 페이지 계층 구조 (트리 형태)
- 드래그 앤 드롭 가능 영역 표시
- 이동 불가능한 영역 (자기 자신의 하위) 비활성화
- *UI Hint: 드래그 앤 드롭 인터랙션, 드롭 가능 영역 하이라이트*

**Command**: 페이지 이동 요청
- 이동할 페이지 ID
- 새 부모 페이지 ID (null이면 최상위)
- 새 순서 (같은 레벨 내 위치)

**System**: Page System (Server Action)
- **권한 검증**:
  1. 사용자 세션 확인
  2. Workspace 멤버십 확인
  3. 멤버가 아니면 → 403 Forbidden
- **입력 검증**:
  - 페이지 ID: 유효한 페이지인지 확인
  - 새 부모 페이지 ID: 같은 Workspace에 속하는지 확인
  - **순환 참조 방지**: 
    - 새 부모가 이동할 페이지의 하위가 아닌지 확인
    - Materialized Path로 ancestor 체크
    - 순환 참조 발견 시 → 400 Bad Request, "순환 참조가 발생합니다" 에러
- **페이지 이동 로직** (트랜잭션):
  1. 페이지 parent_id 업데이트
  2. 페이지 order 업데이트 (새 위치)
  3. 같은 레벨의 다른 페이지들 order 재정렬
  4. Breadcrumb 경로 재계산 (Materialized Path 업데이트)
  5. 하위 페이지들의 경로도 재귀적으로 업데이트
  6. 트랜잭션 커밋
- **에러 처리**:
  - 순환 참조: "순환 참조가 발생합니다" (허용하지 않음)
  - 이동 실패 시 롤백

**Events**:
1. 페이지가 다른 페이지의 하위로 이동됨 (Page Moved to Child) - 부모 변경 시
2. 페이지가 최상위로 이동됨 (Page Moved to Root) - 최상위로 이동 시
3. 페이지 순서가 변경됨 (Page Order Changed)
4. 페이지 경로가 업데이트됨 (Page Path Updated)

---

### Sequence 3: 멤버가 페이지 제목 및 아이콘 수정

**Trigger Event**: 멤버가 페이지 제목 또는 아이콘 클릭 (인라인 편집)

```
👤 멤버: "페이지 제목과 아이콘을 수정해서 내용을 명확히 표현하고 싶어"
```

**Policy**: "Whenever 페이지 제목/아이콘 클릭됨, then always 인라인 편집 모드 활성화하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 현재 페이지 제목 (편집 가능)
- 현재 페이지 아이콘 (편집 가능)
- 아이콘 선택 UI (이모지 피커)
- *UI Hint: 인라인 편집, 이모지 피커*

**Command**: 페이지 정보 수정 요청
- 페이지 ID
- 새 제목 (선택, 최대 200자)
- 새 아이콘 (선택, 이모지 또는 이미지 URL)

**System**: Page System (Server Action)
- **권한 검증**:
  1. 사용자 세션 확인
  2. Workspace 멤버십 확인
  3. 멤버가 아니면 → 403 Forbidden
- **입력 검증**:
  - 페이지 ID: 유효한 페이지인지 확인
  - 새 제목: 빈 문자열 불가, 최대 200자
  - 새 아이콘: 유효한 이모지 또는 URL
- **수정 로직**:
  1. 제목 수정 시 → title 필드 업데이트
  2. 아이콘 수정 시 → icon 필드 업데이트
  3. updated_at 타임스탬프 갱신
  4. 트랜잭션 커밋
- **에러 처리**:
  - 빈 제목: "제목은 필수입니다" 에러
  - 수정 실패 시 롤백

**Events**:
1. 페이지 제목이 설정됨 (Page Title Set) - 제목 수정 시
2. 페이지 아이콘이 설정됨 (Page Icon Set) - 아이콘 수정 시

---

### Sequence 4: 멤버가 페이지를 즐겨찾기에 추가/제거

**Trigger Event**: 멤버가 페이지 즐겨찾기 아이콘 클릭

```
👤 멤버: "자주 사용하는 페이지를 즐겨찾기에 추가해서 빠르게 접근하고 싶어"
```

**Policy**: "Whenever 즐겨찾기 아이콘 클릭됨, then always 현재 즐겨찾기 상태 토글하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 페이지 즐겨찾기 상태 (별 아이콘 색상으로 표시)
  - 즐겨찾기 추가됨: ⭐ (노란색)
  - 즐겨찾기 없음: ☆ (회색)
- 즐겨찾기 페이지 목록 (사이드바 상단)
- *UI Hint: 별 아이콘, 즐겨찾기 섹션*

**Command**: 즐겨찾기 토글 요청
- 페이지 ID
- 현재 즐겨찾기 상태 (추가/제거)

**System**: Page System (Server Action)
- **권한 검증**:
  1. 사용자 세션 확인
  2. Workspace 멤버십 확인
  3. 멤버가 아니면 → 403 Forbidden
- **입력 검증**:
  - 페이지 ID: 유효한 페이지인지 확인
- **즐겨찾기 토글 로직**:
  1. 사용자별 즐겨찾기 레코드 조회 (user_id + page_id)
  2. 레코드 존재 → 삭제 (즐겨찾기 제거)
  3. 레코드 없음 → 생성 (즐겨찾기 추가)
  4. 트랜잭션 커밋
- **에러 처리**:
  - 토글 실패 시 롤백

**Events**:
1. 페이지가 즐겨찾기에 추가됨 (Page Added to Favorites) - 추가 시
2. 페이지가 즐겨찾기에서 제거됨 (Page Removed from Favorites) - 제거 시

---

## 📍 Scenario 5: 멤버가 Page 복제 (Post-MVP, Block System 통합 후)

### Sequence 1: 멤버가 페이지 복제 시작

**Trigger Event**: 멤버가 페이지 메뉴에서 "복제" 선택

```
👤 멤버: "기존 페이지를 템플릿으로 사용해서 새 페이지를 만들고 싶어"
```

**Policy**: "Whenever 페이지 복제 선택됨, then always Workspace 멤버 권한 확인하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 복제 확인 메시지
  - "'{페이지 제목}'를 복제하시겠습니까?"
  - "캔버스 내용이 복제됩니다 (하위 페이지는 복제되지 않습니다)"
- 복제 진행 상태 표시 (Block System 비동기 처리)
- *UI Hint: 확인 다이얼로그, 복제 진행 로딩 UI*

**Command**: 페이지 복제 요청
- 원본 페이지 ID
- 복제 위치 (부모 페이지 ID, 선택)

**System**: Page System (Server Action) + Block System (비동기)
- **권한 검증**:
  1. 사용자 세션 확인
  2. Workspace 멤버십 확인
  3. 멤버가 아니면 → 403 Forbidden
- **입력 검증**:
  - 원본 페이지 ID: 유효한 페이지인지 확인
  - 복제 위치: 같은 Workspace에 속하는지 확인
- **페이지 복제 로직** (트랜잭션):
  1. **Page 메타데이터 복제** (동기):
     - 새 Page 레코드 생성
     - title: "{원본 제목} (복사본)"
     - icon: 원본 아이콘 복사
     - parent_id: 원본과 동일 (또는 지정된 위치)
     - order: 원본 바로 다음 순서
     - **주의**: 하위 페이지는 복제하지 않음
  2. **Block 복제 요청** (비동기):
     - Block System에 복제 작업 큐 추가
     - Job ID 생성 및 반환
     - 사용자에게 "복제 진행 중" 메시지 표시
  3. 트랜잭션 커밋 (Page 메타데이터만)
- **Block 복제 처리** (백그라운드):
  - Block System이 비동기로 블록들 복제
  - 복제 완료 시 → Page 상태 업데이트 (복제 완료)
  - 복제 실패 시 → Page 상태 업데이트 (복제 실패), 사용자에게 알림
- **에러 처리**:
  - Page 복제 실패 시 롤백
  - Block 복제 실패 시 Page는 유지 (빈 캔버스 상태)

**Events**:
1. 페이지가 복제됨 (Page Duplicated)
2. 복제된 페이지가 생성됨 (Duplicated Page Created)
3. 블록 복제 작업이 큐에 추가됨 (Block Duplication Job Queued, Block System)

---

## 📍 Scenario 6: 멤버가 Page 삭제 및 복구

### Sequence 1: 멤버가 페이지 삭제 (휴지통으로 이동)

**Trigger Event**: 멤버가 페이지 메뉴에서 "삭제" 선택

```
👤 멤버: "더 이상 필요 없는 페이지를 삭제하고 싶어"
```

**Policy**: "Whenever 페이지 삭제 선택됨, then always 하위 페이지 확인하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 삭제 확인 메시지
  - "'{페이지 제목}'를 삭제하시겠습니까?"
  - 하위 페이지 있는 경우: "하위 페이지 {개수}개도 함께 삭제됩니다"
  - "휴지통에서 30일 동안 복구할 수 있습니다"
- *UI Hint: 확인 다이얼로그, 경고 메시지*

**Command**: 페이지 삭제 요청
- 페이지 ID
- 삭제 확인

**System**: Page System (Server Action)
- **권한 검증**:
  1. 사용자 세션 확인
  2. Workspace 멤버십 확인
  3. 멤버가 아니면 → 403 Forbidden
- **입력 검증**:
  - 페이지 ID: 유효한 페이지인지 확인
  - 이미 삭제된 페이지인지 확인
- **소프트 삭제 로직** (트랜잭션):
  1. 페이지 deleted_at 타임스탬프 설정 (현재 시간)
  2. 하위 페이지들 재귀적으로 deleted_at 설정 (계층 구조 유지)
  3. 삭제 전 부모 정보 백업 (복구 시 사용)
  4. 트랜잭션 커밋
- **에러 처리**:
  - 삭제 실패 시 롤백

**Events**:
1. 페이지 삭제가 요청됨 (Page Deletion Requested)
2. 페이지가 휴지통으로 이동됨 (Page Moved to Trash)
3. 하위 페이지들이 함께 휴지통으로 이동됨 (Child Pages Moved to Trash Together) - 하위 페이지 있는 경우

---

### Sequence 2: 멤버가 휴지통에서 페이지 복구

**Trigger Event**: 멤버가 휴지통에서 "복구" 버튼 클릭

```
👤 멤버: "실수로 삭제한 페이지를 다시 복구하고 싶어"
```

**Policy**: "Whenever 페이지 복구 선택됨, then always 원래 위치 정보 확인하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 휴지통 페이지 목록
  - 삭제된 페이지들 (삭제 시간순 정렬)
  - 각 페이지: 제목, 아이콘, 삭제 시간, 남은 일수
  - 30일 경과 페이지: "곧 완전 삭제됩니다" 경고
- 복구 확인 메시지
  - "'{페이지 제목}'를 복구하시겠습니까?"
  - 하위 페이지 있는 경우: "하위 페이지 {개수}개도 함께 복구됩니다"
- *UI Hint: 휴지통 목록, 복구 버튼*

**Command**: 페이지 복구 요청
- 페이지 ID
- 복구 확인

**System**: Page System (Server Action)
- **권한 검증**:
  1. 사용자 세션 확인
  2. Workspace 멤버십 확인
  3. 멤버가 아니면 → 403 Forbidden
- **입력 검증**:
  - 페이지 ID: 유효한 페이지인지 확인
  - deleted_at이 설정되어 있는지 확인 (삭제된 페이지만 복구 가능)
  - 30일 경과 여부 확인 (경과 시 복구 불가)
- **복구 로직** (트랜잭션):
  1. 페이지 deleted_at 필드 null로 설정
  2. 원래 부모 정보 복원 (백업된 parent_id 사용)
  3. 하위 페이지들 재귀적으로 deleted_at null 설정 (계층 구조 복원)
  4. Breadcrumb 경로 재계산
  5. 트랜잭션 커밋
- **원래 위치 복구 불가 시**:
  - 원래 부모 페이지가 삭제된 경우 → 최상위로 복구
  - 사용자에게 "원래 위치로 복구할 수 없어 최상위로 복구되었습니다" 안내
- **에러 처리**:
  - 30일 경과: "복구 기간이 만료되었습니다" 에러
  - 복구 실패 시 롤백

**Events**:
1. 페이지가 휴지통에서 복구됨 (Page Restored from Trash)
2. 하위 페이지들이 함께 복구됨 (Child Pages Restored Together) - 하위 페이지 있는 경우
3. 페이지 경로가 업데이트됨 (Page Path Updated)

---

### Sequence 3: 멤버가 휴지통 비우기 (모든 페이지 영구 삭제)

**Trigger Event**: 멤버가 "휴지통 비우기" 버튼 클릭

```
👤 멤버: "휴지통의 모든 페이지를 완전히 삭제하고 싶어"
```

**Policy**: "Whenever 휴지통 비우기 클릭됨, then always 최종 확인하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 최종 확인 메시지
  - "휴지통의 모든 페이지를 완전히 삭제하시겠습니까?"
  - "삭제된 페이지 {개수}개"
  - "이 작업은 되돌릴 수 없습니다"
- *UI Hint: 위험 확인 다이얼로그, 빨간색 버튼*

**Command**: 휴지통 비우기 요청
- Workspace ID
- 최종 확인 (텍스트 입력: "CONFIRM")

**System**: Page System (Server Action)
- **권한 검증**:
  1. 사용자 세션 확인
  2. Workspace 멤버십 확인
  3. 멤버가 아니면 → 403 Forbidden
- **입력 검증**:
  - Workspace ID: 유효한 Workspace인지 확인
  - 최종 확인: "CONFIRM" 텍스트 일치 확인
- **영구 삭제 로직** (트랜잭션):
  1. 해당 Workspace의 deleted_at이 설정된 모든 페이지 조회
  2. 각 페이지에 대해:
     - Block System 호출: 캔버스 블록 완전 삭제 요청 (미래)
     - Page 레코드 완전 삭제 (DB에서 제거)
  3. 트랜잭션 커밋
- **에러 처리**:
  - Block 삭제 실패 시에도 Page는 삭제 (Block은 고아 레코드로 남음, 추후 정리)
  - 삭제 실패 시 롤백

**Events**:
1. 휴지통이 비워짐 (Trash Emptied)
2. 페이지가 완전히 삭제됨 (Page Permanently Deleted) - 각 페이지마다

---

### Sequence 4: 배치 작업이 30일 경과 페이지 자동 삭제

**Trigger Event**: 배치 작업 스케줄러 실행 (매일 실행)

```
🔧 시스템: "매일 30일이 경과한 삭제 페이지들을 자동으로 완전 삭제"
```

**Policy**: "Whenever 배치 작업 실행됨, then always 30일 경과 페이지 조회하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
> N/A (백그라운드 시스템 작업, 사용자에게 직접 보여지는 정보 없음)

**Command**: 30일 경과 페이지 삭제 (자동 실행)
- 현재 날짜
- 삭제 기준: deleted_at < (현재 날짜 - 30일)

**System**: Page System (Batch Job)
- **30일 경과 페이지 조회**:
  - deleted_at < (현재 날짜 - 30일) 조건으로 페이지 조회
  - 모든 Workspace의 페이지 포함
- **영구 삭제 로직** (각 페이지별 트랜잭션):
  1. 페이지 조회
  2. Block System 호출: 캔버스 블록 완전 삭제 요청 (미래)
  3. Page 레코드 완전 삭제 (DB에서 제거)
  4. 트랜잭션 커밋
  5. 다음 페이지 처리
- **에러 처리**:
  - 개별 페이지 삭제 실패 시 로그 기록 후 다음 페이지 계속 처리
  - Block 삭제 실패 시에도 Page는 삭제
- **로깅**:
  - 삭제된 페이지 수 기록
  - 실패한 페이지 ID 및 에러 로그

**Events**:
1. 페이지가 완전히 삭제됨 (Page Permanently Deleted) - 각 페이지마다
2. 배치 삭제 작업이 완료됨 (Batch Deletion Job Completed)

---

## 📍 Scenario 7: 조직 소유자가 Workspace 삭제 및 복구

### Sequence 1: 조직 소유자가 Workspace 삭제 (휴지통으로 이동)

**Trigger Event**: 조직 소유자가 Workspace 메뉴에서 "삭제" 선택

```
👤 조직 소유자: "더 이상 필요 없는 Workspace를 삭제하고 싶어"
```

**Policy**: "Whenever Workspace 삭제 선택됨, then always Default Workspace 여부 확인하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 삭제 확인 메시지
  - "'{Workspace 이름}'를 삭제하시겠습니까?"
  - "모든 페이지 {개수}개가 함께 삭제됩니다"
  - "휴지통에서 30일 동안 복구할 수 있습니다"
- Default Workspace인 경우: "기본 워크스페이스는 삭제할 수 없습니다" 메시지, 삭제 버튼 비활성화
- *UI Hint: 확인 다이얼로그, 위험 경고 메시지*

**Command**: Workspace 삭제 요청
- Workspace ID
- 삭제 확인

**System**: Workspace System (Server Action)
- **권한 검증**:
  1. 사용자 세션 확인
  2. Organization Domain API 호출: 사용자가 조직 소유자인지 확인
  3. 조직 소유자가 아니면 → 403 Forbidden
- **입력 검증**:
  - Workspace ID: 유효한 Workspace인지 확인
  - **Default Workspace 체크**: is_default 플래그 확인
    - is_default=true이면 → 400 Bad Request, "기본 워크스페이스는 삭제할 수 없습니다" 에러
  - 이미 삭제된 Workspace인지 확인
- **소프트 삭제 로직** (트랜잭션):
  1. Workspace deleted_at 타임스탬프 설정 (현재 시간)
  2. 해당 Workspace의 모든 페이지 deleted_at 설정 (숨김 처리)
  3. 페이지 계층 구조 유지 (복구 시 사용)
  4. Workspace 멤버십 레코드 유지 (복구 시 사용)
  5. 트랜잭션 커밋
- **에러 처리**:
  - Default Workspace 삭제 시도: "기본 워크스페이스는 삭제할 수 없습니다" 에러
  - 삭제 실패 시 롤백

**Events**:
1. Workspace 삭제가 요청됨 (Workspace Deletion Requested)
2. Workspace가 휴지통으로 이동됨 (Workspace Moved to Trash)
3. Workspace 내 모든 페이지가 숨겨짐 (All Pages in Workspace Hidden)

---

### Sequence 2: 조직 소유자가 휴지통에서 Workspace 복구

**Trigger Event**: 조직 소유자가 휴지통에서 "복구" 버튼 클릭

```
👤 조직 소유자: "실수로 삭제한 Workspace를 다시 복구하고 싶어"
```

**Policy**: "Whenever Workspace 복구 선택됨, then always 30일 경과 여부 확인하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 휴지통 Workspace 목록
  - 삭제된 Workspace들 (삭제 시간순 정렬)
  - 각 Workspace: 이름, 아이콘, 삭제 시간, 페이지 수, 남은 일수
  - 30일 경과 Workspace: "곧 완전 삭제됩니다" 경고
- 복구 확인 메시지
  - "'{Workspace 이름}'를 복구하시겠습니까?"
  - "모든 페이지 {개수}개도 함께 복구됩니다"
- *UI Hint: 휴지통 목록, 복구 버튼*

**Command**: Workspace 복구 요청
- Workspace ID
- 복구 확인

**System**: Workspace System (Server Action)
- **권한 검증**:
  1. 사용자 세션 확인
  2. Organization Domain API 호출: 사용자가 조직 소유자인지 확인
  3. 조직 소유자가 아니면 → 403 Forbidden
- **입력 검증**:
  - Workspace ID: 유효한 Workspace인지 확인
  - deleted_at이 설정되어 있는지 확인 (삭제된 Workspace만 복구 가능)
  - 30일 경과 여부 확인 (경과 시 복구 불가)
- **복구 로직** (트랜잭션):
  1. Workspace deleted_at 필드 null로 설정
  2. 해당 Workspace의 모든 페이지 deleted_at null 설정 (복원)
  3. 페이지 계층 구조 복원
  4. Workspace 멤버십 복원 (이미 유지되어 있음)
  5. 트랜잭션 커밋
- **에러 처리**:
  - 30일 경과: "복구 기간이 만료되었습니다" 에러
  - 복구 실패 시 롤백

**Events**:
1. Workspace가 휴지통에서 복구됨 (Workspace Restored from Trash)
2. Workspace 내 모든 페이지가 복원됨 (All Pages in Workspace Restored)

---

### Sequence 3: 배치 작업이 30일 경과 Workspace 자동 삭제

**Trigger Event**: 배치 작업 스케줄러 실행 (매일 실행)

```
🔧 시스템: "매일 30일이 경과한 삭제 Workspace들을 자동으로 완전 삭제"
```

**Policy**: "Whenever 배치 작업 실행됨, then always 30일 경과 Workspace 조회하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
> N/A (백그라운드 시스템 작업, 사용자에게 직접 보여지는 정보 없음)

**Command**: 30일 경과 Workspace 삭제 (자동 실행)
- 현재 날짜
- 삭제 기준: deleted_at < (현재 날짜 - 30일)

**System**: Workspace System (Batch Job)
- **30일 경과 Workspace 조회**:
  - deleted_at < (현재 날짜 - 30일) 조건으로 Workspace 조회
  - 모든 조직의 Workspace 포함
- **영구 삭제 로직** (각 Workspace별 트랜잭션):
  1. Workspace 조회
  2. 해당 Workspace의 모든 페이지 조회
  3. 각 페이지에 대해:
     - Block System 호출: 캔버스 블록 완전 삭제 요청 (미래)
     - Page 레코드 완전 삭제 (DB에서 제거)
  4. Workspace 멤버십 레코드 완전 삭제
  5. Workspace 레코드 완전 삭제 (DB에서 제거)
  6. 트랜잭션 커밋
  7. 다음 Workspace 처리
- **에러 처리**:
  - 개별 Workspace 삭제 실패 시 로그 기록 후 다음 Workspace 계속 처리
  - Block 삭제 실패 시에도 Page/Workspace는 삭제
- **로깅**:
  - 삭제된 Workspace 수 기록
  - 삭제된 페이지 수 기록
  - 실패한 Workspace ID 및 에러 로그

**Events**:
1. Workspace가 완전히 삭제됨 (Workspace Permanently Deleted) - 각 Workspace마다
2. Workspace 관련 데이터가 정리됨 (Workspace Related Data Cleaned Up)
3. 배치 삭제 작업이 완료됨 (Batch Deletion Job Completed)

---

## 💡 핵심 Policy 정리

### Workspace 관련 Policy
- "Whenever 조직이 생성됨, then always Default Workspace 생성하기"
- "Whenever Default Workspace 삭제 시도됨, then always 거부하기" (is_default=true 체크)
- "Whenever 새 Workspace 만들기 클릭됨, then always 조직 소유자 권한 확인하기"
- "Whenever 조직 경로 접근됨, then always 조직의 모든 Workspace-페이지 목록 로드하기"
- "Whenever 페이지가 선택됨, then always Workspace 멤버십 확인하기"
- "Whenever Workspace 멤버십 없음, then always 권한 없음 페이지 표시하기"
- "Whenever 쿠키 페이지 유효하지 않음, then always Default Workspace 첫 페이지로 Fallback하기"

### Page 관련 Policy
- "Whenever 새 페이지 만들기 클릭됨, then always Workspace 멤버 권한 확인하기"
- "Whenever 페이지 이동 시작됨, then always 순환 참조 방지 확인하기" (Materialized Path로 ancestor 체크)
- "Whenever 페이지 삭제 선택됨, then always 하위 페이지 확인하기"
- "Whenever 페이지 복제 선택됨, then always 하위 페이지는 제외하기"

### 멤버십 관련 Policy
- "Whenever 멤버 초대 버튼 클릭됨, then always Admin 권한 확인하기"
- "Whenever 멤버 초대 요청됨, then always 이미 멤버인지 확인하기" (중복 방지)
- "Whenever 초대 알림 확인됨, then always 초대 상세 정보 표시하기"

### 삭제 및 복구 Policy
- "Whenever 페이지/Workspace 삭제 선택됨, then always 소프트 삭제로 처리하기" (deleted_at 설정)
- "Whenever 삭제된 항목이 30일 경과됨, then always 배치 작업으로 완전 삭제하기"
- "Whenever 페이지/Workspace 복구 선택됨, then always 30일 경과 여부 확인하기"

### 권한 및 접근 제어 Policy
- "Whenever Server Component/Action 진입됨, then always 최상단에서 권한 검증하기"
- "Whenever 권한 검증 실패됨, then always 403 Forbidden 반환하기"
- "Whenever Organization Domain API 장애 발생됨, then always 접근 거부하기" (Fail-safe)

### External System 통합 Policy
- "Whenever Workspace 생성 실패됨, then immediately 재시도하기" (최대 3회)
- "Whenever 최종 재시도 실패됨, then always Organization 생성 중단하기"
- "Whenever Notification 생성 실패됨, then always 전체 트랜잭션 롤백하기"

---

## 🔧 기술 권장사항

### 권한 검증 전략
- **Server Component 최상단**: 페이지 진입 시 권한 검증 (Middleware 역할)
- **Server Action 최상단**: 모든 Action에서 권한 먼저 검증
- **Organization Domain API**: 조직 멤버십 및 역할 확인
- **캐싱**: 세션 기간 동안 권한 정보 캐시 (성능 최적화)

### 트랜잭션 관리
- **동기 처리**: Organization → Workspace → Page 생성은 하나의 트랜잭션
- **서비스 주입**: 도메인 간 서비스 직접 주입 (Workspace Service → Page Service)
- **실패 재시도**: Workspace/Page 생성 실패 시 즉시 재시도 (최대 3회)
- **롤백 정책**: 최종 실패 시 전체 트랜잭션 롤백

### Page 계층 구조 관리
- **Materialized Path 패턴** 권장:
  - 경로를 문자열로 저장 (예: `/1/5/23/45`)
  - 조회는 빠름 (LIKE 쿼리)
  - 이동 시 경로 업데이트 필요 (하위 페이지 재귀 업데이트)
- **순환 참조 방지**: Materialized Path로 ancestor 체크
- **Breadcrumb**: 경로 문자열로 즉시 계산 가능

### 소프트 삭제 및 배치 작업
- **소프트 삭제**: deleted_at 타임스탬프만 설정 (즉시 처리)
- **배치 작업**: 매일 실행, 30일 경과 항목 자동 삭제
- **스케줄러**: Cron Job 또는 Scheduled Task 사용
- **로깅**: 삭제 작업 결과 로그 기록

### 쿠키 관리
- **최근 방문 페이지**: 브라우저 쿠키에만 저장 (DB 저장 X)
- **서버 검증**: 쿠키 페이지 ID 유효성 서버에서 확인
- **Fallback**: 유효하지 않으면 Default Workspace의 첫 번째 페이지로 자동 이동
- **보안**: HttpOnly, Secure 플래그 설정

### External System 통합
- **동기 처리**: Organization/Notification Service 주입하여 동기 호출
- **트랜잭션 경계**: 외부 도메인 호출도 같은 트랜잭션에 포함
- **실패 처리**: 외부 서비스 실패 시 전체 롤백

### 성능 최적화
- **권한 캐싱**: 세션 기간 동안 권한 정보 캐시
- **페이지 목록 로드**: 필요한 데이터만 선택적으로 조회
- **Lazy Loading**: 하위 페이지는 필요할 때만 로드 (선택사항)
- **Materialized Path**: 빠른 계층 구조 조회

---

*이 Process Model 문서는 Workspace Management Domain의 Software Design 및 User Flow 작성을 위한 기반 자료입니다.*

