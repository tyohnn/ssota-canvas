# Story CM-003: 블럭 변환 (이동, 리사이즈, Z-Order)

## 🎯 Story 개요
**User Story**: As a 디자이너, I want to 블럭을 드래그하여 이동시키고 크기를 조절하며 레이어 순서를 변경할 수 있어야 so that 원하는 레이아웃으로 시각적 요소를 정확히 배치할 수 있다

**Story Points**: 13pts  
**우선순위**: High  
**Epic**: Epic-002 (Canvas Management Foundation)  
**Domain**: Canvas Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 블럭 드래그 이동
```gherkin
Given 사용자가 블럭을 선택한 상태이다
When 블럭을 드래그하여 이동시킨다
Then 블럭이 실시간으로 마우스를 따라 이동한다
And 드래그가 끝날 때 블럭의 최종 위치가 데이터베이스에 저장된다
And React Flow와 데이터베이스 상태가 동기화된다
```

### 시나리오 2: 블럭 리사이즈
```gherkin
Given 사용자가 블럭을 선택한 상태이다
When 블럭의 크기 조절 핸들을 드래그한다
Then 블럭 크기가 실시간으로 변경된다
And 최소/최대 크기 제한이 적용된다
When 리사이즈가 완료된다
Then 최종 크기가 데이터베이스에 저장된다
```

### 시나리오 3: Z-Order 변경
```gherkin
Given 캔버스에 여러 블럭이 겹쳐있다
When 사용자가 특정 블럭의 Z-Order를 변경한다
Then 해당 블럭이 다른 블럭들 위로 이동하거나 아래로 이동한다
And 변경된 Z-Order가 데이터베이스에 반영된다
```

---

## 📋 개발 Task (도메인별)

### Canvas Management Domain
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [ ] BlockMountAggregate TransformBlock 로직 구현
- [ ] Position, Size, ZOrder Value Objects 업데이트 메서드
- [ ] Commands 정의 (TransformBlockCommand)
- [ ] Events 정의 (BlockTransformedEvent)
- [ ] BlockMountRepository 업데이트 메서드 구현

#### Database
- [ ] block_mounts 테이블 position, size, z_order 컬럼 활용
- [ ] 변환 로그 및 성능 최적화 인덱스

#### Server Actions
- [ ] transformBlockAction (위치, 크기, Z-Order 변경)
- [ ] batchUpdateBlocksAction (다중 블럭 변환 시 최적화)

#### Frontend
- [ ] React Flow 드래그/리사이즈 이벤트 처리
- [ ] useOptimistic으로 실시간 UI 업데이트
- [ ] 드래그 종료 시 최종 위치 저장 로직
- [ ] Z-Order 변경 UI (우클릭 메뉴 또는 별도 컨트롤)

---

### 도메인 간 통합
- [ ] React Flow State (단기 SoT) ↔ Database (장기 SoT) 동기화
- [ ] 드래그 성능 최적화 (디바운싱, 배치 업데이트)

---

### Testing & Quality
- [ ] Unit Tests (BlockMountAggregate 변환 로직)
- [ ] Integration Tests (React Flow ↔ Database 동기화)
- [ ] E2E Tests (드래그, 리사이즈, Z-Order 변경 플로우)
- [ ] 성능 테스트 (다중 블럭 동시 변환)

## 🎯 Definition of Done

### 기능 완료
- [ ] 블럭 드래그로 위치 변경 (실시간 + 최종 저장)
- [ ] 블럭 리사이즈 기능 (최소/최대 제한 포함)
- [ ] Z-Order 변경 기능 (다른 블럭과의 겹침 관리)
- [ ] React Flow와 데이터베이스 완전 동기화

### 기술 완료
- [ ] 단위 테스트 커버리지 85% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과 (60fps 드래그 성능)
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 드래그 성능 최적화 (부드러운 60fps 유지)
- [ ] 에러 처리 및 롤백 메커니즘 완료
- [ ] 사용자 피드백 (변경 사항 표시, 저장 상태) 완료

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: CM-002 (블럭 생성 및 마운팅)
- **후행 Story**: CM-006 (스마트 가이드라인 및 스냅), CM-004 (블럭 선택)
- **도메인 의존성**: React Flow 라이브러리 통합 및 성능 최적화

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Process Model](../../../event-domain-design/domains/canvas-management-domain/02-process-model.md) - Scenario 2 (블럭 변환)
- [Software Design](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md) - BlockMount Aggregate
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md) - block_mounts 테이블
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md) - React Flow 통합, useOptimistic

### Agile Planning
- [Epic 문서](../../epics/epic-002-canvas-management.md)
