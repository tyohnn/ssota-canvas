# Story CM-005: 블럭 정렬 및 분포 도구

## 🎯 Story 개요
**User Story**: As a 디자이너, I want to 선택된 여러 블럭들을 정렬하고 균등하게 분포시킬 수 있어야 so that 일관된 레이아웃과 깔끔한 시각적 배치를 빠르게 만들 수 있다

**Story Points**: 8pts  
**우선순위**: Medium  
**Epic**: Epic-002 (Canvas Management Foundation)  
**Domain**: Canvas Management Domain  
**Sprint**: Sprint 008 (Canvas Management Foundation)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 블럭 정렬 (상, 하, 왼쪽, 오른쪽, 중심)
```gherkin
Given 사용자가 3개 이상의 블럭을 선택한 상태이다
When "상단 정렬" 버튼을 클릭한다
Then 선택된 모든 블럭이 가장 위쪽 블럭에 맞춰 상단 정렬된다
And 블럭들의 x좌표는 유지되며 y좌표만 변경된다
```

### 시나리오 2: 블럭 중심 정렬
```gherkin
Given 사용자가 여러 블럭을 선택한 상태이다
When "수평 중심 정렬" 버튼을 클릭한다
Then 선택된 모든 블럭이 중심선에 맞춰 정렬된다
And 블럭들의 y좌표는 유지되며 x좌표만 변경된다
```

### 시나리오 3: 블럭 균등 분포
```gherkin
Given 사용자가 3개 이상의 블럭을 선택한 상태이다
When "수평 균등 분포" 버튼을 클릭한다
Then 블럭들이 가장 왼쪽과 오른쪽 간격에 맞춰 균등하게 분포된다
And 블럭들의 상대적 순서는 유지된다
```

### 시나리오 4: 정렬 결과 저장
```gherkin
Given 사용자가 블럭 정렬 작업을 완료했다
When 정렬 도구를 사용한다
Then 변경된 블럭 위치들이 데이터베이스에 저장된다
And React Flow와 데이터베이스 상태가 동기화된다
```

---

## 📋 개발 Task (도메인별)

### Canvas Management Domain
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [x] ~~BlockMountAggregate alignBlocks, distributeBlocks 로직~~ (프론트엔드 계산으로 대체)
- [x] ~~Commands 정의~~ (updateMultipleBlockPositionsAction으로 대체)
- [x] ~~Events 정의~~ (일반 위치 업데이트 이벤트 사용)
- [x] 정렬 알고리즘 구현 (프론트엔드: useCanvasBlockTransform Hook)

#### Database
- [x] ~~alignment_type enum~~ (사용하지 않음)
- [x] 배치 업데이트를 위한 트랜잭션 처리 (updateMultipleBlockPositionsAction)

#### Server Actions
- [x] updateMultipleBlockPositionsAction (배치 위치 업데이트)
- [x] ~~alignBlocksAction, distributeBlocksAction~~ (프론트엔드 계산으로 대체)

#### Frontend
- [x] MultiSelectionToolbar 컴포넌트 구현 (정렬 도구 버튼들)
- [x] 정렬 버튼들 (좌, 우, 상, 하, 중심)
- [x] 분포 버튼들 (수평, 수직) - 2개 이상 블럭으로 가능
- [x] 선택된 블럭 수에 따른 버튼 활성화/비활성화
- [x] 정렬 결과 시각적 피드백 (즉시 적용)
- [x] useCanvasBlockTransform Hook에 정렬/분포 로직 구현
- [x] 동적 툴바 위치 (선택 박스 상단에 표시)

---

### Testing & Quality
- [x] Unit Tests (정렬 알고리즘 로직: useCanvasBlockTransform)
- [x] Integration Tests (다중 블럭 정렬 처리)
- [ ] E2E Tests (정렬 도구 사용 플로우)

## 🎯 Definition of Done

### 기능 완료
- [x] 좌우상하 정렬 기능 (4방향)
- [x] 중심 정렬 기능 (수평/수직)
- [x] 균등 분포 기능 (수평/수직) - 2개 이상 블럭으로 가능
- [x] 선택된 블럭에 대해서만 정렬 적용
- [x] 정렬 결과 데이터베이스 배치 저장 (updateMultipleBlockPositionsAction)

### 기술 완료
- [x] 단위 테스트 작성 완료
- [x] Integration Tests 통과
- [ ] E2E Tests 작성 필요
- [x] 코드 리뷰 완료

### 품질 완료
- [x] 정렬 알고리즘 정확성 검증 (프론트엔드 계산)
- [x] 대량 블럭 정렬 성능 최적화 (배치 업데이트)
- [x] 사용자 피드백 (즉시 시각적 반영, 툴바 동적 위치)
- [x] DOM 측정 기반 정확한 블럭 크기 계산
- [x] viewport 좌표 변환으로 줌/패닝 대응

## 📊 진행 상황
**현재**: 95% 완료 (E2E 테스트 제외 모든 기능 완료)

**완료일**: 2025-10-22 (Sprint 008)

**아키텍처 결정**:
- ✅ 프론트엔드에서 정렬/분포 계산 → 서버에 최종 위치만 전송 (updateMultipleBlockPositionsAction)
- ❌ AlignBlocksCommand, DistributeBlocksCommand 사용하지 않음 (프론트엔드 계산으로 대체)
- ✅ DOM 측정으로 정확한 블럭 크기 파악 (offsetWidth/offsetHeight)
- ✅ 분포 기능 2개 이상 블럭으로 가능하도록 수정
- ✅ MultiSelectionToolbar 동적 위치 (선택 박스 상단, viewport 좌표 변환)

## 🔗 의존성
- **선행 Story**: CM-004 (블럭 선택 및 다중 선택)
- **후행 Story**: CM-006 (스마트 가이드라인 및 스냅)
- **Sprint**: [Sprint 008](../../sprints/sprint-008-canvas-foundation.md)
- **도메인 의존성**: 다중 블럭 선택 상태 및 정렬 알고리즘

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Process Model](../../../event-domain-design/domains/canvas-management-domain/02-process-model.md) - Scenario 5 (블럭 정렬 도구)
- [Software Design](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md) - BlockMount Aggregate
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md) - alignment_type enum
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md) - BlockToolbar

### Agile Planning
- [Epic 문서](../../epics/epic-002-canvas-management.md)
