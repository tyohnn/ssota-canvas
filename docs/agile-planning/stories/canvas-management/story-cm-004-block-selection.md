# Story CM-004: 블럭 선택 및 다중 선택

## 🎯 Story 개요
**User Story**: As a 디자이너, I want to 블럭을 선택하고 여러 블럭을 동시에 선택할 수 있어야 so that 선택된 블럭들에 대해 일괄 작업을 수행할 수 있다

**Story Points**: 8pts  
**우선순위**: Medium  
**Epic**: Epic-002 (Canvas Management Foundation)  
**Domain**: Canvas Management Domain  
**Sprint**: Sprint 008 (Canvas Management Foundation)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 단일 블럭 선택
```gherkin
Given 캔버스에 여러 블럭이 있다
When 사용자가 특정 블럭을 클릭한다
Then 해당 블럭만 선택된다
And 이전에 선택된 블럭들의 선택이 해제된다
And 선택된 블럭에 시각적 피드백이 표시된다
```

### 시나리오 2: 다중 블럭 선택 (Ctrl/Shift 클릭)
```gherkin
Given 사용자가 블럭 A를 선택한 상태이다
When Ctrl 키를 누른 상태로 블럭 B를 클릭한다
Then 블럭 A와 B가 모두 선택된 상태가 된다
And 기존 선택 상태가 유지된다
```

### 시나리오 3: 영역 선택 (박스 드래그)
```gherkin
Given 캔버스에 여러 블럭이 있다
When 사용자가 빈 공간에서 드래그하여 영역을 선택한다
Then 선택 영역 내의 모든 블럭이 선택된다
And 영역 선택 박스가 시각적으로 표시된다
```

### 시나리오 4: 전체 선택 (Ctrl+A)
```gherkin
Given 캔버스에 여러 블럭이 있다
When 사용자가 Ctrl+A를 누른다
Then 모든 블럭이 선택된다
And 선택된 블럭 수가 표시된다
```

---

## 📋 개발 Task (도메인별)

### Canvas Management Domain
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md)

#### Frontend Implementation
- [x] useCanvasManagement Hook에서 selectedBlockIds 상태 관리
- [x] useCanvasSelection Hook 구현 (선택 로직 캡슐화)
- [x] Commands 정의 (React Flow 기본 선택 메커니즘 활용)
- [x] 선택 상태 React Flow에서 관리

#### Frontend Components
- [x] React Flow onSelectionChange 이벤트 처리
- [x] 영역 선택 (SelectionMode) 활성화
- [x] 선택된 블럭 시각적 피드백 스타일링 (React Flow 기본 + 커스텀)
- [x] 선택 해제 로직 (빈 공간 클릭 시)
- [x] SelectionBoundingBox 커스텀 컴포넌트 구현
- [x] 선택 영역 드래그로 다중 블럭 이동

#### 선택 관리 로직
- [x] 단일 선택: 클릭 시 해당 블럭만 선택
- [x] 다중 선택: React Flow 기본 Ctrl/Shift 키 조합 지원
- [x] 영역 선택: React Flow SelectionMode 활용
- [x] 영역 선택 박스 시각적 스타일링 (파란색 반투명)

---

### Testing & Quality
- [x] Unit Tests (useCanvasSelection Hook)
- [x] Integration Tests (React Flow 선택 이벤트)
- [ ] E2E Tests (다양한 선택 시나리오)

## 🎯 Definition of Done

### 기능 완료
- [x] 단일 블럭 클릭 선택 정상 동작
- [x] Ctrl/Shift 키를 이용한 다중 선택 (React Flow 기본 기능)
- [x] 박스 드래그를 이용한 영역 선택
- [x] 선택 해제 (빈 공간 클릭)
- [x] 커스텀 SelectionBoundingBox로 다중 선택 시각화
- [x] 선택 영역 드래그로 다중 블럭 이동

### 기술 완료
- [x] 단위 테스트 작성 완료
- [x] Integration Tests 통과
- [ ] E2E Tests 작성 필요
- [x] 코드 리뷰 완료

### 품질 완료
- [x] 선택 상태 시각적 피드백 명확성 (커스텀 박스 + 영역 선택 스타일)
- [x] 키보드 접근성 지원 완료 (React Flow 기본 지원)
- [x] 성능 최적화 (DOM 측정 메모이제이션, willChange: transform)

## 📊 진행 상황
**현재**: 95% 완료 (E2E 테스트 제외 모든 기능 완료)

**완료일**: 2025-10-22 (Sprint 008)

**아키텍처 결정**:
- ✅ React Flow 기본 선택 메커니즘 활용 (onSelectionChange)
- ✅ 커스텀 SelectionBoundingBox 컴포넌트로 다중 선택 시각화
- ✅ DOM 측정 기반 정확한 선택 박스 렌더링
- ✅ 선택 영역 드래그 시 배치 위치 업데이트 (updateMultipleBlockPositionsAction)
- ✅ viewport 좌표 변환으로 줌/패닝 대응

## 🔗 의존성
- **선행 Story**: CM-002 (블럭 생성 및 마운팅), CM-003 (블럭 변환)
- **후행 Story**: CM-005 (블럭 정렬 도구), CM-008 (블럭 삭제)
- **Sprint**: [Sprint 008](../../sprints/sprint-008-canvas-foundation.md)
- **도메인 의존성**: React Flow SelectionMode 및 키보드 이벤트 처리

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Process Model](../../../event-domain-design/domains/canvas-management-domain/02-process-model.md) - Scenario 4 (블럭 선택 및 다중 선택)
- [Software Design](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md) - BlockMount Aggregate
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md) - useBlockSelection Hook, 선택 상태 관리

### Agile Planning
- [Epic 문서](../../epics/epic-002-canvas-management.md)
