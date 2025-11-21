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
- [x] BlockMountAggregate deleteBlockMount 로직 구현
- [x] EdgeAggregate deleteEdge 로직 구현 (CM-007에서 완료)
- [x] Commands 정의 (DeleteBlockMountCommand, DeleteMultipleBlockMountsCommand)
- [x] Events 정의 (BlockMountDeletedEvent - CM-007에서 완료)
- [x] 트랜잭션 처리 (블럭 삭제 + 연결된 엣지 삭제)

#### Database
- [x] Soft Delete 스키마 설계 완료 (deleted_at 컬럼)
- [x] 연결된 엣지 자동 삭제 (Service Layer에서 처리)
- [ ] 삭제된 블럭/엣지 복구 로직 (향후 확장 가능)

#### Server Actions
- [x] deleteBlockMountAction (블럭 삭제)
- [x] deleteMultipleBlockMountsAction (다중 블럭 삭제)

#### Frontend
- [ ] 블럭 삭제 확인 다이얼로그 (향후 UX 개선 시 추가 예정)
- [x] Delete 키보드 단축키 처리 (onNodesDelete 콜백)
- [x] 선택된 블럭들의 삭제 처리 (단일/다중)
- [x] React Flow에서 노드/엣지 제거 (Optimistic UI)
- [x] useCanvasBlockLifecycle Hook 통합
- [x] BlockMountToolbar 삭제 버튼 구현
- [x] MultiSelectionToolbar 삭제 버튼 구현
- [x] Optimistic 노드 삭제 처리 (서버 호출 없이 UI에서만 제거)

---

### Testing & Quality
- [x] Unit Tests (BlockMountAggregate, EdgeAggregate - CM-007에서 완료)
- [x] Integration Tests (Service Layer 트랜잭션 처리)
- [x] E2E Tests 플레이스홀더 작성 (추후 통합 테스트 단계에서 구현)

## 🎯 Definition of Done

### 기능 완료
- [x] 단일/다중 블럭 삭제 기능
- [ ] 삭제 확인 다이얼로그 (향후 UX 개선 시 추가 예정)
- [x] 연결된 엣지 자동 정리
- [x] Optimistic UI 패턴으로 즉시 UI 반응성 제공

### 기술 완료
- [x] Aggregate 및 Entity 레벨 테스트 완료 (CM-007에서 완료)
- [x] Service Layer 통합 테스트 (삭제 + 엣지 정리 트랜잭션)
- [x] E2E Tests 플레이스홀더 작성
- [x] 코드 리뷰 준비 완료

### 품질 완료
- [x] 데이터 일관성 보장 (블럭-엣지 관계, 트랜잭션 처리)
- [x] Repository Layer에서 delete 구현
- [x] Optimistic UI로 사용자 경험 향상
- [ ] 삭제 확인 다이얼로그 (향후 추가 예정)

## 📊 진행 상황
**현재**: 100% 완료 (핵심 기능 구현 완료, Hook 에러 해결 완료)

### 완료된 주요 기능
- ✅ DeleteBlockMountCommand, DeleteMultipleBlockMountsCommand 정의
- ✅ BlockMountDeletedDTO, MultipleBlockMountsDeletedDTO 정의
- ✅ CanvasManagementService.deleteBlockMount() (연결된 엣지 자동 정리)
- ✅ CanvasManagementService.deleteMultipleBlockMounts()
- ✅ deleteBlockMountAction Server Action
- ✅ deleteMultipleBlockMountsAction Server Action
- ✅ useCanvasBlockLifecycle.deleteBlock() (Optimistic UI)
- ✅ useCanvasBlockLifecycle.deleteMultipleBlocks()
- ✅ BlockMountToolbar 삭제 버튼 통합
- ✅ MultiSelectionToolbar 삭제 버튼 통합
- ✅ React Flow onNodesDelete 콜백 (Delete/Backspace 키)
- ✅ Optimistic 노드 필터링 (서버 미저장 노드 처리)
- ✅ Hook 에러 해결 (Invalid hook call 문제 해결)
- ✅ React Flow Store 직접 조작 (nodes 배열 필터링)
- ✅ E2E 테스트 플레이스홀더 작성

### 남은 작업
- ⏳ 삭제 확인 다이얼로그 (UX 개선 시 추가)
- ⏳ E2E 테스트 실제 구현 (통합 테스트 단계에서 진행)

### 최근 해결된 문제
- ✅ **Hook 에러 해결**: "Invalid hook call" 에러 완전 해결
- ✅ **React Flow Store 직접 조작**: `useReactFlow` Hook 대신 `useStore`로 nodes 배열 직접 조작
- ✅ **중복 삭제 방지**: 툴바 삭제와 키보드 삭제 경로 분리
- ✅ **성능 최적화**: 불필요한 Hook 호출 제거

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
