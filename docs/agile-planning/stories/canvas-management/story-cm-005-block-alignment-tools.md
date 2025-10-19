# Story CM-005: 블럭 정렬 및 분포 도구

## 🎯 Story 개요
**User Story**: As a 디자이너, I want to 선택된 여러 블럭들을 정렬하고 균등하게 분포시킬 수 있어야 so that 일관된 레이아웃과 깔끔한 시각적 배치를 빠르게 만들 수 있다

**Story Points**: 8pts  
**우선순위**: Medium  
**Epic**: Epic-002 (Canvas Management Foundation)  
**Domain**: Canvas Management Domain

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
- [ ] BlockMountAggregate alignBlocks, distributeBlocks 로직 구현
- [ ] Commands 정의 (AlignBlocksCommand, DistributeBlocksCommand)
- [ ] Events 정의 (BlocksAlignedEvent, BlocksDistributedEvent)
- [ ] 정렬 알고리즘 구현 (상하좌우정렬, 중심정렬, 균등분포)

#### Database
- [ ] alignment_type enum 활용 (TOP, BOTTOM, LEFT, RIGHT, HORIZONTAL_CENTER, VERTICAL_CENTER, HORIZONTAL_DISTRIBUTE, VERTICAL_DISTRIBUTE)
- [ ] 배치 업데이트를 위한 트랜잭션 처리

#### Server Actions
- [ ] alignBlocksAction (정렬 처리)
- [ ] distributeBlocksAction (분포 처리)

#### Frontend
- [ ] BlockToolbar에 정렬 도구 버튼들 추가
- [ ] 정렬 버튼들 (상, 하, 좌, 우, 수평중심, 수직중심, 수평분포, 수직분포)
- [ ] 선택된 블럭 수에 따른 버튼 활성화/비활성화
- [ ] 정렬 결과 시각적 피드백

---

### Testing & Quality
- [ ] Unit Tests (정렬 알고리즘 로직)
- [ ] Integration Tests (다중 블럭 정렬 처리)
- [ ] E2E Tests (정렬 도구 사용 플로우)

## 🎯 Definition of Done

### 기능 완료
- [ ] 상하좌우 정렬 기능 (4방향)
- [ ] 중심 정렬 기능 (수평/수직)
- [ ] 균등 분포 기능 (수평/수직)
- [ ] 선택된 블럭에 대해서만 정렬 적용
- [ ] 정렬 결과 데이터베이스 저장

### 기술 완료
- [ ] 단위 테스트 커버리지 85% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 정렬 알고리즘 정확성 검증
- [ ] 대량 블럭 정렬 성능 최적화
- [ ] 사용자 피드백 (정렬 중/완료 상태 표시)

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: CM-004 (블럭 선택 및 다중 선택)
- **후행 Story**: CM-006 (스마트 가이드라인 및 스냅)
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
