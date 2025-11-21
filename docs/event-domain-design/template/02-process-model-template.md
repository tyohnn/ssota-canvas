# Process Model: [Domain Name] Domain

## 🎯 개요

**도메인**: [Domain Name]  
**작성자**: 도메인전문가 + 시니어개발자  
**작성일**: YYYY-MM-DD  
**버전**: v1.0

**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: `03-software-design.md` (Backend), `03-user-flow.md` (Frontend)

---

## 🎯 Process Modeling Overview
[Domain Name] Domain의 핵심 프로세스를 실제 상호작용 순서에 따라 정의

### 📝 작성 원칙 (하이브리드 접근법)

#### ✅ 항상 작성해야 할 내용 (비즈니스 프로세스)
- 비즈니스 정책 및 규칙
- 권한 기반 필터링 로직
- 시스템 처리 흐름
- 데이터 검증 규칙
- 외부 시스템 통합

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

### 🟪 External System: [External System Name]
[Domain Name]은 [External System Name]을 [용도/역할] 시스템으로 사용합니다:
- **역할**: [External System의 구체적 역할과 책임]
- **SSOT**: [External System Name]이 [Entity/Data]의 Single Source of Truth
- **통합**: [External System Name] ↔ 우리 DB 간 [통합 방식] 필요

---

## 📍 Scenario 0: [External System] 동기화

### Sequence 1: [External System]에서 [Entity] 생성/변경 시 자동 동기화

**Trigger Event**: [External System] Webhook 수신

```
🔗 [External System] Webhook: "[Entity]가 생성/변경되었어"
```

**Policy**: 
- "Whenever [External System] Webhook 수신됨, then always [Entity] 동기화 처리하기"
- "Whenever 동기화 실패됨, then immediately 재시도 스케줄링하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
> ✅ 작성 기준: 사용자에게 보여줄 **데이터와 선택지**, UI 구현은 제외
> - 권한 기반 필터링 규칙 명시
> - 조건부 표시 규칙 (예: "Owner인 경우만 보임")
> - **선택사항**: `*UI Hint:` 형태로 최소 UX 가이드 추가 가능
> - **구체적인 UI 요소는 User Flow에서 정의**

- 동기화 상태 표시
- 동기화 진행률 표시
- 동기화 결과 메시지
- 동기화 오류 알림
- *UI Hint: 상태 표시 영역* (선택사항)

**Command**: [Entity] 동기화 요청 (사용자가 입력하는 정보)
- [External System]에서 받은 [Entity] 데이터
- 동기화 시점 정보
- 동기화 유형 정보
- 동기화 확인

**System**: [External System] Webhook Handler → Database (Backend - Security Enforcement)
> ✅ 작성 기준: **Backend 시스템 처리 로직**
> - 비즈니스 규칙 집행 (권한, 데이터 검증)
> - 데이터 저장 및 트랜잭션 처리
> - External System 통합 (ACL 설계의 기반)
> - **Frontend 렌더링 로직은 제외**

- 비즈니스 로직: 동기화 규칙 검증, 데이터 무결성 확인, 충돌 해결
- 검증 로직: Webhook 서명 검증, 데이터 형식 검증, 중복 처리 방지
- 처리 로직: 데이터 변환, 트랜잭션 처리, 오류 복구

**Events**:
1. [External System] [Entity] 정보가 동기화되었다 ([Entity] Synced from [External System])
2. [Entity] [Related Data] 목록이 갱신되었다 ([Entity] [Related Data] Updated)
3. 동기화가 실패했다 ([Entity] Sync Failed)
4. 재시도가 예약되었다 (Sync Retry Scheduled)

### Sequence 2: [다음 시퀀스명] (선택사항)

**Trigger Event**: [이전 시퀀스의 특정 이벤트]

**Policy**: 
- "Whenever [이전 시퀀스의 특정 이벤트], then always [다음 액션]"
- "If [조건], then [조건부 반응]"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- [시스템이 보여주는 정보]
- [사용자 선택 옵션]

**Command**: [명령명] (사용자가 입력하는 정보)
- [사용자 입력 정보]
- [사용자 선택]

**System**: [처리 시스템] (웹) - Frontend
> ✅ 작성 기준: **Frontend가 필요한 경우만 명시**
> - 단순 정보 전달: "선택된 옵션 정보 저장 (다음 단계로 전달)"
> - Read Model 계산이 Frontend에서 일어나는 경우만
> - **상세한 UI 로직은 User Flow로 이관**

