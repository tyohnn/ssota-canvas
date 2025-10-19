# Story CM-007: 엣지 생성 및 관리

## 🎯 Story 개요
**User Story**: As a 디자이너, I want to 블럭 간의 연결선을 생성하고 편집할 수 있어야 so that 블럭들 간의 관계와 데이터 흐름을 시각적으로 표현할 수 있다

**Story Points**: 13pts  
**우선순위**: Medium  
**Epic**: Epic-002 (Canvas Management Foundation)  
**Domain**: Canvas Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 엣지 생성
```gherkin
Given 캔버스에 두 개 이상의 블럭이 있다
When 사용자가 블럭 A의 핸들을 드래그하여 블럭 B의 핸들에 드롭한다
Then 블럭 A와 B 사이에 엣지가 생성된다
And 생성된 엣지가 React Flow에서 렌더링된다
And 엣지 정보가 데이터베이스에 저장된다
```

### 시나리오 2: 엣지 타입 변경
```gherkin
Given 캔버스에 생성된 엣지가 있다
When 사용자가 엣지를 우클릭하고 타입을 변경한다
Then 엣지 타입이 변경된다 (default, straight, step, smoothstep, simplebezier)
And 변경된 타입에 따라 엣지 모양이 업데이트된다
```

### 시나리오 3: 엣지 삭제
```gherkin
Given 캔버스에 생성된 엣지가 있다
When 사용자가 엣지를 선택하고 삭제 버튼을 클릭한다
Then 해당 엣지가 캔버스에서 제거된다
And 데이터베이스에서도 엣지 정보가 삭제된다
```

### 시나리오 4: 블럭 삭제 시 연결된 엣지 정리
```gherkin
Given 블럭에 연결된 엣지들이 있다
When 사용자가 해당 블럭을 삭제한다
Then 연결된 모든 엣지들이 자동으로 삭제된다
And 캔버스가 깔끔하게 정리된다
```

---

## 📋 개발 Task (도메인별)

### Canvas Management Domain
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [ ] EdgeAggregate 구현 (엣지 생성, 수정, 삭제 로직)
- [ ] Edge Entity 구현
- [ ] EdgeId, EdgeType Value Objects 구현
- [ ] Commands 정의 (CreateEdgeCommand, UpdateEdgeTypeCommand, DeleteEdgeCommand)
- [ ] Events 정의 (EdgeCreatedEvent, EdgeTypeChangedEvent, EdgeDeletedEvent)
- [ ] EdgeRepository 구현

#### Database
- [ ] edges 테이블 생성 (Drizzle migration)
- [ ] edge_type enum 활용 (default, straight, step, smoothstep, simplebezier)
- [ ] RLS 정책 적용 (페이지 접근 권한 기반)
- [ ] 연결된 엣지 자동 삭제 트리거

#### Server Actions
- [ ] createEdgeAction (엣지 생성)
- [ ] updateEdgeAction (엣지 타입/스타일 수정)
- [ ] deleteEdgeAction (엣지 삭제)

#### Frontend
- [ ] React Flow onConnect 이벤트 처리
- [ ] 엣지 타입 변경 UI (우클릭 메뉴 또는 속성 패널)
- [ ] 엣지 스타일링 (색상, 두께, 화살표)
- [ ] 엣지 편집 및 삭제 UI

---

### Testing & Quality
- [ ] Unit Tests (EdgeAggregate 엣지 관리 로직)
- [ ] Integration Tests (React Flow 엣지 연동)
- [ ] E2E Tests (엣지 생성/편집/삭제 플로우)

## 🎯 Definition of Done

### 기능 완료
- [ ] 드래그 앤 드롭으로 엣지 생성
- [ ] 엣지 타입 변경 (5가지 React Flow 기본 타입)
- [ ] 엣지 편집 및 삭제 기능
- [ ] 블럭 삭제 시 연결된 엣지 자동 정리

### 기술 완료
- [ ] 단위 테스트 커버리지 85% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 엣지 생성 성능 최적화
- [ ] 데이터 일관성 보장 (블럭-엣지 관계)
- [ ] 사용자 피드백 (엣지 상태 표시)

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: CM-002 (블럭 생성 및 마운팅), CM-003 (블럭 변환)
- **후행 Story**: CM-008 (블럭 삭제 및 엣지 정리)
- **도메인 의존성**: React Flow 엣지 렌더링 및 이벤트 처리

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Process Model](../../../event-domain-design/domains/canvas-management-domain/02-process-model.md) - Scenario 7 (엣지 생성 및 관리)
- [Software Design](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md) - Edge Aggregate
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md) - edges 테이블, edge_type enum
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md) - React Flow 엣지 관리

### Agile Planning
- [Epic 문서](../../epics/epic-002-canvas-management.md)
