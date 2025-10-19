# Story CM-008: 블럭 삭제 및 엣지 정리

## 🎯 Story 개요
**User Story**: As a 디자이너, I want to 불필요한 블럭을 삭제할 수 있고 연결된 엣지들이 자동으로 정리되어야 so that 캔버스를 깔끔하게 유지하고 데이터 일관성을 보장할 수 있다

**Story Points**: 5pts  
**우선순위**: Medium  
**Epic**: Epic-002 (Canvas Management Foundation)  
**Domain**: Canvas Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 단일 블럭 삭제
```gherkin
Given 사용자가 특정 블럭을 선택한 상태이다
When "삭제" 버튼을 클릭하거나 Delete 키를 누른다
Then 선택 확인 다이얼로그가 표시된다
When "확인"을 클릭한다
Then 해당 블럭이 캔버스에서 제거된다
And 데이터베이스에서 블럭 마운트가 soft delete된다
```

### 시나리오 2: 다중 블럭 삭제
```gherkin
Given 사용자가 여러 블럭을 선택한 상태이다
When "삭제" 버튼을 클릭한다
Then 선택된 블럭들이 모두 삭제된다
And 각 블럭에 연결된 엣지들도 자동으로 처리된다
```

### 시나리오 3: 연결된 엣지 자동 정리
```gherkin
Given 삭제할 블럭에 연결된 엣지들이 있다
When 블럭을 삭제한다
Then 연결된 모든 엣지들이 자동으로 삭제된다
And 데이터베이스에서 엣지 정보도 함께 제거된다
And 캔버스에 고아 엣지가 남지 않는다
```

### 시나리오 4: 삭제 취소
```gherkin
Given 사용자가 블럭 삭제를 요청했다
When "취소" 버튼을 클릭한다
Then 블럭이 삭제되지 않는다
And 이전 상태가 유지된다
```

---

## 📋 개발 Task (도메인별)

### Canvas Management Domain
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [ ] BlockMountAggregate deleteBlockMount 로직 구현
- [ ] EdgeAggregate deleteConnectedEdges 로직 구현
- [ ] Commands 정의 (DeleteBlockMountCommand, DeleteConnectedEdgesCommand)
- [ ] Events 정의 (BlockMountDeletedEvent, ConnectedEdgesDeletedEvent)
- [ ] 트랜잭션 처리 (블럭 삭제 + 연결된 엣지 삭제)

#### Database
- [ ] Soft Delete 구현 (deleted_at 컬럼 활용)
- [ ] 연결된 엣지 자동 삭제 제약조건 또는 트리거
- [ ] 삭제된 블럭/엣지 복구 로직 (향후 확장 가능)

#### Server Actions
- [ ] deleteBlockMountAction (블럭 삭제)
- [ ] batchDeleteBlocksAction (다중 블럭 삭제 최적화)

#### Frontend
- [ ] 블럭 삭제 확인 다이얼로그
- [ ] Delete 키보드 단축키 처리
- [ ] 선택된 블럭들의 삭제 처리
- [ ] React Flow에서 노드/엣지 제거

---

### Testing & Quality
- [ ] Unit Tests (삭제 로직 및 엣지 정리)
- [ ] Integration Tests (트랜잭션 처리)
- [ ] E2E Tests (삭제 플로우 및 복구)

## 🎯 Definition of Done

### 기능 완료
- [ ] 단일/다중 블럭 삭제 기능
- [ ] 삭제 확인 다이얼로그
- [ ] 연결된 엣지 자동 정리
- [ ] 삭제 취소 기능

### 기술 완료
- [ ] 단위 테스트 커버리지 85% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 데이터 일관성 보장 (블럭-엣지 관계)
- [ ] Soft Delete 로직 완성
- [ ] 사용자 안전장치 (삭제 확인)

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: CM-004 (블럭 선택), CM-007 (엣지 생성 및 관리)
- **후행 Story**: CM-009 (뷰포트 관리)
- **도메인 의존성**: 블럭-엣지 관계 트랜잭션 처리

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Process Model](../../../event-domain-design/domains/canvas-management-domain/02-process-model.md) - Scenario 8 (블럭 삭제 및 엣지 정리)
- [Software Design](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md) - BlockMount, Edge Aggregates
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md) - deleted_at 컬럼

### Agile Planning
- [Epic 문서](../../epics/epic-002-canvas-management.md)