- 비즈니스 로직: [필요한 경우만 최소한의 클라이언트 규칙]
- 처리 로직: [선택된 정보 저장, 다음 단계로 전달]

**Events**:
1. [결과 이벤트 1]
2. [결과 이벤트 2]

---

## 📍 Scenario 1: [Core Entity] 생성 및 관리

### Sequence 1: 사용자가 새로운 [Core Entity]를 생성

**Trigger Event**: 사용자 생성 요청

```
👤 사용자: "[Core Entity] 생성 관련 구체적 요구사항"
```

**Policy**: 
- "Whenever [Core Entity] 생성 요청됨, then always 권한 검증하기"
- "If 템플릿 선택됨, then 템플릿 구조 복사하기"
- "Whenever [Core Entity] 생성 완료됨, then always 기본 설정 적용하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
> ✅ 작성 기준: 보여줄 **데이터와 선택지**, UI 구현은 제외
> - **선택사항**: `*UI Hint:` 형태로 최소 UX 가이드 추가 가능

- [Core Entity] 생성에 필요한 입력 필드
- 템플릿 선택 옵션 목록 (있는 경우)
- 생성 진행 상태
- 생성 결과 메시지
- *UI Hint: 생성 폼 또는 모달* (선택사항)

**Command**: [Core Entity] 생성 요청 (사용자가 입력하는 정보)
- [Core Entity] 제목/이름
- [Core Entity] 설명
- 템플릿 선택 (있는 경우)
- 생성 확인

**System**: [Core Entity] Manager (Backend - Security Enforcement)
> ✅ 작성 기준: Backend 시스템 처리 로직

- 비즈니스 로직: 권한 검증, 템플릿 복사 규칙, 기본 설정 적용
- 검증 로직: 사용자 권한 확인, 플랜 제한 검증, 중복 생성 방지
- 처리 로직: [Core Entity] 생성, 템플릿 적용, 기본 데이터 초기화

**Events**:
1. [Core Entity]가 생성되었다 ([Core Entity] Created)
2. 기본 [Default Content]가 생성되었다 ([Default Content] Created)
3. 생성자가 [Owner Role] 권한으로 설정되었다 (Creator Set as [Owner Role])
4. 템플릿 [Related Entities]가 복사되었다 (Template [Related Entities] Copied) *템플릿 사용 시*

### Sequence 2: [Core Entity] 생성 후 후속 처리 (선택사항)

**Trigger Event**: [Core Entity]가 생성되었다

**Policy**: 신규 [Core Entity] 후속 처리 규칙
- "신규 [Core Entity] 생성 시 튜토리얼 진행 옵션 제공"
- "기존 사용자인 경우 바로 메인 화면으로 이동"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
> ✅ 작성 기준: 보여줄 **데이터와 선택지**, UI 구현은 제외
> - **선택사항**: `*UI Hint:` 형태로 최소 UX 가이드 추가 가능

- 튜토리얼 시작 옵션
- 튜토리얼 건너뛰기 옵션
- [Core Entity] 관리 가이드 정보
- *UI Hint: 온보딩 화면 또는 다이얼로그* (선택사항)

**Command**: 튜토리얼 처리 (사용자가 입력하는 정보)
- 튜토리얼 시작 선택
- 튜토리얼 건너뛰기 선택
- *UI Hint: 버튼 선택* (선택사항)

**System**: (웹) - Frontend

**Events**:
1. 튜토리얼이 시작됨
2. 튜토리얼을 건너뛰었음

---

## 📍 Scenario 2: [Child Entity] 생성 및 중첩

### Sequence 1: 사용자가 [Parent Entity] 내에 새 [Child Entity]를 생성

**Trigger Event**: [Child Entity] 생성 요청

```
👤 사용자: "[Child Entity] 생성 관련 구체적 요구사항"
```

**Policy**: [Child Entity] 계층 구조 규칙
- "[Parent Entity]의 [Role1], [Role2]만 [Child Entity] 생성 가능"
- "중첩 깊이는 무제한이지만 성능상 [N]레벨 권장"
- "[Folder Concept] = [Child Entity]이므로 모든 [Child Entity]는 [Content]을 포함할 수 있음"
- "같은 부모 하위에서 제목 중복 허용"
- "순서는 생성 시점 기준 마지막 위치"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- [Child Entity] 생성 폼
- [Parent Entity] 접근 권한 표시
- 부모 [Child Entity]의 중첩 깊이 표시
- 같은 레벨의 기존 [Child Entity] 목록
- [Child Entity] 순서 정보

