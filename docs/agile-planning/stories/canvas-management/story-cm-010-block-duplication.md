# Story CM-010: 블럭 복제

## 🎯 Story 개요
**User Story**: As a 디자이너, I want to 기존 블럭을 복사하여 새로운 블럭을 빠르게 생성할 수 있어야 so that 유사한 요소들을 효율적으로 만들고 작업 시간을 단축할 수 있다

**Story Points**: 8pts  
**우선순위**: Low  
**Epic**: Epic-002 (Canvas Management Foundation)  
**Domain**: Canvas Management Domain, Block Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 블럭 복제 요청
```gherkin
Given 사용자가 블럭을 선택한 상태이다
When "복제" 버튼을 클릭하거나 Ctrl+D를 누른다
Then Block Domain에서 새로운 블럭이 생성된다
And 원본 블럭과 같은 타입과 속성을 가진다
```

### 시나리오 2: 복제된 블럭 마운트
```gherkin
Given 블럭 복제 요청이 처리되었다
When 복제된 블럭이 생성된다
Then 복제된 블럭이 원본 근처에 새로운 위치로 마운트된다
And 복제된 블럭이 자동으로 선택된 상태가 된다
```

### 시나리오 3: 복제된 블럭 편집
```gherkin
Given 복제된 블럭이 생성되었다
When 사용자가 복제된 블럭을 편집한다
Then 원본 블럭과는 독립적으로 수정할 수 있다
And 복제된 블럭만 영향받는다
```

---

## 📋 개발 Task (도메인별)

### Canvas Management Domain
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [x] BlockMountAggregate duplicateBlock 로직 구현
- [x] Commands 정의 (DuplicateBlockCommand)
- [x] Events 정의 (BlockDuplicatedEvent)
- [x] 복제 위치 계산 로직 (블럭 너비 + 50px 오프셋)

#### Server Actions
- [x] duplicateBlockAction (블럭 복제 요청)
- [x] 복제 후 마운트 처리

#### Frontend
- [x] BlockMountToolbar에 복제 버튼 추가
- [x] MultiSelectionToolbar에 복제 버튼 추가
- [x] Ctrl+D 키보드 단축키 처리
- [x] 복제 진행 상태 표시 (Optimistic UI)

---

### Block Domain (통합)
**참조 문서**: Process Model Scenario 3 참조

#### Backend Implementation
- [x] 블럭 복제 API 연동 (BlockManagementService.duplicateBlock)
- [x] 복제된 블럭 기본값 설정 (원본과 동일한 타입/메타데이터)

---

### 도메인 간 통합
- [x] Canvas Management → Block Domain 블럭 복제 요청
- [x] 복제된 블럭 정보를 Canvas Management에서 마운트 처리

---

### Testing & Quality
- [x] Unit Tests (블럭 복제 로직) - BlockMountAggregate.duplicateBlock 테스트
- [x] Integration Tests (Block Domain 연동) - CanvasManagementService.duplicateBlock
- [ ] E2E Tests (복제 플로우) - 추후 구현

## 🎯 Definition of Done

### 기능 완료
- [x] 블럭 복제 기능 (Ctrl+D 또는 UI 버튼)
- [x] 복제된 블럭 자동 마운트
- [x] 복제 위치 자동 계산 (블럭 너비 + 50px 오프셋)
- [x] 복제된 블럭 독립적 편집 가능

### 기술 완료
- [x] 단위 테스트 커버리지 80% 이상 (BlockMountAggregate 테스트)
- [x] Integration Tests 통과 (CanvasManagementService)
- [ ] E2E Tests 통과 (추후 구현)
- [x] 코드 리뷰 완료

### 품질 완료
- [x] 복제 성능 최적화 (Optimistic UI)
- [x] 사용자 피드백 (복제 진행 상태)
- [x] 에러 처리 (복제 실패 시)

## 📊 진행 상황
**현재**: ✅ 100% 완료 (구현 완료, 테스트 통과)

**구현 완료 사항**:
- ✅ **Backend**: BlockMountAggregate.duplicateBlock 로직 구현
- ✅ **Backend**: BlockManagementService.duplicateBlock 연동
- ✅ **Backend**: DuplicateBlockCommand, BlockDuplicatedEvent 정의
- ✅ **Frontend**: BlockMountToolbar, MultiSelectionToolbar 복제 버튼
- ✅ **Frontend**: Ctrl+D 키보드 단축키 (React Flow 통합)
- ✅ **Frontend**: useCanvasBlockLifecycle.duplicateBlock Hook
- ✅ **Frontend**: Optimistic UI 및 에러 처리
- ✅ **Testing**: Unit Tests (BlockMountAggregate.duplicateBlock)
- ✅ **Testing**: Integration Tests (CanvasManagementService.duplicateBlock)

## 🔗 의존성
- **선행 Story**: CM-002 (블럭 생성 및 마운팅), CM-004 (블럭 선택)
- **후행 Story**: 통합 테스트 및 최적화
- **도메인 의존성**: Block Domain과의 블럭 복제 API 연동

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Process Model](../../../event-domain-design/domains/canvas-management-domain/02-process-model.md) - Scenario 3 (블럭 복제)
- [Software Design](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md) - BlockMount Aggregate
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md) - 구현 가이드

### Agile Planning
- [Epic 문서](../../epics/epic-002-canvas-management.md)
