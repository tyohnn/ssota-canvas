# Story CM-009: 캔버스 뷰포트 관리

## 🎯 Story 개요
**User Story**: As a 디자이너, I want to 캔버스를 줌하고 패닝하며 블럭에 포커스할 수 있어야 so that 큰 캔버스에서도 원하는 영역에 집중하여 정밀한 작업을 수행할 수 있다

**Story Points**: 8pts  
**우선순위**: Medium  
**Epic**: Epic-002 (Canvas Management Foundation)  
**Domain**: Canvas Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 캔버스 줌 및 패닝
```gherkin
Given 사용자가 캔버스 뷰포트에 있다
When 마우스 휠을 사용하여 줌 인/아웃한다
Then 캔버스가 부드럽게 확대/축소된다
And 줌 레벨이 최소/최대 범위 내에서 제한된다
And 현재 줌 레벨이 표시된다
```

### 시나리오 2: 블럭 포커스
```gherkin
Given 캔버스에 여러 블럭이 있다
When 사용자가 특정 블럭을 선택한다
And "포커스" 버튼을 클릭한다
Then 뷰포트가 해당 블럭을 중심으로 이동한다
And 블럭이 화면 중앙에 위치하게 된다
```

### 시나리오 3: 뷰포트 상태 자동 저장
```gherkin
Given 사용자가 작업 중인 캔버스 뷰포트가 있다
When 사용자가 페이지를 떠난다
Then 현재 뷰포트 상태(줌, 중심점)가 저장된다
When 사용자가 다시 페이지에 들어온다
Then 이전 뷰포트 상태가 자동으로 복원된다
```

### 시나리오 4: 뷰포트 컨트롤
```gherkin
Given 사용자가 캔버스를 사용 중이다
When 우측 하단의 뷰포트 컨트롤을 사용한다
Then 줌 인/아웃 버튼으로 정확한 조절이 가능하다
And "전체 보기" 버튼으로 모든 블럭이 보이는 영역으로 이동한다
```

---

## 📋 개발 Task (도메인별)

### Canvas Management Domain
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [ ] ViewportAggregate 구현 (뷰포트 상태 관리)
- [ ] Viewport Entity 구현
- [ ] ZoomLevel, ViewportCenter Value Objects 구현
- [ ] Commands 정의 (UpdateViewportCommand, FocusOnBlockCommand, SaveViewportStateCommand)
- [ ] Events 정의 (ViewportUpdatedEvent, ViewportFocusedEvent, ViewportStateSavedEvent)
- [ ] ViewportRepository 구현

#### Database
- [ ] viewports 테이블 활용 (사용자별 뷰포트 설정)
- [ ] RLS 정책 적용 (user_id 기반 접근 제어)

#### Server Actions
- [ ] updateViewportAction (뷰포트 상태 업데이트)
- [ ] focusOnBlockAction (블럭 포커스)
- [ ] saveViewportStateAction (상태 저장)
- [ ] restoreViewportStateAction (상태 복원)

#### Frontend
- [ ] ViewportControls 컴포넌트 (줌/패닝 컨트롤)
- [ ] React Flow 뷰포트 이벤트 처리
- [ ] 로컬 스토리지 기반 뷰포트 영속성
- [ ] useCanvasManagement Hook에서 뷰포트 관리

---

### Testing & Quality
- [ ] Unit Tests (ViewportAggregate 상태 관리)
- [ ] Integration Tests (뷰포트 상태 저장/복원)
- [ ] E2E Tests (뷰포트 조작 플로우)

## 🎯 Definition of Done

### 기능 완료
- [ ] 마우스 휠을 이용한 줌 인/아웃
- [ ] 드래그를 이용한 캔버스 패닝
- [ ] 블럭 포커스 기능
- [ ] 뷰포트 상태 자동 저장/복원
- [ ] 뷰포트 컨트롤 (버튼 기반 조작)

### 기술 완료
- [ ] 단위 테스트 커버리지 85% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 뷰포트 조작 성능 최적화 (부드러운 애니메이션)
- [ ] 사용자별 뷰포트 설정 독립성
- [ ] 접근성 기준 충족 (키보드 조작)

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: CM-001 (Canvas 초기화)
- **후행 Story**: 통합 테스트 및 최적화
- **도메인 의존성**: React Flow 뷰포트 API 및 로컬 스토리지

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Process Model](../../../event-domain-design/domains/canvas-management-domain/02-process-model.md) - Scenario 9 (캔버스 뷰포트 관리)
- [Software Design](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md) - Viewport Aggregate
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md) - viewports 테이블
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md) - ViewportControls 컴포넌트

### Agile Planning
- [Epic 문서](../../epics/epic-002-canvas-management.md)
