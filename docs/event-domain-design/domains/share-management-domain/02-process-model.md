# Process Model: Share Management Domain

## 🎯 개요

**도메인**: Share Management  
**작성자**: 도메인전문가 + 시니어개발자  
**작성일**: 2026-01-02  
**버전**: v1.0

**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: `03-software-design.md` (Backend), `03-user-flow.md` (Frontend)

---

## 🎯 Process Modeling Overview
Share Management Domain의 핵심 프로세스를 실제 상호작용 순서에 따라 정의

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

### 🟪 External Systems

Share Management Domain은 다음 외부 도메인들과 통합됩니다:

#### External System 1: Workspace Management Domain (Page Structure Context)
**역할**: 페이지 정보 조회
- **SSOT**: Workspace Management Domain (Page Structure Context)이 페이지 데이터의 Single Source of Truth
- **통합 방식**:
  - **페이지 정보 조회**: 동기적 서비스 주입 (Next.js Server Actions)
- **Failure Strategy**:
  - 페이지 정보 조회 실패 시 에러 메시지 표시 또는 빈 상태 처리

#### External System 2: Workspace Management Domain
**역할**: 페이지 복제 처리, 워크스페이스 목록 조회
- **SSOT**: Workspace Management Domain이 워크스페이스/페이지 복제 데이터의 Single Source of Truth
- **통합 방식**:
  - **페이지 복제**: 동기적 서비스 주입 (Next.js Server Actions)
  - **워크스페이스 목록 조회**: 동기적 서비스 주입 (Next.js Server Actions)
- **Failure Strategy**:
  - 페이지 복제 실패 시 사용자에게 에러 메시지 표시 및 재시도 안내
  - 워크스페이스 목록 조회 실패 시 빈 목록 반환 또는 에러 처리

#### External System 3: Auth Domain System (User Management Domain)
**역할**: 회원 여부 확인, 인증 처리
- **SSOT**: User Management Domain이 사용자 인증 데이터의 Single Source of Truth
- **통합 방식**:
  - **회원 여부 확인**: 동기적 API 호출 (Next.js Server Actions)
  - **로그인 처리**: User Management Domain으로 리다이렉션
- **Failure Strategy**:
  - 회원 여부 확인 실패 시 비회원으로 처리
  - 로그인 실패 시 에러 메시지 표시

---

## 📍 Scenario 1: 페이지 소유자가 페이지 게시

### Sequence 1: 페이지 소유자가 페이지 게시 요청

**Trigger Event**: 페이지 소유자가 페이지 게시를 시작함

```
👤 페이지 소유자: "내가 작성한 페이지를 공개하여 다른 사람들이 볼 수 있게 하고 싶어"
```

**Policy**: 
- "Whenever 페이지 게시 요청됨, then always 페이지 소유자 권한 확인하기"
- "Whenever 페이지 게시 완료됨, then always 게시 링크 생성하기"
- "게시된 페이지는 스냅샷 방식으로 관리 (게시 시점 버전 고정)"
- "원본 페이지는 소유자만 수정 가능, 게시된 페이지는 읽기 전용"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 현재 게시 상태 (게시됨/미게시)
- 게시 확인 메시지
  - "'{페이지 제목}'를 게시하시겠습니까?"
  - "게시된 페이지는 누구나 링크를 통해 접근할 수 있습니다"
  - "게시 시점의 버전이 고정됩니다 (원본 수정 시 게시된 페이지는 변경되지 않습니다)"
- 게시 진행 상태 표시
- 게시 완료 후 게시 링크 표시
- *UI Hint: 게시 확인 다이얼로그, 게시 링크 표시 영역*

**Command**: 페이지 게시 요청 (사용자가 입력하는 정보)
- 페이지 ID
- 게시 확인

**System**: Share System (Backend - Security Enforcement)
- **권한 검증**:
  1. 사용자 세션 확인
  2. 페이지 소유자 확인 (Workspace Management Domain에서 페이지 소유자 정보 조회)
  3. 소유자가 아니면 → 403 Forbidden
