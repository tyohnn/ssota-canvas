# Process Model: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: 시니어개발자 + 주니어개발자 (Canvas Management 연동)  
**작성일**: 2025-10-19  
**버전**: v1.0

**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: `03-software-design.md` (Backend), Canvas Management Domain 연동

---

## 🎯 Process Modeling Overview

Block Management Domain의 핵심 프로세스를 실제 상호작용 순서에 따라 정의

이 도메인은 **Canvas Management Domain 구현을 위한 최소한의 Block 관리 기능**을 제공하며, 주요 시나리오는 다음과 같습니다:

1. **Block 존재 확인**: Canvas에서 블록 마운트 전 검증
2. **Block 타입 조회**: Canvas에서 블록 렌더링을 위한 타입 정보 제공  
3. **Block 복제**: Canvas에서 블록 복제 요청 처리
4. **Block 생성 및 관리**: 기본적인 블록 CRUD 기능

### 📝 작성 원칙 (하이브리드 접근법)

#### ✅ 항상 작성해야 할 내용 (비즈니스 프로세스)
- 비즈니스 정책 및 규절 (워크스페이스 격리, 블록 타입 검증)
- 권한 기반 필터링 로직 (RLS 정책)
- 시스템 처리 흐름 (블록 생성, 조회, 복제)
- 데이터 검증 규칙 (블록 타입, 메타데이터 스키마)
- 외부 시스템 통합 (Canvas Management 연동)

#### ✅ 선택적으로 작성 가능 (최소 UX 힌트)
- `*UI Hint:` 형태로 Frontend 팀을 위한 최소 힌트 제공
- 예시: `*UI Hint: 블록 선택 UI*`, `*UI Hint: 블록 타입 표시*`
- 원칙:
  - **최소성**: 꼭 필요한 힌트만
  - **추상성**: 구체적 컴포넌트 이름 금지
  - **선택성**: `*` 표시로 선택적 정보임을 명시

#### ❌ 작성 금지 (UI 과도 종속)
- 버튼 위치, 색상, 크기
- 애니메이션, 트랜지션 효과
- 구체적인 컴포넌트 이름 (Material-UI Select, shadcn/ui Dialog 등)
- 반응형 레이아웃 세부사항

> **참고**: 구체적인 UI/UX 설계는 Canvas Management Domain의 User Flow에서 진행합니다.

### 🔄 시퀀스 기반 상호작용 순서

각 시나리오는 여러 시퀀스로 구성되며, 이벤트에 의해 다음 시퀀스가 트리거됩니다:

**Event** → **Policy** → **Read Model** → **Command** → **System** → **Event** → **Policy** → ...

1. **Event** (이전 시퀀스의 결과) → 2. **Policy** (이벤트에 따른 정책 적용) → 3. **Read Model** (시스템에서 사용자에게 제공하는 정보) → 4. **Command** (사용자가 입력하는 정보) → 5. **System** (처리 시스템) → 6. **Event** (결과 이벤트)

### 🟪 External System: Canvas Management Domain

Block Management Domain은 Canvas Management Domain과 연동됩니다:
- **역할**: Canvas에서 블록 정보를 직접 DB JOIN을 통해 조회
- **SSOT**: Block Management가 Block 데이터의 Single Source of Truth
- **통합**: Canvas Management가 직접 DB 조회 (별도 서비스 레이어 불필요)

---

## 📍 Scenario 0: Block 생성 및 관리

### Sequence 1: 사용자가 새 블록을 생성

**Trigger Event**: 사용자가 블록 생성 요청

```
👤 사용자: "새로운 텍스트 블록을 만들어서 콘텐츠를 작성하고 싶어"
```

