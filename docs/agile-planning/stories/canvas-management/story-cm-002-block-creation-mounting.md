# Story CM-002: 블럭 생성 및 마운팅

## 🎯 Story 개요
**User Story**: As a 디자이너, I want to 도구바에서 블럭 타입을 선택하고 캔버스에 배치할 수 있어야 so that 원하는 시각적 요소를 빠르게 추가할 수 있다

**Story Points**: 13pts  
**우선순위**: High  
**Epic**: Epic-002 (Canvas Management Foundation)  
**Domain**: Canvas Management Domain, Block Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 블럭 타입 선택 및 생성
```gherkin
Given 사용자가 캔버스 페이지에 있다
When 블럭 생성 버튼을 클릭한다
Then 블럭 타입 선택 다이얼로그가 표시된다
And 사용 가능한 블럭 타입들이 카테고리별로 정리되어 표시된다
When 특정 블럭 타입을 선택한다
Then 해당 타입의 블럭이 생성 준비 상태가 된다
```

### 시나리오 2: 블럭 캔버스 배치
```gherkin
Given 사용자가 블럭 타입을 선택했다
When 캔버스의 원하는 위치를 클릭한다
Then 선택한 블럭이 해당 위치에 생성된다
And 블럭이 가장 위 레이어(z-order 최상위)에 배치된다
And 블럭이 자동으로 선택 상태가 된다
```

### 시나리오 3: Block Domain 연동
```gherkin
Given 사용자가 블럭 생성 요청을 한다
When 시스템이 블럭 생성을 처리한다
Then Block Domain에서 블럭 타입 검증이 수행된다
And 블럭 기본값 설정이 적용된다
And 생성된 블럭이 페이지에 마운트된다
```

---

## 📋 개발 Task (도메인별)

### Canvas Management Domain
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [ ] BlockMountAggregate 구현 (마운트 로직)
- [ ] BlockMount Entity 구현
- [ ] Position, Size, ZOrder Value Objects 구현
- [ ] Commands 정의 (MountBlockCommand, TransformBlockCommand)
- [ ] Events 정의 (BlockMountedEvent, BlockTransformedEvent)
- [ ] BlockMountRepository 구현

#### Database
- [ ] block_mounts 테이블 생성 (Drizzle migration)
- [ ] RLS 정책 적용 (페이지 접근 권한 기반)

#### Server Actions
- [ ] mountBlockAction (블럭 마운트)
- [ ] getAvailableBlockTypesAction (블럭 타입 목록 조회)

#### Frontend
- [ ] BlockToolbar 컴포넌트 (블럭 생성 도구바)
- [ ] BlockAddDialog 컴포넌트 (블럭 타입 선택)
- [ ] 블럭 마운트 및 React Flow 노드 생성 로직
- [ ] useCanvasManagement Hook에서 mountBlock 메서드

---

### Block Domain (통합)
**참조 문서**: Process Model Scenario 1 참조

#### Backend Implementation
- [ ] 블럭 타입 검증 및 기본값 설정 API
- [ ] 블럭 생성 서비스 연동

---

### 도메인 간 통합
- [ ] Canvas Management → Block Domain 블럭 생성 요청
- [ ] Block Domain → Canvas Management 블럭 생성 결과 처리
- [ ] 블럭 타입별 기본 크기 및 속성 매핑

---

### Testing & Quality
- [ ] Unit Tests (BlockMountAggregate 마운트 로직)
- [ ] Integration Tests (Block Domain 연동)
- [ ] E2E Tests (전체 블럭 생성 플로우)

## 🎯 Definition of Done

### 기능 완료
- [ ] 블럭 타입 선택 다이얼로그 정상 동작
- [ ] 캔버스 클릭으로 블럭 생성 및 배치
- [ ] 생성된 블럭이 최상위 레이어에 정확히 배치
- [ ] Block Domain과의 연동 정상 동작

### 기술 완료
- [ ] 단위 테스트 커버리지 85% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 권한 검증 로직 완료 (페이지 접근 권한)
- [ ] 블럭 타입 검증 완료
- [ ] 에러 처리 및 사용자 피드백 완료

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: CM-001 (Canvas 초기화)
- **후행 Story**: CM-003 (블럭 변환), CM-004 (블럭 선택)
- **도메인 의존성**: Block Domain과의 블럭 생성 API 연동 필요

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Process Model](../../../event-domain-design/domains/canvas-management-domain/02-process-model.md) - Scenario 1 (블럭 생성 및 마운팅)
- [Software Design](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md) - BlockMount Aggregate
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md) - block_mounts 테이블
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md) - BlockToolbar, BlockAddDialog

### Agile Planning
- [Epic 문서](../../epics/epic-002-canvas-management.md)