- **입력 검증**:
  - 페이지 ID: 유효한 페이지인지 확인
  - 페이지가 이미 게시된 상태인지 확인 (중복 게시 방지)
- **게시 처리 로직** (트랜잭션):
  1. **게시 상태 업데이트**:
     - 페이지 게시 상태를 "Published"로 변경
     - 게시 시점 타임스탬프 저장
  2. **게시 링크 생성**:
     - 고유 토큰 생성 (UUID를 Base64로 인코딩)
     - 게시 링크와 페이지 매핑 저장
     - 링크 형식: `/p/[token]`
  3. **페이지 스냅샷 저장** (선택사항, 향후 구현):
     - 게시 시점의 페이지 메타데이터 저장
     - 블록 데이터는 Workspace Management Domain에서 조회
- **에러 처리**:
  - 게시 실패 시 롤백
  - 사용자에게 에러 메시지 표시

**Events**:
1. 페이지가 게시됨 (Page Published)
2. 게시 링크가 생성됨 (Publish Link Generated)

---

## 📍 Scenario 2: 비회원이 게시 링크 접속 및 복제 시도

### Sequence 1: 비회원이 게시 링크 접속

**Trigger Event**: 비회원이 게시 링크 URL에 접속함

```
👤 비회원: "공유된 페이지 링크를 클릭해서 내용을 보고 싶어"
```

**Policy**: 
- "Whenever 게시 링크 접속됨, then always 게시 링크 유효성 검증하기"
- "게시된 페이지는 누구나(회원/비회원) 접근 가능"
- "게시된 페이지는 읽기 전용 (수정 불가)"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 게시된 페이지 정보
  - 페이지 제목
  - 페이지 아이콘
  - 페이지 내용 (블록 데이터, Workspace Management Domain에서 조회)
- 게시 링크 복제 버튼
- 페이지 복제 버튼 (비회원의 경우 로그인 안내)
- *UI Hint: 게시된 페이지 뷰어, 링크 복제 버튼, 복제 버튼*
- *UI Hint: 편집 불가 상태 표시*

**Command**: 게시 링크 접속 (시스템이 자동 처리)
- 게시 링크 토큰

**System**: Share System (Backend)
- **게시 링크 검증**:
  1. 토큰 유효성 확인
  2. 게시 링크와 페이지 매핑 조회
  3. 게시 상태 확인 (게시되지 않은 페이지면 404)
- **페이지 정보 조회**:
  - Workspace Management Domain (Page Structure Context)에서 페이지 정보 조회
  - 게시 시점 스냅샷이 있으면 스냅샷 사용, 없으면 현재 페이지 정보 사용
- **접근 로그 기록** (선택사항, 향후 구현):
  - 게시 링크 접근 통계 저장

**Events**:
1. 게시 링크에 접속됨 (Publish Link Accessed)

---

### Sequence 2: 비회원이 링크 복제

**Trigger Event**: 비회원이 링크 복제 버튼을 클릭함

```
👤 비회원: "게시 링크를 복사해서 다른 사람에게 공유하고 싶어"
```

**Policy**: 
- "Whenever 링크 복제 요청됨, then always 게시 링크 복제 허용하기"
- "링크 복제는 회원/비회원 모두 가능"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 링크 복제 완료 메시지
- 복제된 링크 (클립보드에 복사됨)
- *UI Hint: 링크 복제 완료 토스트 메시지*

**Command**: 링크 복제 요청 (사용자가 입력하는 정보)
- 게시 링크 토큰

**System**: Share System (Frontend)
- **처리 로직**:
  - 게시 링크 URL을 클립보드에 복사
  - 복제 완료 피드백 표시

**Events**:
1. 링크가 복제됨 (Link Copied)

---

### Sequence 3: 비회원이 페이지 복제 시도