**Command**: [Child Entity] 생성 요청 (사용자가 입력하는 정보)
- [field1]: "[Example Title]"
- [parentChildId]?: parent[Child] (폴더 역할)
- position: insertIndex
- 생성 확인

**System**: [Child Entity] Manager

**Events**:
1. [Child Entity]가 생성되었다 ([Child Entity] Created)
2. [Child Entity] 계층구조가 업데이트되었다 ([Child Entity] Hierarchy Updated)
3. [Child Entity] 순서가 설정되었다 ([Child Entity] Order Set)
4. 빈 [Default Content]가 초기화되었다 (Empty [Default Content] Initialized)

---

## 📍 Scenario 3: [Child Entity] 이동 (핵심 프로세스)

### Sequence 1: 사용자가 [Child Entity]를 다른 [Parent Entity]로 이동

**Trigger Event**: [Child Entity] 이동 요청

```
👤 사용자: "[Child Entity] 이동 관련 구체적 요구사항"
```

**Policy**: [Child Entity] 이동 시 권한 및 구조 관리 (핵심)
- "양쪽 [Parent Entity] 모두 [Required Role] 권한 필요"
- "이동 시 하위 [Child Entity]들도 함께 이동"
- "순환 참조 방지: 자기 자신을 부모로 설정 불가"
- "[Child Entity] 내 [Related Content]는 [Related Domain]에서 처리"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- [Child Entity] 이동 폼
- 원본 [Parent Entity] 권한 표시 ([Required Role] 이상)
- 대상 [Parent Entity] 권한 표시 ([Required Role] 이상)
- [Child Entity]의 모든 하위 [Child Entity] 목록
- [Child Entity] 내 [Related Content] 존재 여부 표시

**Command**: [Child Entity] 이동 요청 (사용자가 입력하는 정보)
- [childEntityId]: target[Child]
- [targetParentEntityId]: destination[Parent]
- [newParentChildId]?: newParent
- 이동 확인

**System**: [Child Entity] Migration Manager

**Events**:
1. [Child Entity] 이동이 시작되었다 ([Child Entity] Migration Started)
2. [Child Entity]가 원본 [Parent Entity]에서 제거되었다 ([Child Entity] Removed from Source)
3. [Child Entity]가 대상 [Parent Entity]에 추가되었다 ([Child Entity] Added to Target)
4. [Child Entity] 이동이 완료되었다 ([Child Entity] Migration Completed)

---

## 📍 Scenario 4: [Child Entity] 중첩 및 순서 변경

### Sequence 1: 사용자가 [Child Entity] 구조를 재정리

**Trigger Event**: [Child Entity] 구조 변경 요청

```
👤 사용자: "[Child Entity] 구조 재정리 관련 구체적 요구사항"
```

**Policy**: 구조 변경 제약사항
- "순환 참조 방지: 하위 [Child Entity]를 상위로 이동 불가"
- "폴더([Child Entity])를 자기 자신의 하위로 이동 불가"
- "깊이 제한: [N]레벨 초과 시 경고"
- "위치 조정 시 다른 [Child Entity]들의 순서 자동 재정렬"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- [Child Entity] 구조 변경 폼
- 현재 [Child Entity] 계층구조 표시
- 이동 대상 위치의 기존 [Child Entity] 목록
- [Child Entity]의 모든 하위 [Child Entity] 목록

**Command**: [Child Entity] 구조 변경 요청 (사용자가 입력하는 정보)
- [childEntityId]: target[Child]
- newParentId?: newParent
- newPosition: targetIndex
- 구조 변경 확인

**System**: [Child Entity] Hierarchy Manager

**Events**:
1. [Child Entity] 부모가 변경되었다 ([Child Entity] Parent Changed)
2. [Child Entity] 순서가 변경되었다 ([Child Entity] Order Changed)
3. 계층구조가 재정렬되었다 (Hierarchy Restructured)
4. 순환 참조가 방지되었다 (Circular Reference Prevented)

---

## 📍 Scenario 5: [Child Entity] 삭제 및 복구