**Policy**:
- "Whenever 블록 생성 요청됨, then always 블록 타입 검증하기"
- "Whenever 블록 생성 완료됨, then always 기본 메타데이터 설정하기"
- "If 워크스페이스 내 제한 초과, then 생성 거부하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 블록 타입 선택 옵션 (text, image, page 등)
- 블록 생성 폼 필드
- 생성 권한 상태 표시
- 진행 상태 및 결과 메시지
- *UI Hint: 블록 타입 선택 UI, 생성 폼*

**Command**: 블록 생성 요청 (사용자가 입력하는 정보)
- 블록 타입 선택
- 블록 제목
- 워크스페이스 ID
- 초기 메타데이터 (선택적)

**System**: Block Manager (Backend - Security Enforcement)
- 비즈니스 로직: 블록 타입별 검증, 워크스페이스 제한 확인, 기본 메타데이터 설정
- 검증 로직: 블록 타입 유효성 검증, 워크스페이스 접근 권한 확인, 생성 제한 검증
- 처리 로직: 새 블록 생성, 메타데이터 초기화, 생성 시간 기록

**Events**:
1. 블록이 생성되었다 (Block Created)
2. 블록이 검증되었다 (Block Validated)
3. 블록 메타데이터가 설정되었다 (Block Metadata Set)

### Sequence 2: 블록 정보 업데이트

**Trigger Event**: 사용자가 블록 정보 수정 요청

```
👤 사용자: "블록의 제목이나 속성을 수정하고 싶어"
```

**Policy**:
- "Whenever 블록 업데이트 요청됨, then always 수정 권한 확인하기"
- "Whenever 메타데이터 변경됨, then always 스키마 검증하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 현재 블록 정보 표시
- 수정 가능한 필드 목록
- 수정 권한 상태
- 검증 오류 메시지 (있는 경우)
- *UI Hint: 블록 편집 폼*

**Command**: 블록 정보 업데이트 요청 (사용자가 입력하는 정보)
- 블록 ID
- 수정할 필드들 (제목, 메타데이터 등)
- 업데이트 확인

**System**: Block Manager (Backend - Security Enforcement)
- 비즈니스 로직: 수정 권한 검증, 메타데이터 스키마 검증, 변경 이력 기록
- 검증 로직: 사용자 권한 확인, 메타데이터 형식 검증, 충돌 방지
- 처리 로직: 블록 정보 업데이트, 수정 시간 갱신, 관련 데이터 동기화

**Events**:
1. 블록 정보가 업데이트되었다 (Block Updated)
2. 블록 메타데이터가 변경되었다 (Block Metadata Changed)

### Sequence 3: 블록 삭제 (소프트 삭제)

**Trigger Event**: 사용자가 블록 삭제 요청

```
👤 사용자: "더 이상 필요없는 블록을 삭제하고 싶어"
```

**Policy**:
- "Whenever 블록 삭제 요청됨, then always 삭제 권한 확인하기"
- "Whenever 블록 삭제 완료됨, then always 소프트 삭제로 처리하기 (deleted_at 설정)"
- "If Canvas에 마운트된 블록 삭제됨, then Canvas에서 자동 언마운트"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 현재 블록 정보 표시
- 삭제 권한 상태
- Canvas 마운트 상태 (마운트된 경우 경고)
- 삭제 확인 메시지
- *UI Hint: 삭제 확인 다이얼로그*

**Command**: 블록 삭제 요청 (사용자가 입력하는 정보)
- 블록 ID
- 삭제 확인

**System**: Block Manager (Backend - Security Enforcement)
- 비즈니스 로직: 삭제 권한 검증, 소프트 삭제 처리, Canvas 마운트 상태 확인
- 검증 로직: 사용자 권한 확인, 워크스페이스 소유권 검증
- 처리 로직: deleted_at 타임스탬프 설정, 삭제 시간 기록

**Events**:
1. 블록이 삭제되었다 (Block Deleted)
2. 블록 관련 데이터가 정리되었다 (Block Data Cleaned)

---

## 💡 핵심 Policy 정리