**Trigger Event**: 비회원이 페이지 복제 버튼을 클릭함

```
👤 비회원: "이 페이지를 내 워크스페이스로 복제하고 싶어"
```

**Policy**: 
- "Whenever 페이지 복제 시도됨, then always 회원 여부 확인하기"
- "비회원의 경우 로그인 요구 후 복제 워크플로우 재개"
- "로그인 후 복제 의도 상태 유지 (URL 파라미터 또는 세션 저장)"
- "로그인 완료 시 Scenario 3 Sequence 2로 전환하여 복제 재개"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 로그인 안내 메시지
  - "페이지를 복제하려면 로그인이 필요합니다"
  - "로그인 후 복제를 계속 진행할 수 있습니다"
- 로그인 버튼
- *UI Hint: 로그인 안내 다이얼로그 또는 모달*

**Command**: 페이지 복제 시도 (사용자가 입력하는 정보)
- 게시 링크 토큰
- 복제 의도 확인

**System**: Share System (Backend) → Auth Domain System (User Management Domain)
- **회원 여부 확인**:
  1. 사용자 세션 확인
  2. Auth Domain System (User Management Domain)에서 회원 여부 확인
- **비회원 처리**:
  - 비회원인 경우 로그인 페이지로 리다이렉션
  - 복제 의도 상태 저장 (URL 파라미터: `?action=copy&token=[publish-token]` 또는 세션 저장)
  - 로그인 성공 후 복제 워크플로우 재개를 위한 정보 전달

**Events**:
1. 페이지 복제가 시도됨 (Page Copy Attempted)
2. 회원 여부가 확인됨 (Membership Status Checked) - 비회원
3. 로그인이 요구됨 (Login Required)

---

## 📍 Scenario 3: 회원이 게시 링크 접속 및 페이지 복제

### Sequence 1: 회원이 게시 링크 접속

**Trigger Event**: 회원이 게시 링크 URL에 접속함

```
👤 회원: "공유된 페이지 링크를 클릭해서 내용을 보고 복제하고 싶어"
```

**Policy**: 
- "Whenever 게시 링크 접속됨, then always 게시 링크 유효성 검증하기"
- "게시된 페이지는 누구나(회원/비회원) 접근 가능"
- "게시된 페이지는 읽기 전용 (수정 불가)"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 게시된 페이지 정보
  - 페이지 제목
  - 페이지 아이콘
  - 페이지 내용 (블록 데이터, Workspace Management Domain에서 조회)
- 게시 링크 복제 버튼
- 페이지 복제 버튼 (회원의 경우 바로 복제 가능)
- *UI Hint: 게시된 페이지 뷰어, 링크 복제 버튼, 복제 버튼*
- *UI Hint: 편집 불가 상태 표시*

**Command**: 게시 링크 접속 (시스템이 자동 처리)
- 게시 링크 토큰

**System**: Share System (Backend)
- **게시 링크 검증**:
  1. 토큰 유효성 확인
  2. 게시 링크와 페이지 매핑 조회
  3. 게시 상태 확인 (게시되지 않은 페이지면 404)
- **페이지 정보 조회**:
  - Workspace Management Domain (Page Structure Context)에서 페이지 정보 조회
  - 게시 시점 스냅샷이 있으면 스냅샷 사용, 없으면 현재 페이지 정보 사용
- **접근 로그 기록** (선택사항, 향후 구현):
  - 게시 링크 접근 통계 저장

**Events**:
1. 게시 링크에 접속됨 (Publish Link Accessed)

---

### Sequence 2: 회원이 페이지 복제 시도

**Trigger Event**: 회원이 페이지 복제 버튼을 클릭함

```
👤 회원: "이 페이지를 내 워크스페이스로 복제하고 싶어"
```

**Policy**: 
- "Whenever 페이지 복제 시도됨, then always 회원 여부 확인하기"
- "회원인 경우 워크스페이스 목록 조회 후 복제 진행"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 복제 확인 메시지
  - "'{페이지 제목}'를 복제하시겠습니까?"
  - "복제된 페이지는 선택한 워크스페이스에 생성됩니다"