### Sequence 1: 사용자가 [Child Entity]를 삭제

**Trigger Event**: [Child Entity] 삭제 요청

```
👤 사용자: "[Child Entity] 삭제 관련 요구사항"
```

**Policy**: 계층적 삭제 규칙
- "[Role1], [Role2]만 삭제 가능"
- "하위 [Child Entity]가 있는 경우 함께 삭제 (재귀적)"
- "소프트 삭제: deleted_at 설정, 실제 데이터 보존"
- "[N]일 후 완전 삭제 (배치 작업)"
- "[Child Entity] 내 [Related Content]는 [Related Domain]에서 처리"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- [Child Entity] 삭제 폼
- [Child Entity]의 하위 [Child Entity] 목록 표시
- [Child Entity] 내 [Related Content] 존재 여부 표시
- 삭제 권한 확인 표시

**Command**: [Child Entity] 삭제 요청 (사용자가 입력하는 정보)
- [childEntityId]: target[Child]
- deleteType: "soft" | "permanent"
- 삭제 확인

**System**: [Child Entity] Deletion Manager

**Events**:
1. [Child Entity]가 [Soft Delete Container]로 이동되었다 ([Child Entity] Moved to [Soft Delete Container])
2. 하위 [Child Entity]들이 함께 삭제되었다 (Child [Child Entity] Deleted)
3. 삭제 일정이 예약되었다 (Deletion Scheduled)

### Sequence 2: [Child Entity] 복구

**Trigger Event**: [Child Entity] 복구 요청

**Policy**: 복구 규칙
- "소프트 삭제된 [Child Entity]만 복구 가능"
- "복구 시 하위 [Child Entity]들도 함께 복구"
- "복구 후 원래 위치로 복원"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 삭제된 [Child Entity] 목록
- 복구 가능한 [Child Entity] 표시
- 복구 확인 메시지

**Command**: [Child Entity] 복구 요청 (사용자가 입력하는 정보)
- [childEntityId]: deleted[Child]
- 복구 확인

**System**: [Child Entity] Restoration Manager

**Events**:
1. [Child Entity]가 [Soft Delete Container]에서 복구되었다 ([Child Entity] Restored from [Soft Delete Container])
2. 하위 [Child Entity]들이 함께 복구되었다 (Child [Child Entity] Restored)

---

## 📍 Scenario 6: [Parent Entity] 삭제 (Danger Zone)

### Sequence 1: [Parent Entity] Owner가 [Parent Entity]를 완전 삭제

**Trigger Event**: [Parent Entity] 삭제 요청

```
👤 Owner: "[Parent Entity] 완전 삭제 관련 요구사항"
```

**Policy**: [Parent Entity] 삭제 규칙 (Danger Zone)
- "Owner만 삭제 가능"
- "정확한 [parent entity] 이름 입력 필수"
- "모든 하위 [Child Entity]와 [Related Content] 함께 삭제"
- "소프트 삭제 후 [N]일 보관"
- "멤버들에게 삭제 알림 발송"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- [Parent Entity] 삭제 폼
- [Parent Entity]의 모든 [Child Entity] 목록
- [Parent Entity] 멤버 목록
- 관련된 [Related Content] 총량 표시
- 삭제 권한 확인 표시 (Owner만)

**Command**: [Parent Entity] 삭제 요청 (사용자가 입력하는 정보)
- [parentEntityId]: target[Parent]
- confirmationText: [parentEntityName]
- 삭제 최종 확인

**System**: [Parent Entity] Deletion Manager

**Events**:
1. [Parent Entity] 삭제가 요청되었다 ([Parent Entity] Deletion Requested)
2. 삭제 확인이 완료되었다 (Deletion Confirmed)
3. 모든 [Child Entity]가 삭제되었다 (All [Child Entity] Deleted)
4. 멤버들이 제거되었다 (Members Removed)
5. [Parent Entity]가 완전히 삭제되었다 ([Parent Entity] Permanently Deleted)

---

## 📍 Scenario 7: [Top Level Entity] 삭제 경고

### Sequence 1: [External System]에서 [Top Level Entity]이 삭제됨

**Trigger Event**: [External System] Webhook 수신

```
🔗 [External System] Webhook: "[Top Level Entity]이 삭제되었어"
```