### Block 생성 및 관리 관련
1. **블록 타입 검증**: 지원되는 블록 타입만 생성 허용
2. **워크스페이스 격리**: RLS 정책으로 워크스페이스별 블록 접근 제어
3. **메타데이터 스키마**: 블록 타입별 메타데이터 검증 규칙 적용
4. **소프트 삭제**: 블록 삭제 시 deleted_at 타임스탬프 설정으로 보존

### Canvas Management Domain 연동 관련
5. **직접 DB 조회**: Canvas Management가 JOIN을 통해 블록 정보 직접 조회
6. **삭제 블록 필터링**: Canvas 조회 시 deleted_at IS NULL 조건 필수
7. **RLS 정책 공유**: Canvas와 Block 모두 동일한 워크스페이스 RLS 정책 적용

### 보안 및 권한 관련
8. **RLS 정책 적용**: 모든 블록 조회 시 워크스페이스 접근 권한 확인
9. **사용자 권한 검증**: 블록 생성/수정/삭제 시 워크스페이스 소유권 확인

---

## 🔧 기술 권장사항

### Canvas Management Domain 연동 최적화
- **직접 DB JOIN**: Canvas에서 blocks 테이블 직접 JOIN으로 블록 정보 조회
- **공통 RLS 정책**: Canvas와 Block 모두 동일한 워크스페이스 RLS 정책 적용
- **삭제 블록 필터링**: Canvas 조회 시 deleted_at IS NULL 조건 항상 포함

### Block 데이터 관리
- **UUID 기반 식별**: UUID로 고유성 보장 (슬러그 불필요)
- **메타데이터 스키마**: 블록 타입별 JSON Schema 검증
- **인덱스 최적화**: workspace_id, block_type, deleted_at 복합 인덱스
- **소프트 삭제**: deleted_at 타임스탬프로 데이터 보존

### 성능 최적화
- **RLS 정책 최적화**: 워크스페이스별 블록 조회 성능 튜닝
- **트랜잭션 관리**: 블록 생성/수정 시 원자성 보장
- **인덱스 활용**: Canvas JOIN 시 효율적인 인덱스 스캔

### 에러 처리 및 모니터링
- **일관된 에러 코드**: 블록 생성/수정/삭제 실패 시 표준 에러 코드
- **로깅 전략**: 블록 생성/수정/삭제 이벤트 로깅
- **메트릭 수집**: 블록 조회 성능 및 에러율 모니터링

---

## 🚀 Next Steps

이제 Block Management Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: Block Aggregate 및 Repository 설계
2. **DB Schema**: blocks 테이블 구조 및 RLS 정책 정의
3. **Canvas 연동**: Canvas Management가 직접 blocks 테이블 JOIN으로 조회

### Canvas Management Domain 연동을 위한 준비사항
1. **blocks 테이블**: UUID 기반 ID, block_type, metadata, deleted_at 필드
2. **RLS 정책**: 워크스페이스별 블록 접근 제어
3. **인덱스**: workspace_id, block_type, deleted_at 복합 인덱스

---

## 📝 Process Model 워크샵 정보 (참고용)

**일시**: 2025-10-19 (Canvas Management 연동 요구사항 분석)
**참가자**: 
- **시니어 개발자**: AI Assistant (도메인 설계 및 시스템 연동 분석)
- **주니어 개발자**: AI Assistant (Canvas Management 요구사항 분석)

**워크샵 결과물**:
- [x] Canvas Management 연동을 위한 핵심 시나리오 정의 완료
- [x] Event → Policy → Read Model → Command → System → Event 순서 일관 적용
- [x] BlockDomainService 인터페이스 요구사항 시퀀스별 정의 완료
- [x] 핵심 Policy 및 기술 권장사항 정리 완료

---

*이 Process Model 문서는 Block Management Domain의 최소 구현을 위한 기반 자료이며, Canvas Management Domain 구현을 지원합니다.*