- 워크스페이스 선택 옵션 목록
  - 사용자가 속한 모든 워크스페이스 목록 (조직별 그룹화 가능)
  - 각 워크스페이스 정보 (이름, 아이콘, 조직명)
- *UI Hint: 복제 확인 다이얼로그, 워크스페이스 선택 UI*

**Command**: 페이지 복제 시도 (사용자가 입력하는 정보)
- 게시 링크 토큰
- 복제 확인

**System**: Share System (Backend) → Auth Domain System (User Management Domain)
- **회원 여부 확인**:
  1. 사용자 세션 확인
  2. Auth Domain System (User Management Domain)에서 회원 여부 확인
  3. 회원이 아니면 → 로그인 요구 (Scenario 2 Sequence 3으로 이동)
- **워크스페이스 목록 조회**:
  - Workspace Management Domain에서 사용자가 속한 워크스페이스 목록 조회
  - 워크스페이스 정보 반환 (이름, 아이콘, 조직명 등)

**Events**:
1. 페이지 복제가 시도됨 (Page Copy Attempted)
2. 회원 여부가 확인됨 (Membership Status Checked) - 회원
3. 워크스페이스 목록이 로드됨 (Workspace List Loaded)

---

### Sequence 3: 회원이 워크스페이스 선택 및 복제 실행

**Trigger Event**: 회원이 워크스페이스를 선택하고 복제를 확인함

```
👤 회원: "이 워크스페이스로 페이지를 복제하겠어"
```

**Policy**: 
- "Whenever 워크스페이스 선택됨, then always 워크스페이스 접근 권한 확인하기"
- "페이지 복제 시 원본 페이지의 제목, 아이콘, 블록 구조 복제"
- "복제된 페이지 제목은 원본 제목 유지 또는 'Copy of [제목]' 형식"
- "복제된 페이지는 선택한 워크스페이스의 최상위에 생성"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 복제 진행 상태 표시
  - "페이지를 복제하는 중..."
- 복제 완료 메시지
  - "페이지가 성공적으로 복제되었습니다"
  - 복제된 페이지로 이동 옵션
- 복제 실패 메시지 (실패 시)
  - "복제에 실패했습니다. 다시 시도해주세요"
- *UI Hint: 복제 진행 로딩 UI, 완료/실패 메시지*

**Command**: 페이지 복제 실행 (사용자가 입력하는 정보)
- 게시 링크 토큰
- 선택한 워크스페이스 ID
- 복제 최종 확인

**System**: Share System (Backend) → Workspace Management Domain
- **권한 검증**:
  1. 사용자 세션 확인
  2. 선택한 워크스페이스에 대한 사용자 접근 권한 확인 (Workspace Management Domain)
  3. 권한 없으면 → 403 Forbidden
- **입력 검증**:
  - 게시 링크 토큰: 유효한 게시 링크인지 확인
  - 워크스페이스 ID: 사용자가 속한 워크스페이스인지 확인
- **페이지 복제 처리** (트랜잭션):
  1. **원본 페이지 정보 조회**:
     - Workspace Management Domain (Page Structure Context)에서 원본 페이지 정보 조회
     - 게시 시점 스냅샷이 있으면 스냅샷 사용
  2. **페이지 복제 요청**:
     - Workspace Management Domain의 Page System에 페이지 복제 요청
     - 복제 대상: 선택한 워크스페이스
     - 복제 내용: 페이지 제목, 아이콘, 블록 구조
  3. **복제 결과 처리**:
     - 복제 성공 시 복제된 페이지 ID 반환
     - 복제 실패 시 에러 메시지 반환
- **에러 처리**:
  - 복제 실패 시 사용자에게 에러 메시지 표시
  - 재시도 옵션 제공