**Policy**: [Top Level Entity] 삭제 시 보존 규칙
- "[Top Level Entity] 삭제 시 [Parent Entity]는 보존"
- "orphaned 상태로 전환하고 경고 표시"
- "Owner에게 [Top Level Entity] 재생성 또는 데이터 이전 안내"
- "[N]일 후 데이터 완전 삭제 경고"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- [Top Level Entity] 삭제 경고 메시지
- [Top Level Entity]의 모든 [Parent Entity] 목록
- [Top Level Entity] 멤버 목록
- 삭제된 [Top Level Entity] 정보

**Command**: [Top Level Entity] 삭제 처리 요청 (사용자가 입력하는 정보)
- [externalTopLevelEntityId]: deleted[TopLevelEntity]Id
- 삭제 처리 확인

**System**: [Top Level Entity] Cleanup Manager

**Events**:
1. [External System] [Top Level Entity]이 삭제되었다 ([External System] [Top Level Entity] Deleted)
2. [Top Level Entity] 삭제 경고가 표시되었다 ([Top Level Entity] Deletion Warning Shown)
3. [Parent Entity]들이 orphaned 상태로 전환되었다 ([Parent Entity] Orphaned)
4. 데이터 이전 안내가 발송되었다 (Migration Guide Sent)

---

## 💡 핵심 Policy 정리

### [External System] 동기화 관련
1. **실시간 동기화**: Webhook을 통한 즉시 동기화
2. **장애 복구**: [N]회 재시도 + exponential backoff
3. **데이터 보존**: [Top Level Entity] 삭제 시에도 [N]일 유예

### [Child Entity] 계층 구조 관련
4. **무제한 중첩**: 성능상 [N]레벨 권장
5. **폴더 = [Child Entity]**: 모든 [Child Entity]는 [Content] 포함 가능
6. **순환 참조 방지**: 엄격한 계층 구조 유지

### [Child Entity] 이동 관련 (핵심)
7. **권한 검증**: 양쪽 [Parent Entity] 모두 [Required Role] 권한 필요
8. **[Related Content] 처리**: [Related Domain]에서 [Related Content] 이동 처리
9. **하위 [Child Entity] 일괄 이동**: 계층 구조 유지

### 삭제 및 복구
10. **소프트 삭제**: [N]일 유예 기간 제공
11. **계층적 삭제**: 하위 요소 함께 처리
12. **Danger Zone**: 중요한 삭제는 확인 절차 강화

---

## 🔧 기술 권장사항

### [External System] Webhook 처리
- **Queue System**: 대량 동기화 시 Queue 활용
- **Idempotency**: 중복 요청 방지를 위한 idempotency key
- **Monitoring**: 동기화 실패율 모니터링

### [Child Entity] 이동 최적화
- **Batch Processing**: 대량 링크 업데이트 시 배치 처리
- **Background Jobs**: 무거운 이동 작업은 백그라운드 처리
- **Progress Tracking**: 진행률 실시간 표시

### 성능 최적화
- **Lazy Loading**: 깊은 계층 구조는 점진적 로딩
- **Caching**: 자주 접근하는 계층 구조 캐싱
- **Indexing**: 계층 쿼리 최적화를 위한 적절한 인덱스

---

## 🚀 Next Steps

이제 [Domain Name] Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환 ([External System]은 External System으로 유지)
2. **Bounded Context 식별**: [Core Entity], [Child Entity], [Top Level Entity] 경계 확인
3. **Integration Points**: 다른 도메인과의 연결점 정의
4. **Anti-Corruption Layer**: [External System] ↔ DB 변환 레이어 설계

---

## 📝 Process Model 워크샵 정보 (참고용)

**일시**: [워크샵 진행 날짜 및 시간]
**참가자**: 
- **도메인 전문가**: [이름]
- **시니어 개발자**: [이름]
- **PM**: [이름]
- **기타**: [추가 참가자]

**워크샵 결과물**:
- [ ] 모든 핵심 사용자 여정이 시나리오로 정의됨
- [ ] Event → Policy → Read Model → Command → System → Event 순서가 일관되게 적용됨
- [ ] External System과의 통합점이 명확히 정의됨
- [ ] 비즈니스 규칙(Policy)이 구체적으로 명시됨
- [ ] Software Design 작성을 위한 충분한 정보 확보

---

*이 Process Model 문서는 [Domain Name] Domain의 Software Design 작성을 위한 기반 자료입니다.*