**Events**:
1. 워크스페이스가 선택됨 (Workspace Selected)
2. 페이지가 복제됨 (Page Copied)
3. 페이지 복제가 실패됨 (Page Copy Failed) *향후 구현*

---

## 💡 핵심 Policy 정리

### 페이지 게시 관련
1. **게시 권한**: 페이지 소유자만 게시 가능
2. **게시 상태 관리**: MVP에서는 게시만 지원, 비게시는 향후 구현
3. **MVP 제외 범위**: 비게시, 링크 만료
4. **스냅샷 방식**: 게시 시점 버전 고정 (원본 수정 시 게시된 페이지는 변경되지 않음)
5. **원본 수정 정책**: 원본 페이지는 소유자만 수정 가능, 게시된 페이지는 읽기 전용

### 게시 링크 접근 관련
6. **공개 접근**: 게시된 페이지는 누구나(회원/비회원) 접근 가능
7. **읽기 전용**: 게시된 페이지는 수정 불가
8. **링크 복제**: 게시 링크는 누구나 복제 가능

### 페이지 복제 관련
9. **회원 제한**: 회원만 페이지 복제 가능, 비회원은 로그인 후 복제 가능
10. **워크스페이스 선택**: 복제 시 자신이 속한 워크스페이스 중 선택
11. **복제 내용**: 페이지 제목, 아이콘, 블록 구조 복제 (하위 페이지는 복제하지 않음)
12. **복제 위치**: 복제된 페이지는 선택한 워크스페이스의 최상위에 생성

### 외부 도메인 통합 관련
13. **Workspace Management Domain (Page Structure Context) 통합**: 페이지 정보 조회
14. **Workspace Management Domain 통합**: 페이지 복제, 워크스페이스 목록 조회
15. **Auth Domain System (User Management Domain) 통합**: 회원 여부 확인, 로그인 처리

---

## 🔧 기술 권장사항

### 게시 링크 보안
- **토큰 생성**: UUID를 Base64로 인코딩 (짧으면서 고유성 보장)
- **토큰 검증**: 게시 링크 접근 시 토큰 유효성 검증
- **링크 만료**: 향후 구현 (MVP 제외)

### 페이지 복제 성능
- **비동기 처리**: 대용량 페이지 복제 시 비동기 처리 고려 (향후 구현)
- **진행 상태 표시**: 복제 진행률 실시간 표시 (향후 구현)
- **에러 복구**: 복제 실패 시 재시도 옵션 제공

### 비회원 복제 워크플로우
- **상태 유지**: 로그인 후 복제 워크플로우 재개를 위한 상태 저장 (URL 파라미터 또는 세션)
- **리다이렉션**: 로그인 성공 후 원래 복제 의도로 자동 리다이렉션

---

## 🚀 Next Steps

이제 Share Management Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환 (Share System → PublishedPage Aggregate, CopyWorkflow Aggregate)
2. **Bounded Context 식별**: Page Publishing Context와 Page Copy Context 경계 확인
3. **Integration Points**: Workspace Management Domain (Page Structure Context), Workspace Management Domain, Auth Domain System (User Management Domain)과의 연결점 정의
4. **Anti-Corruption Layer**: 외부 도메인과의 통합 레이어 설계

---

## 📝 Process Model 워크샵 정보 (참고용)

**일시**: 2026-01-01  
**참가자**: 
- **도메인 전문가**: [이름]
- **시니어 개발자**: [이름]
- **PM**: [이름]

**워크샵 결과물**:
- [x] 모든 핵심 사용자 여정이 시나리오로 정의됨
- [x] Event → Policy → Read Model → Command → System → Event 순서가 일관되게 적용됨
- [x] External System과의 통합점이 명확히 정의됨
- [x] 비즈니스 규칙(Policy)이 구체적으로 명시됨
- [x] Software Design 작성을 위한 충분한 정보 확보

---

*이 Process Model 문서는 Share Management Domain의 Software Design 작성을 위한 기반 자료입니다.*
